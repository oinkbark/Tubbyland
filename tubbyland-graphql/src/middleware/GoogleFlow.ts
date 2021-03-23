import { OAuth2Client as GoogleOAuth2Client } from 'google-auth-library'
import { GoogleOAuthKey } from 'secrets'

export default class GoogleFlow {
  private apiOptions = {
    clientId: GoogleOAuthKey.web.client_id,
    clientSecret: GoogleOAuthKey.web.client_secret,
    redirectUri: GoogleOAuthKey.web.redirect_uris[0]
  }
  apiClient = new GoogleOAuth2Client(this.apiOptions)

  async getTokens(oauthCode:string) {
    try { 
      const r = await this.apiClient.getToken(oauthCode)
      return r.tokens
    } catch(e) {
      console.error(e)
      return false
    }
  }
  async getUserInfo(liveTokens:any) {
    this.apiClient.setCredentials(liveTokens)

    const apiLink = 'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos'
    const apiRes = await this.apiClient.request({ url: apiLink })
    const apiData:any = apiRes.data
    if (!apiData) return null
  
    const apiParsed = {
      email: apiData.emailAddresses[0]!.value || '',
      name: apiData.names[0]!.displayName || apiData.emailAddresses[0].value!.split('@')[0],
      icon: apiData.photos[0]!.url || ''
    }
    return apiParsed
  }
  async revokeToken(token:any) {
    return await this.apiClient.revokeToken(token)
  }
}
