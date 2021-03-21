<script>
import { defineComponent, onMounted } from 'vue'
import { useRoute } from 'vue-router'
export default defineComponent({
  setup() {
    // Imports
    const route = useRoute()

    // Lifecycle Hooks
    onMounted(function () {
      if (window.opener) {
        if (window.name !== 'tubbyland') return

        window.opener.postMessage(String(route.query.code))
        return window.close()
      }
    })
  }
})
</script>

<template lang="pug">
div This window should close automatically.
div If it doesn't, you may close it.
</template>
