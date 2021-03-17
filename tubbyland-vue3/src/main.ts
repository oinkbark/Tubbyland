import { createSSRApp } from 'vue'
import { sync } from 'vuex-router-sync'
import Layout from './Layout.vue'
//import './registerServiceWorker'

import { createServerRouter } from './pages/router'
import { createServerStore } from './store'

// document.querySelector('#app').__vue_app__._context.provides.store._state
export function createDefaultApp(hostname?:string) {
  const Router = createServerRouter(hostname)
  const Store = createServerStore()

  sync(Store, Router, { moduleName: 'PreRender' })
  
  const App = createSSRApp(Layout)
  App.use(Store).use(Router)

  return { App, Router, Store }
}
