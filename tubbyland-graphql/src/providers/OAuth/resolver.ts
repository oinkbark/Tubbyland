import { Resolver, Mutation, Query, Ctx, Authorized } from 'type-graphql'
import { Context } from 'koa'
import { ApolloError } from 'apollo-server-koa'
import GoogleFlow from '../../middleware/GoogleFlow'
import * as Types from './output'

// https://developers.google.com/identity/protocols/oauth2
import { IAMCredentialsClient } from '@google-cloud/iam-credentials'
import { BrowserKey } from 'secrets'


@Resolver()
export default class OAuthResolver {

  @Authorized()
  @Mutation(() => Types.OAuthUser)
  async login(@Ctx() ctx: Context) {

    if (!ctx.isNew) throw new ApolloError('Bad Request: Session already exists', '400')

    const session = await ctx.sessionStore.get(ctx.sessionKey)
    return session.oauth.user
  }

  @Authorized()
  @Mutation(() => Boolean)
  async logout(@Ctx() ctx:Context):Promise<boolean> {

    //const oauthProvider = ctx.session.oauth.provider
    const oauthFlow = new GoogleFlow()
    const session = await ctx.sessionStore.get(ctx.sessionKey)

    try {
      const providerToken = session.oauth.tokens.access_token
      await oauthFlow.revokeToken(providerToken)
    } catch(e) {
      console.error(e)
    }

    await ctx.sessionStore.destroy(ctx.sessionKey)

    ctx.cookies.set('oinkserver.session', 'logout', {
      overwrite: true, 
      expires: new Date(0),
      sameSite: 'strict',
      secure: true,
      httpOnly: true,
      domain: '.tubbyland.com'
    })

    return true
  }

  @Authorized()
  @Query()
  hasActiveSession ():boolean {
    return true
  }

  @Authorized()
  @Mutation(() => Types.OAuthResponse)
  async accessBucketResource(@Ctx() ctx: Context) {
      //https://github.com/googleapis/nodejs-iam-credentials/blob/master/src/v1/i_a_m_credentials_client.ts
      // Max lifetime of 3600 seconds (one hour)

      const browserClient = new IAMCredentialsClient({
        projectId: 'tubbyland',
        credentials: BrowserKey
      })
      // Must have roles/iam.serviceAccountTokenCreator
      const serviceAccount = BrowserKey.client_id

      // same as const browserToken = result[0].accessToken
      const [{ accessToken: browserToken, expireTime }]:any = await browserClient.generateAccessToken({
        name: `projects/-/serviceAccounts/${serviceAccount}`,
        scope: ['https://www.googleapis.com/auth/cloud-platform'],
        lifetime: { seconds: 600 }
      })
      const expiryEpoch = Number(expireTime.seconds) * 1000

      ctx.response.set('Authorization', `Bearer ${browserToken}`)
      return {
        token: {
          value: browserToken,
          expiration: new Date(expiryEpoch)
        }
      }
  }
}
