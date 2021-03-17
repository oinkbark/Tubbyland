<script>
import { defineComponent, ref, reactive, computed, onMounted } from 'vue'
export default defineComponent({
  setup() {
    const isOnline = ref(false)
    const status = reactive({
      icon: computed(() => isOnline ? 'public' : 'public_off'),
      humanState: computed(() => isOnline ? 'Online' : 'Offline')
    })

    async function setStatus() {
      try {
        const apiRes = await fetch('https://api.tubbyland.com/endpoint/ping', {
          method: 'GET',
          mode: 'no-cors',
        })

        if (apiRes.status === 200) isOnline.value = true

      } catch (e) {
        console.error(e)
      }
    }

    onMounted(() => {
      setStatus()
    })

    return {
      status
    }
  }
})
</script>

<template lang="pug">
div(class='page centered')
  i(class='material-icons') {{ status.icon }}
  div API Status: {{ status.humanState }}
  a(href='/graphql') GraphQL Docs and UI
</template>
