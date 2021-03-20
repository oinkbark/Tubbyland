import InternalAPI from './InternalAPI'

export default class LoginFlow {
  constructor(store?:any) {
    this.store = store
  }
  store: any = null
  api = new InternalAPI()
  host = process.env.NODE_ENV === 'production' ? 'https://tubbyland.com' : 'localhost:3000'
  googleQuery:any = {
    client_id: '750423219705-0o7095rtr5nn2o5637ud576j7h6i08ql.apps.googleusercontent.com',
    redirect_uri: `${this.host}/login`,
    response_type: 'code',
    access_type: 'offline',
    flowName: 'GeneralOAuthFlow',
    scope: 'openid profile email'
  }
  processedCodes:Set<string> = new Set()

  generateProviderLink() {
    let flowLink = 'https://accounts.google.com/o/oauth2/auth?protocol=oauth2'
    for (const rawKey in this.googleQuery) {
      const key = encodeURIComponent(rawKey)
      const value = encodeURIComponent(this.googleQuery[rawKey])
      flowLink += `&${key}=${value}`
    }
    return flowLink
  }
  async intakeOauthCode(event:any) {
    if (!event.data || event.type !== 'message') return
    if (event.origin !== this.host) return console.error('bad host')

    window.removeEventListener('message', (e) => { this.intakeOauthCode(e) })

    const oauth = {
      code: event.data,
      provider: 'Google'
    }

    await this.generateSessionData(oauth)
  }
  // The server will set a session cookie from this
  async generateSessionData({ code, provider }:any) {
    if (this.processedCodes.has(code)) return

    this.processedCodes.add(code)
    this.api.result.message = null
    this.store.commit('setAuthPending', true)

    const query = "mutation { login { name, email, icon } }"
    const apiRes = await this.api.query(query, {}, `OAuth ${code} ${provider}`)
    const payload = apiRes?.login

    if (this.store && payload) {
      window.localStorage.setItem('auth', JSON.stringify(payload))
      this.store.commit('login', payload)
      this.store.dispatch('art/populatePreviews', { index: 'draft' })
      
      const callback = this.store.state.callback
      await callback.method?.apply(callback.thisContext, callback.args)
    }
    else if (!payload && this.api.result.error) {
      if (this.api.result.message!.startsWith('Invalid request')) {
        this.store.commit('denyLogin', true)
      }
    }
    this.store.commit('setAuthPending', false)
  }
  async logout() {
    window.localStorage.removeItem('auth')
    this.store.commit('logout')
    this.store.commit('art/removeAuthorizedData')

    const query = "mutation { logout }"
    await this.api.query(query)
    this.api.result.message = null
  }
  loginWithGoogle() {
    const windowFeatures = 'toolbar=no,menubar=no,width=600,height=700,top=100,left=100'
    const googleLink = this.generateProviderLink()

    window.removeEventListener('message', (e) => { this.intakeOauthCode(e) })
    window.addEventListener('message', (e) => { this.intakeOauthCode(e) })
    return window.open(googleLink, 'tubbyland', windowFeatures)
  }
}
