import fs from 'fs'
import path from 'path'
// import os from 'os'

import address from 'address'
import defaultGateway from 'default-gateway'

import Koa from 'koa'
import KoaRouter from '@koa/router'
import serve from 'koa-static'
import convertMiddleware from 'koa-connect'
import { createServer as createViteServer } from 'vite'

const isProd = Boolean(process.env.NODE_ENV === 'production')

// import { fileURLToPath } from 'url';
//const resolve = (p:string) => path.join(fileURLToPath(import.meta.url), p)
const resolve = (p:string) => path.join(__dirname, p)

export async function main () {

  const app = new Koa()
  const router = new KoaRouter()
  let vite:any

  let manifest = {}
  let template:any
  let renderFunction: Function

  app.proxy = isProd

  router.get('/art/:project', async (ctx, next) => {
    let file
    let commitPlan

    if (ctx.query.stub) {
      try {
        file = await import(`./stubs/project.${ctx.params.project}.json`)
        commitPlan = file
      } catch { }
    } else {
      file = await import('./prefetch/artProject')
      commitPlan = await file.returnCommitPlan(ctx.params.project)
    }

    if (commitPlan?.data) (ctx as any).commitPlan = commitPlan

    await next()
  })

  router.get('/sitemap.xml', async (ctx, next) => {

    if (ctx.hostname === 'api.tubbyland.com') return next()

    const uriTemplate = fs.readFileSync(resolve('../../dynamic.xml'), 'utf-8')
    const sitemapTemplate = fs.readFileSync(resolve('../../sitemap.xml'), 'utf-8')

    const generator = await import('./prefetch/projectPaths')
    const uriList = await generator.returnDynamicPaths()

    let insertTemplates:Array<any> = []
    
    for (const entry of uriList.data?.payload) {
      const toInsert = uriTemplate.replace('<!--dynamic-->', `https://tubbyland.com/art/${entry.uri}`)
      insertTemplates.push(toInsert)
    }
    const finalInsert = insertTemplates.join('\n')
    const finalFile = sitemapTemplate.replace('<!--dynamic-->', finalInsert)

    ctx.response.type = 'text/xml'
    ctx.response.status = 200
    ctx.response.body = finalFile

    return
  })

  app.use(router.routes())
  app.use(router.allowedMethods())
  
  if (!isProd) {
    vite = await createViteServer({
      server: { middlewareMode: true }
    })

    app.use(convertMiddleware(vite.middlewares))

    const rawTemplate = fs.readFileSync(resolve('../../index.html'), 'utf-8')
    const render = (await vite.ssrLoadModule('/src/entry-server.js')).render

    renderFunction = async function({ host, uri, darkTheme, commitPlan }:any, manifest:any) {
      template = await vite.transformIndexHtml(uri, rawTemplate)

      return await render({ host, uri, darkTheme, commitPlan }, manifest)
    }

  } else {
    manifest = () => require('../dist/client/ssr-manifest.json')
    template = fs.readFileSync(resolve('../dist/client/index.html'), 'utf-8')
    const file = require('../dist/server/entry-server.js')
    renderFunction = file.render

    app.use(serve('deploy/dist/client', { index: false }))
  }
  

  async function returnSnapshot({ host, uri, darkTheme, commitPlan }:any) {
    let html
    try {
      const { appHtml, preloadLinks, state } = await renderFunction({ host, uri, darkTheme, commitPlan }, manifest)

      html = template
        .replace(`<!--app-html-->`, appHtml)
        .replace(`'<vuex-state>'`, state)
        // .replace(`<!--preload-links-->`, preloadLinks)
    } catch(e) {
      vite?.ssrFixStacktrace(e)
      console.error(e)
      return { status: 500, response: e.message }
    }
    return { status: 200, response: html }
  }

  app.use(async (ctx, next) => {
    const snapshot = await returnSnapshot({ 
      host: ctx.hostname, 
      uri: ctx.originalUrl, 
      darkTheme: JSON.parse(ctx.cookies.get('darkTheme') || 'false'),
      commitPlan: ctx.commitPlan
    })

    ctx.response.type = 'text/html'
    ctx.response.status = snapshot.status
    ctx.response.body = snapshot.response

    await next()
  })


  app.on('error', (err, ctx) => {
    // Avoid malicious path error flood
    if (ctx.originalUrl.startsWith('//')) return
    console.error(err)
  })
  process.on('uncaughtException', (err) => {
    console.error('Caught exception: ', err.stack)
    if (isProd) return process.exit()
  })

  // function networkIP() {
  //   const list = os.networkInterfaces()['en0']
  //   const result = list?.find(x => 
  //     x.netmask === '255.255.255.0' &&
  //     x.family === 'IPv4'
  //   )
    
  //   return result?.address
  // }

  const networkLAN = defaultGateway.v4.sync()
  const networkIP = address.ip(networkLAN?.interface)

  // SERVER
  const PORT = process.env.PORT || 3000
  console.log(`Local: http://localhost:${PORT}`)
  console.log(`Network: http://${networkIP}:${PORT}`)
  app.listen(PORT)
}

main()
