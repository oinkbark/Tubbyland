import { createStore } from 'vuex'
import * as Modules from './modules'

export function createServerStore() {
  return createStore({
    state: () => ({
      hostname: 'tubbyland.com',
      darkTheme: false,
      demoMode: false,
      auth: {
        denied: false,
        user: null
      }
    }),
    mutations: {
      setHostname(state:any, hostname: string) {
        state.hostname = hostname
      },
      changeTheme(state:any, toDark:boolean) {
        let finalState
        if (toDark !== undefined) finalState = toDark
        else finalState = !state.darkTheme
  
        state.darkTheme = finalState
      },
      changeMode(state:any, toDemo:boolean) {
        if (toDemo !== undefined) state.demoMode = toDemo
        else state.demoMode = !state.demoMode
      },
      denyLogin(state:any, payload:boolean) {
        state.auth.denied = payload
      },
      login(state:any, payload:any) {
        state.auth.user = payload
      },
      logout(state:any) {
        state.auth.user = null
      }
    },
    actions: {
      changeMode({ state, commit }:any, toDemo:boolean) {

        if (state.demoMode === false) {
          // Cannot be signed in for real and demo mode at same time
          if (state.auth.user) return
          const demoUser = {
            email: 'example@example.com',
            name: 'Demo User',
            icon: 'https://assets.tubbyland.com/png/robert.png'
          }
          commit('login', demoUser)
        } else commit('logout')

        commit('changeMode', toDemo)
      }
    },
    modules: {
      art: Modules.art
    }
  })
}
