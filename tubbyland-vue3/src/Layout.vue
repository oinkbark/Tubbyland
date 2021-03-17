<script>
import { defineComponent, provide, onBeforeMount, onMounted } from 'vue'
import { useStore } from 'vuex'

import TheNavbar from './components/global/TheNavbar.vue'
import TheFooter from './components/global/TheFooter.vue'


export default defineComponent({
  name: 'App',
  components: {
    TheNavbar,
    TheFooter
  },
  setup() {
    const store = useStore()
    const hostnames = {
      root: 'tubbyland.com',
      api: 'api.tubbyland.com',
      dev: 'localhost'
    }

    provide('capitalize', function(value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
    })

    provide('assetBucket', 'https://assets.tubbyland.com')

    provide('isHostname', function(key) {
      return Boolean(store.state.hostname === hostnames[key])
    })

    // onMounted(() => {
    //   if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    //     store.commit('changeTheme', true)
    //   }
    // })

    return { 
      store 
    }
  }
})
</script>

<template lang='pug'>
div(id="oink-app" :class='store.state.darkTheme ? "dark-theme" : "light-theme"')
  TheNavbar
  div(id='app-content')
    router-view
  TheFooter
</template>

<style lang='less'>
@import (css) url(https://fonts.googleapis.com/css?family=Patrick+Hand+SC);
@import (css) url(https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Two+Tone);
@import '@/assets/css/global.less';

* {
  margin: 0;
  padding: 0;
  font-family: "Patrick Hand SC", "Myriad Pro", "Helvetica Neue", "Gill Sans", "Arial", sans-serif;
  font-weight: lighter;
  font-size: 18px;
}
html,
body,
#oink-app {
  min-height: 100vh;
}
html,
body,
#oink-app,
#app-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

h1 {
  font-size: 1.8rem;
}
h2 {
  font-size: 1.3rem;
}
h3 {
  font-size: 1.15rem;
}
button {
  &:extend(.hand-drawn-border);
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
  padding: 2px;
  user-select: none;
  &:hover {
    cursor: pointer;
  }
}
i {
  &:hover {
    cursor: pointer;
  }
}
.light-theme {
  background-color: #F0F0D8;
  transition: background-color 0.6s linear;
  a,
  hr {
    color: @var-graphite;
  }
  hr {
    background-color: @var-graphite;;
  }
  .hand-drawn-container,
  .hand-drawn-border {
    border: solid 0.15rem black;
  }
}
.dark-theme {
  background-color: #2E3236;
  transition: background-color 0.6s linear;
  * {
    color: white;
  }
  a,
  hr {
    color: @var-tubbyGreen;
  }
  hr {
    background-color: @var-tubbyGreen;
  }
  .hand-drawn-container,
  .hand-drawn-border {
    border: solid 0.15rem #BFBFBF;
  }
  .material-icons-two-tone {
    filter: invert(0.8);
  }
  .svg {
    filter: invert(1);
  }
}
.page {
  display: flex;
  flex: 1;
  flex-direction: column;
  //margin: 0 auto 0 auto;
}

</style>
