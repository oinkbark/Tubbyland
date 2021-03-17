import { createDefaultApp } from './main'

const { App, Router, Store } = createDefaultApp(location.hostname)

if (window.__INITIAL_STATE__) {
  Store.replaceState(window.__INITIAL_STATE__);
}
// Cannot mount until ready to ensure hydration match
Router.isReady().then(() => {
  App.mount('#app', true)
})
