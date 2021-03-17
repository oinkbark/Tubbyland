import InternalAPI from './InternalAPI'

export interface IToken {
  value: string
  expiration: Date
}

export default class GoogleAPI {
  token!:IToken

  async verifyToken() {
    let shouldGenerate:boolean = true

    if (this.token) {
      const expireTime = this.token.expiration.getTime()
      const currentTime = new Date().getTime()
      if (Boolean(expireTime > currentTime)) shouldGenerate = false
    }

    if (shouldGenerate) await this.generateAccessToken()
  }

  async generateAccessToken() {
    const internal = new InternalAPI()
    const query = 'mutation { accessBucketResource { token { value, expiration } } }'
    const variables = { }
    const apiRes = await internal.query(query, variables)
    const payload = apiRes?.accessBucketResource

    if (payload) {
      const { value, expiration } = payload.token
      this.token = { 
        value, 
        expiration: new Date(expiration) 
      }
    }

    return payload
  }

  async fetchBucketObject(bucketName:string, objectName: string) {
    const endpointBase = 'https://storage.googleapis.com/storage/v1/b'
    let mediaData = null
    try {
      await this.verifyToken()

      const url = `${endpointBase}/${bucketName}.tubbyland.com/o/${encodeURIComponent(objectName)}?alt=media`
      const apiRes = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token.value}`
        }
      })
      const rawData = await apiRes.blob()

      mediaData = URL.createObjectURL(rawData)
    } catch(e) {
      console.error(e)
    }

    return mediaData
  }

  async uploadBucketObject(bucketName:string, objectName: string, objectData:any) {
    const endpointBase = 'https://storage.googleapis.com/upload/storage/v1/b'

    const params = {
      name: objectName,
      uploadType: 'media'
    }
    try {
      await this.verifyToken()

      const url = `${endpointBase}/${bucketName}.tubbyland.com/o?${new URLSearchParams(params)}`
      await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token.value}`
        },
        body: objectData
      })
    } catch(e) {
      console.error(e)
    }
  }

  async deleteBucketObject(bucketName:string, objectName: string) {
    const endpointBase = 'https://storage.googleapis.com/storage/v1/b'
    try {
      await this.verifyToken()

      const url = `${endpointBase}/${bucketName}.tubbyland.com/o/${encodeURIComponent(objectName)}`
      await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token.value}`
        }
      })
    } catch(e) {
      console.error(e)
    }
  }
}
