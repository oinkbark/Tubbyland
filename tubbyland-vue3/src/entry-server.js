import { createDefaultApp } from './main'
import { renderToString } from '@vue/server-renderer'

export async function render({ host, uri, darkTheme, commitPlan }, manifest) {
  const { App, Router, Store } = createDefaultApp(host)

  // State Modifications
  Store.commit('setHostname', host)
  if (commitPlan) {
    const { path, data } = commitPlan
    Store.commit(path, data)
  }
  if (darkTheme === true) Store.commit('changeTheme', true)

  // Route Modifications
  Router.push(uri)
  await Router.isReady()

  // passing SSR context object which will be available via useSSRContext()
  // @vitejs/plugin-vue injects code into a component's setup() that registers
  // itself on ctx.modules. After the render, ctx.modules would contain all the
  // components that have been instantiated during this render call.
  const ctx = {}
  const appHtml = await renderToString(App, ctx)
  const preloadLinks = manifest ? renderPreloadLinks(ctx.modules, manifest) : ''
  const state = JSON.stringify(Store.state)

  return { appHtml, preloadLinks, state }
}

function renderPreloadLinks(modules, manifest) {
  let links = ''
  const seen = new Set()
  modules.forEach((id) => {
    const files = manifest[id]
    if (files) {
      files.forEach((file) => {
        if (!seen.has(file)) {
          seen.add(file)
          links += renderPreloadLink(file)
        }
      })
    }
  })
  return links
}

function renderPreloadLink(file) {
  if (file.endsWith('.js')) {
    return `<link rel="modulepreload" crossorigin href="${file}">`
  } else if (file.endsWith('.css')) {
    return `<link rel="stylesheet" href="${file}">`
  } else {
    // TODO
    return ''
  }
}
