<script>
import { ref, reactive, computed, onBeforeMount, onMounted, provide } from 'vue'
import { useStore } from 'vuex'

import ProtoLayout from '@/components/PROTO.vue'
import Modal from '@/components/Modal.vue'
import ModifyProject from '@/ArtPage/ModifyProject.vue'
import PreviewProject from '@/ArtPage/PreviewProject.vue'

export default {
  components: {
    PreviewProject,
    ModifyProject,
    Modal,
    ProtoLayout
  },
  setup() {
    // Imports
    const store = useStore()
    const modalOpen = ref(false)
    const demoMode = computed(() => store.state.demoMode)

    // Variables
    const projects = reactive({ 
      published: computed(() => store.state.art.published),
      draft: computed(() => store.state.art.draft)
    })

    // Functions
    function returnProjectBucket (projectID, assetName) {
      const base = 'https://storage.googleapis.com'
      if (!projectID && !assetName) return base
      else return `${base}/${projectID}.tubbyland.com/${assetName}`
    }

    // Lifecycle Hooks
    onBeforeMount(() => {
      const indexes = [
        { name: 'published' },
        { name: 'draft', protected: true }
      ]

      for (const index of indexes) {
        if (index.protected && (!store.state.auth.user || store.state.demoMode)) continue
        if (!store.state.art[index.name].didFetch) store.dispatch('art/populatePreviews', { index: index.name })
      }
    })

    // Exports
    provide('projectBucket', returnProjectBucket)
    
    return {
      store,
      demoMode,
      projects,
      modalOpen
    }
  }
}
</script>

<template lang="pug">
proto-layout(class='page')
  template(v-slot:proto-header)
    div(id='projects-header' class='no-print')
      h1 Art Projects
      button(class='neutral-button hand-drawn-border' @click='modalOpen = true' v-if='store.state.auth.user') Create Project
        i(class='material-icons') add
        modal(v-if='modalOpen === true' :persistent='true' @close='modalOpen = false')
          modify-project(@close='modalOpen = false')
      hr
  template(v-slot:proto-content)
    div(id='projects-content')
      div(id='projects-published' :var='publishedLength=Object.keys(projects.published.data).length')
        h1 Published ({{ publishedLength }})
        hr
        div(v-if='projects.published.didFetch && !publishedLength') 
          h1 No projects have been published yet :(
        div(v-else class='project-previews-list')
          h2(v-if='!publishedLength') Loading projects...
          router-link(v-for='(ProjectValue, ProjectKey, ArrayIndex) in projects.published.data' :to="`/art/${ProjectValue.uri}`" :key='ProjectKey')
            preview-project(:preview='ProjectValue')
      div(id='projects-draft' v-if='store.state.auth.user' :var='draftLength=Object.keys(projects.draft.data).length')
        h1 Drafts ({{ draftLength }})
        hr
        div(v-if='projects.draft.didFetch && !draftLength')  
          h2 Your project drafts will appear here.
        div(v-else class='project-previews-list')
          h2(v-if='!draftLength') Loading drafts...
          router-link(v-else v-for='(ProjectValue, ProjectKey, ArrayIndex) in projects.draft.data' :to="`/art/${ProjectValue.uri}`" :key='ProjectKey')
            preview-project(:preview='ProjectValue')
</template>

<style lang="less" scoped>

// Main root elements
label {
  font-size: 1.3rem;
}
li {
  list-style: none;
}
#projects-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  button {
    display: flex;
    flex-direction: row-reverse;
  }
}
#projects-content {
  display: flex;
  flex: 1;
  flex-direction: column;
}
#projects-published {
  flex: 1;
}
#projects-published,
#projects-draft {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  align-items: center;
  margin: 0 auto 5px auto;
  min-width: 33%;
  max-width: 66%;
  a {
    text-decoration: none;
    color: black;
  }
  h1 {
    display: flex;
    align-self: center;
  }
}
.project-previews-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  margin: 0 10px 0 10px;
}
</style>