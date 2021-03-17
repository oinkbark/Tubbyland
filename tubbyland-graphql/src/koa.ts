/*
  Server Layout
  Koa uses node driver to talk to mongo and translate requests into commands
  krakend forwards the graphql query from the Nuxt client to the Koa server
  [ Mongo -> Koa + GraphQL -> Krakend ] [ Vue Client ]
*/

// APP
import Koa from 'koa'
//import session from 'koa-session'
import SessionStore from './services/SessionStore'
import * as Endpoints  from './endpoints'

// GraphQL
import 'reflect-metadata'
import 'koa-bodyparser'
import '@koa/cors'
import { ApolloServer } from 'apollo-server-koa'
import compileSchema from './schema'
import QueryPlugin from './middleware/QueryPlugin'


export async function main () {

  // const cookieStore = new SessionStore()
  // await cookieStore.verifyRedisConnection()
  // await cookieStore.set('OinkServer', 'test')
  // await cookieStore.get('OinkServer')
  // .redis.connected: false,
  // .redis.ready: false

  // const sessionConfig = {
  //   key: 'oinkserver.session',
  //   //domain: "localhost:3000",
  //   maxAge: 86400000,
  //   httpOnly: true, /** (boolean) httpOnly or not (default true) */
  //   rolling: false, /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
  //   renew: false, /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/
  //   // consider toLowerCase
  //   secure: Boolean(process.env.NODE_ENV === 'production'), /** (boolean) secure cookie*/
  //   //sameSite: undefined, /** (string) session cookie sameSite options (default null, don't set it) */,
  //   signed: false,
  //   store: {
  //     get: cookieStore.get.bind(cookieStore),
  //     set: cookieStore.set.bind(cookieStore),
  //     destroy: cookieStore.destroy.bind(cookieStore)
  //   }
  // }
  // console.log(await sessionConfig.store.get('OinkServer'))
  // console.log(await sessionConfig.store.set('OinkServer', 'test2'))
  // console.log(await sessionConfig.store.get('OinkServer'))


  let app = new Koa()
  app.proxy = Boolean(process.env.NODE_ENV === 'production')

  const sessionStore = new SessionStore()
  //app.use(session(sessionConfig, app))
  const QuerySchema = await compileSchema()
  const QueryComplexity = new QueryPlugin(QuerySchema)
  const maxComplexity = 50

  // GraphQL
  const server = new ApolloServer({
    schema: QuerySchema,
    context: async ({ ctx: { request, response, cookies } }:any) => { return { request, response, cookies, sessionStore } },
    introspection: true,
    playground: true,
    plugins: [{
      requestDidStart: () => ({
        didResolveOperation({ request, document }:any) {
          QueryComplexity.validateComplexity(request, document, maxComplexity)
        }
      })
    }]
  })
  server.applyMiddleware({ 
    app, 
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      allowMethods: 'GET,POST,OPTIONS,HEAD',
      // Authorization must always be listed explicitly (cannot even be wildcarded)
      exposeHeaders: ['Authorization', 'Set-Cookie']
    } 
  })

  //app.use(KoaBody())
  app.use(Endpoints.ping.routes())
  app.use(Endpoints.ping.allowedMethods())

  app.on('error', console.error)
  app.on('session:missed', () => console.error('Cannot connect to external session store'))


  process.on('uncaughtException', (err:any) => {
    console.error('Caught exception: ', err.stack)
    // Do not want prod app running in unknown state
    // Nomad will auto restart it
    if (process.env.NODE_ENV === 'production') return process.exit()
  })

  // SERVER
  const PORT = process.env.PORT || 8080
  console.log(`:${PORT}/graphql`)
  console.log(`:${PORT}/endpoint`)
  app.listen(PORT)
}

main()
