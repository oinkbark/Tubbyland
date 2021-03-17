import { AuthenticationError } from 'apollo-server-koa'
import { v4 as generateApiToken } from 'uuid'
//import { Context } from 'koa'
import GoogleFlow from './GoogleFlow'
import { EmailWhitelist } from 'secrets'

// https://tools.ietf.org/html/rfc6750

export default async ({ context }:any, _roles?:any) => {
  let authHeader = context.request.headers.authorization || ''

  if (!authHeader) {
    const currentSession = context.cookies.get('oinkserver.session')
    if (currentSession) authHeader = `Bearer ${currentSession}`
    else throw new AuthenticationError('invalid_request: Missing authentication header')
  }

  const authParts = authHeader.split(' ')
  const authScheme:string = authParts[0]
  const authKey:string = authParts[1]

  if (!authScheme) throw new AuthenticationError('invalid_request: Missing authentication scheme')
  if (!authKey) throw new AuthenticationError('invalid_request: Missing authentication key')

  const sessionOnline = await context.sessionStore.verifyRedisConnection()
  if (!sessionOnline) throw new AuthenticationError('Internal Server Error: Session store is offline')
  
  if (authScheme === 'Bearer') {
    const hasSession = await context.sessionStore.get(authKey)
    if (!hasSession) throw new AuthenticationError('invalid_token: Bearer token is not valid')
    context.sessionKey = authKey
    return true
  }
  else if (authScheme === 'OAuth') {
    const oauthProvider = (authParts[2] || '').toLowerCase()
    if (!oauthProvider) throw new AuthenticationError('invalid_request: Missing OAuth provider')

    let oauthFlow = null
    if (oauthProvider === 'google') oauthFlow = new GoogleFlow()
    if (!oauthFlow) throw new AuthenticationError('invalid_request: OAuth provider is not supported')

    const oauthTokens = await oauthFlow.getTokens(authKey)
    if (!oauthTokens) throw new AuthenticationError('invalid_code: OAuth code is not valid')

    const oauthUser = await oauthFlow.getUserInfo(oauthTokens)
    if (!oauthUser) throw new AuthenticationError('Internal Server Error: Cannot fetch user info')

    if(!EmailWhitelist.emails.includes(oauthUser!.email)) {
      throw new AuthenticationError('insufficient_scope: Email is not whitelisted')
    }

    const resToken = generateApiToken()
    // Server Data
    context.sessionKey = resToken
    context.isNew = true
    await context.sessionStore.set(resToken, {
      oauth: { provider: oauthProvider, user: oauthUser, tokens: oauthTokens }
    })
    // Client Data
    context.response.set('Authorization', `Bearer ${resToken}`)
    context.cookies.set('oinkserver.session', resToken, {
      overwrite: true,
      sameSite: 'strict',
      secure: true,
      httpOnly: true,
      domain: '.tubbyland.com'
    })
    return true
  }
  else throw new AuthenticationError('invalid_request: Authorization scheme is not supported')
}
