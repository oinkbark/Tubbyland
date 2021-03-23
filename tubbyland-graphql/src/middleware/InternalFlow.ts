import { Internal } from 'secrets'

export default class InternalFlow {

  async getTokens(oauthCode:string) {
    if (!Internal.tokens.includes(oauthCode)) return null
    return {
      internal: true
    }
  }
  async getUserInfo(_liveTokens:any) {
    const userStub = {
      email: 'example@example.com',
      name: 'Preview User',
      icon: 'https://storage.googleapis.com/tubbyland.com/png/oinkbark.png'
    }
    return userStub
  }
  async revokeToken(_token:any) {
    return
  }
}