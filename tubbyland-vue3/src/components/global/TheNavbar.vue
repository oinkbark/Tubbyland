<script>
import { computed, reactive, ref, inject, onMounted } from 'vue'
import { useStore } from 'vuex'
import LoginFlow from '@/components/LoginFlow.ts'
import Modal from '@/components/Modal.vue'

import 'focus-visible'
import tippy from 'tippy.js'

export default {
  components: {
    Modal
  },
  setup() {
    const store = useStore()
    const assetBucket = inject('assetBucket')
    const isHostname = inject('isHostname')

    const account = new LoginFlow(store)
    const displayAccount = ref(false)

    const errorMessage = reactive({
      shouldDisplay: computed(() => store.state.auth.denied),
      close() { 
        store.commit('denyLogin', false) 
      }
    })

    const dropdown = reactive({
      "Account": {
        icon: "face",
        state: computed(() => store.state.auth.user),
        humanState: computed(() => store.state.auth.user ? "Signed In" : "Signed Out"),
        onSwitch() {
          if (store.state.auth.user) displayAccount.value = true
          else account.loginWithGoogle()
        }
      },
      "Appearance": {
        icon: computed(() => store.state.darkTheme ? "dark_mode" : "light_mode"),
        state: computed(() => store.state.darkTheme),
        humanState: computed(() => store.state.darkTheme ? "Dark" : "Light"),
        onSwitch() {
          document.cookie = `darkTheme=${!store.state.darkTheme};samesite=strict;domain=.tubbyland.com;`
          store.commit('changeTheme')
        }
      },
      "Demo Mode": {
        icon: "account_tree",
        state: computed(() => store.state.demoMode),
        humanState: computed(() => store.state.demoMode ? "On" : dropdown['Account'].state ? "Disabled" : "Off"),
        onSwitch() {
          store.dispatch('changeMode')
        }
      }
    })

    async function logout() {
      displayAccount.value = false
      if (store.state.demoMode) store.dispatch('changeMode')
      else {
        store.commit('logout')
        await account.logout()
      }
    }

    onMounted(() => {
      const trigger = document.querySelector('#nav-dropdown-trigger')
      const tooltip = document.querySelector('#nav-dropdown-plane')
      
      if (trigger && tooltip) {
        tippy.setDefaultProps({
          placement: 'bottom',
          allowHTML: true,
          interactive: true,
          hideOnClick: 'toggle',
          trigger: 'mouseenter focus',
          zIndex: 2
        })

        tippy(trigger, {
          content: tooltip,
        })
      }
      if (isHostname('root')) {
        if (store.state.auth.user) return

        const payload = window.localStorage.getItem('auth')
        if (payload) store.commit('login', JSON.parse(payload))
      }
    })

    return {
      store,
      isHostname,
      assetBucket,
      dropdown,
      displayAccount,
      errorMessage,
      logout
    }
  }
}
</script>

<template lang='pug'>
nav(role='navigation')
  div(id='navbar' class='flex-container')
    div(id='navbar-content')
      div(id='nav-logo' class='flex-item')
        img(src='/logo.svg' id='nav-image' alt='Tubbyland Logo' type='image/svg+xml')
      div(v-if='isHostname("api")' id='nav-links-api' class='nav-links flex-item')
        a(href='https://tubbyland.com' class='hand-drawn-border') Home
        a(href='https://tubbyland.com/art' class='hand-drawn-border') Art
        router-link(to='/' class='hand-drawn-border') API
      div(v-else id='nav-links-root' class='nav-links flex-item')
        router-link(to='/' class='hand-drawn-border') Home
        router-link(to='/art' class='hand-drawn-border') Art
        a(v-if='store.state.demoMode' href='https://api.tubbyland.com' class='hand-drawn-border') API
        div(id='nav-dropdown-trigger')
          i(class='material-icons-two-tone') settings
          div(id='nav-dropdown-plane')
            ul(id='nav-dropdown-content' :class='store.state.darkTheme ? "dark-theme" : "light-theme"' class='hand-drawn-border')
              div Settings
              li(class='dropdown-section' v-for='DropValue, DropName, DropIndex in dropdown' @click='dropdown[DropName].onSwitch()')
                i(class='material-icons-two-tone') {{ DropValue.icon }}
                div {{ DropName }}: {{ DropValue.humanState }}
          div(id='nav-dropdown-modals')
            modal(v-if='displayAccount === true' :persistent='false' @close='displayAccount = false')
              div(id='oauth-account')
                img(:src='dropdown["Account"].state.icon')
                div {{ dropdown['Account'].state.name }}
                div
                  button(class='neutral-button' @click='displayAccount = false') Okay
                  button(class='decline-button' @click='logout()') Sign Out
            modal(v-if='errorMessage.shouldDisplay' :persistent='false' @close='errorMessage.close')
              div(id='oauth-error')
                h2 Access Denied
                div(id='oauth-error-message')
                  p The selected email has not been whitelisted.
                  p To request access, please contact the site creator.
                button(class='neutral-button' @click='errorMessage.close') Okay
</template>

<style scoped lang='less'>
@import '@/assets/css/global.less';

* {
  display: flex;
  justify-content: center;
  margin: 8px;
  user-select: none;
}

// Tippy
.js-focus-visible :focus:not(.focus-visible) {
  outline: none;
}
div :focus:not(.focus-visible) {
  outline: none;
}
[data-js-focus-visible] :focus:not([data-focus-visible-added]) {
  outline: none;
}

#navbar {
  #navbar-content {
    display: flex;
    flex-wrap: wrap;
    padding: 30 10 30 10;
    justify-content: flex-start;
    #nav-logo {
      display: flex;
      justify-content: center;
      padding: 2px;
      #nav-image {
        max-height: 52px;
        max-width: 300px;
        height: 100%;
        width: 100%;
        // background-size: contain;
        // background-repeat: no-repeat;
        // background-position: center;
      }
    }
    .nav-links {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 10px;
      .router-link-active {
        border-top-width: 0.5rem;
      }
      a {
        align-self: center;
        padding-left: 10px;
        padding-right: 10px;
        margin-right: 10px;
        font-size: 1.3rem;
        font-weight: inherit;

        //color rgba(black, 0.9)
        background-color: none;
        text-align: center;
        text-decoration: none;
        vertical-align: middle;

        //transition(all ease-in-out 175ms)
        &:hover {
          border-top-width: 0.5rem;
        }
      }
      i {
        font-size: 1.8rem;
      }
    }
  }
}
#nav-dropdown-content {
  // margin: 0;
  outline: 0 !important;
  display: flex;
  user-select: none;
  align-content: flex-start;
  justify-content: flex-start;
  flex-direction: column;
  padding: 0 5px 0 5px;
  li {
    display: flex;
    flex: 1;
    flex-basis: 100%;
    flex-direction: row;
    align-items: center;
    align-content: flex-start;
    justify-content: flex-start;
    &:hover {
      &:extend(.hand-drawn-border);
      background-color: @var-lightBlue;
    }
  }
}
#nav-dropdown-modals {
  margin: 0;
  padding: 0;
}
#oauth-account,
#oauth-error,
#oauth-error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  img {
    display: block;
    height: 50px;
    width: 50px;
    border-radius: 50%;
    border: 2px solid @var-graphite;
  }
}
#oauth-error,
#oauth-error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  h2 {
    color: @var-darkRed;
  }
}
</style>