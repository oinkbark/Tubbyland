import { Context } from 'koa'
import KoaRouter from 'koa-router'

const router: KoaRouter = new KoaRouter({ prefix: '/endpoint' })

router.get('/ping', async (ctx:Context) => {
  return ctx.response.status = 200
})
router.post('/ping', async (ctx:Context) => {
  return ctx.response.status = 200
})

export default router
