export interface IResult {
  pending: boolean
  error: boolean
  message: string | null
}
export interface IMethods {
  [key:string]: Function
}

export default class InternalAPI {

  result:IResult = {
    pending: false,
    error: false,
    message: null
  }
  methods!:IMethods

  async query(query:string, variables:Object = {}, auth?:string) {
    this.result.error = false
    this.result.pending = true

    try {
      const res = await fetch('https://api.tubbyland.com/graphql', {
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
        if (apiRes.errors) {
          console.error(apiRes.errors)

          this.result.error = true
          this.result.message = 'Invalid request.'
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
