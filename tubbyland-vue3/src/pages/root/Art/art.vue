<script>
import { ref, reactive, computed, onBeforeMount, provide, inject } from 'vue'
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
    const assetBucket = inject('assetBucket')

    // Variables
    const projects = reactive({ 
      published: computed(() => store.state.art.published.data),
      draft: computed(() => store.state.art.draft.data)
    })

    // Functions
    function returnProjectBucket (projectID, assetName) {
      const base = 'https://storage.googleapis.com'
      if (!projectID && !assetName) return base
      else return `${base}/${projectID}.tubbyland.com/${assetName}`
    }
    // function returnMediaSrc(project, filename) {
    //   if (!filename) {
    //     if (project.sections?.images?.data?.length) {
    //       filename = project.sections.images.data[0].name
    //     }
    //     else return `${assetBucket}/png/fallback.png`
    //   }
    //   const bucketLink = returnProjectBucket(project._id, filename)

    //   if (project.isPublished) return bucketLink
    //   else {
    //     const google = new GoogleAPI()
    //     google.fetchBucketObject(project._id, filename)
    //     return 
    //   }
    // }

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
    // provide('returnMediaSrc', returnMediaSrc)
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
      div(id='projects-published')
        h1 Published ({{ Object.keys(projects.published).length }})
        hr
        div(v-if='!Object.keys(projects.published).length')  
          h1 No projects have been published yet :(
        div(v-else class='project-previews-list')
          router-link(v-for='(ProjectValue, ProjectKey, ArrayIndex) in projects.published' :to="`/art/${ProjectValue.uri}`" :key='ProjectKey')
            preview-project(:preview='ProjectValue')
      div(id='projects-draft' v-if='store.state.auth.user')
        h1 Drafts ({{ Object.keys(projects.draft).length }})
        hr
        div(v-if='!Object.keys(projects.draft).length')  
          h2 Your project drafts will appear here.
        div(v-else class='project-previews-list')
          router-link(v-for='(ProjectValue, ProjectKey, ArrayIndex) in projects.draft' :to="`/art/${ProjectValue.uri}`" :key='ProjectKey')
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