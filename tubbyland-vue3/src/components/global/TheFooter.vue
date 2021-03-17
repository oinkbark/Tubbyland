<script>
import { inject } from 'vue'
export default {
  setup() {
    const year = new Date().getFullYear()
    const isHostname = inject('isHostname')
    return {
      year,
      isHostname
    }
  }
}
</script>

<template lang='pug'>
footer(id='footer')
  div(id='footer-text')
    small(id='footer-copyright') Copyright &copy; {{ year }} #[a(href="https://github.com/oinkbark") OinkBark]. All rights reserved.
    small(v-if='isHostname("api")' id='footer-credits') Created with #[a(href="https://tubbyland.com/credits") open source.]
    small(v-else id='footer-credits') Created with #[router-link(to="/credits") open source.]
</template>

<style scoped lang='less'>
@import '@/assets/css/global.less';

div {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
small {
  display: inline;
  color: #888;
  a {
    color: @var-primary;
    text-decoration: none;
  }
}
#footer {
  background-color: #D9D9D9;
}
#footer-text {
  margin: 20px;
}
</style>
