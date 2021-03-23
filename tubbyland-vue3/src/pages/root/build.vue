<script>
import { defineComponent } from 'vue'
import BuildInfo from '&/deploy/build-info.json'

export default defineComponent({
  setup() {

    return {
      commit_sha: BuildInfo.commit_sha
    }
  }
})
</script>

<template lang="pug">
div(class='page centered')
  h1 Build Info
  h2(:data-ui-commit-sha='commit_sha') UI Commit Sha: {{ commit_sha }}
</template>
