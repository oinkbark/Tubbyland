import { Application, send } from "https://deno.land/x/oak/mod.ts"

const app = new Application()

app.use(async (context) => {
  await send(context, context.request.url.pathname, {
    root: `${Deno.cwd()}/build/dist`,
    index: "index.html",
  })
})

await app.listen({ 
  port: Deno.env.get("PORT") || 3000,
  proxy: Boolean(Deno.env.get("STAGE") === 'production')
})
