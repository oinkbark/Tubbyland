export interface IResult {
  pending: boolean
  error: boolean
  message: string | null,
  rawMessage: string | null,
  reset: Function
}
export interface IMethods {
  [key:string]: Function
}

export default class InternalAPI {

  result:IResult = {
    pending: false,
    error: false,
    rawMessage: null,
    message: null,
    reset: function () {
      this.pending = false
      this.error = false
      this.rawMessage = null
      this.message = null
    }
  }
  methods!:IMethods

  get host() {
    let value = ''
    let previewMode = false

    try {
      if (location) previewMode = Boolean(location.hostname === 'preview.tubbyland.com')
    } catch { }
    try {
      if (process) previewMode = Boolean(process.env.PREVIEW)
    } catch { }

    value = previewMode ? 'https://preview.tubbyland.com' : 'https://api.tubbyland.com'
    return value
  }

  async query(query:string, variables:Object = {}, auth?:string) {
    this.result.error = false
    this.result.pending = true
    this.result.rawMessage = null

    try {
      const res = await fetch(`${this.host}/graphql`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
          ...(auth) && { 'Authorization': auth },
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, variables })
      })

      this.result.pending = false

      if (res?.ok !== true && res.status !== 400) {
        console.error(res)
        this.result.error = true
        this.result.message = 'Cannot connect to Tubbyland backend servers :('
        return null
      }
      else {
        const apiRes = await res.json()
        if (apiRes.errors?.length) {
          console.error(apiRes.errors)
          this.result.error = true
          this.result.rawMessage = apiRes.errors[0].message

          if (apiRes.errors[0].message?.startsWith('invalid_token')) {
            this.result.message = 'Invalid account session.'
          } else {
            this.result.message = 'Invalid request.'
          }

          return null
        }
        else {
          this.result.message = 'Successfully completed request.'
          return apiRes.data
        }
      }
    } 
    catch (e) {
      console.error(e)
      return null
    }
  }
}
