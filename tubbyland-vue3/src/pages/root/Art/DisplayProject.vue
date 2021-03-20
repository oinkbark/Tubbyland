<script>
import { defineComponent, ref, computed, watch, inject, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'

import ProtoLayout from '@/components/PROTO.vue'
import Modal from '@/components/Modal.vue'

import ModifyProject from '@/ArtPage/ModifyProject.vue'

export default defineComponent({
  components: {
    ProtoLayout,
    Modal,
    ModifyProject
  },
  setup() {
    // Imports
    const route = useRoute()
    const store = useStore()
    const capitalize = inject('capitalize')
    const assetBucket = inject('assetBucket')
    const modalOpen = ref(false)

    // Variables
    const uri = computed(() => route.params.uri)
    const project = computed(() =>  store.state.art.published.data[uri.value] || store.state.art.draft.data[uri.value] || null)
    const account = computed(() => store.state.auth.user)
    const selectedImageIndex = ref(0)

    function costify(cost) {
      if (!cost) return 'FREE'
      if (Number.isInteger(cost)) return `$${cost}.00`
      else return '$' + cost
    }
    function dateify(date) {
      if (!date) return null
      return new Date(date).toLocaleDateString()
    }

    // Lifecycle Hooks
    function displayProject() {
      const visiting = {
        again: Boolean(project.value?.stateHash),
        fromPreview: Boolean((store.state.art.published.didFetch) && (!project.value?.stateHash) && (project.value?._id)),
        directlyWithSSR: Boolean((!store.state.art.published.didFetch) && (project.value?.stateHash)),
        directlyWithSPA: Boolean((!store.state.art.published.didFetch) && (!project.value?._id))
      }
      let action
      let index = 'published'

      console.debug('DisplayProject -> Visiting: ', visiting)

      if (visiting.again) return
      else if (visiting.directlyWithSSR) action = 'art/populateMediaSrc'
      else if (visiting.directlyWithSPA) action = 'art/populateFullProject'
      else if (visiting.fromPreview) action = 'art/populatePartialProject'

      if (!action) throw new Error('Project is missing or stub does not include all required properties.')
      if (store.state.auth.user && !store.state.demoMode) {
        // needs implementing on backend:
        // Since we are authenticated we do not care what index it comes from
        // index = '*'

        // If SSR does not find a published project preview, it must be a draft
        // If we are not using SSR this must be set to a wildcard
        // since login check auto fetches draft index we will have the project ID
        if (!project.value || project.value?.isPublished === false || visiting.directlyWithSPA) index = 'draft'
      }
      
      store.dispatch(action, {
        uri: uri.value,
        index
      })
    }
    onMounted(() => {
      if (!store.state.auth.pending) displayProject()
      watch([account, project.value?.stateHash], (afterValues, beforeValues) => {
        const loggedOut = Boolean(beforeValues[0] && !afterValues[0])
        const projectDeleted = Boolean(beforeValues[1] && !afterValues[1])

        if (loggedOut || projectDeleted) return
        else displayProject()
      })
    })
    // https://ssr.vuejs.org/guide/data.html#final-state-injection

    return {
      route,
      store,
      project,
      assetBucket,
      capitalize,
      modalOpen,
      selectedImageIndex,
      costify,
      dateify
    }
  }
})
</script>

<template lang="pug">
div(class='page' :key='route.fullPath')
  div(v-if='project === null')
    h1 That project does not exist :(
  div(v-else-if='project?._id && !project?.stateHash')
    h1 Loading project...
  div(v-else)
    proto-layout(id='project-display')
      template(v-slot:proto-header)
        div(id='project-header')
          h1 {{ project.title }}
          button(class='neutral-button hand-drawn-border' @click='modalOpen = true' v-if='store.state.auth.user') Edit Project
            i(class='material-icons-two-tone') create
            modal(v-if='modalOpen === true' :persistent='true' @close='modalOpen = false')
              modify-project(:project='project' @close='modalOpen = false')
          div(id='project-metadata')
            div(v-if='project.publishDate')
              div First Published: {{ dateify(project.publishDate) }}
              div(v-if='project.revisionDate') Last Revised: {{ dateify(project.revisionDate) || 'Never' }}
            div(v-else-if='project.creationDate && store.state.auth.user') 
              div Draft Created: {{ dateify(project.creationDate) }}
          hr
      template(v-slot:proto-content)
        div(id='project-media')
          div(id='media-live' v-if='project.sections?.images?.data?.length && project.sections.images.data[0].name')
            div(id='project-media-selected' :var='displayedImage = project.sections.images.data[selectedImageIndex]')
              img(:src='displayedImage?.src || "/LoadingImage.svg"' class='hand-drawn-border')
              // img(v-else src='/LoadingImage.svg' class='hand-drawn-border')
              figcaption(v-if='displayedImage?.text') {{ displayedImage.text }}
            div(id='project-media-thumbnails' v-if='project.sections?.images?.data?.length > 1')
              i(class='material-icons-two-tone media-thumbnail-navigate' @click='selectedImageIndex !== 0 ? --selectedImageIndex : null') navigate_before
              div(v-for='(imgValue, imgIndex) of project.sections.images.data')
                //- There will not be an image name when editing
                img(v-if='imgValue.name && imgValue.src' class='hand-drawn-border' :src='imgValue.src' @mouseover='selectedImageIndex = imgIndex')
                img(v-else-if='imgValue.name' class='hand-drawn-border' src='/LoadingImage.svg')
              i(class='material-icons-two-tone media-thumbnail-navigate' @click='selectedImageIndex !== (project.sections.images.data.length - 1) ? ++selectedImageIndex : null') navigate_next
          div(id='media-fallback' v-else)
            img(class='hand-drawn-border' :src='`${assetBucket}/png/fallback.png`')
            figcaption There are no images for this project yet.
        hr
        div(id='project-details')
          ul(id='project-details-list' v-if='project.details')
            li(class='hand-drawn-border')
              i(class='material-icons-two-tone') shopping_cart
              h3 Cost: {{ costify(project.details.cost) }}
            li(class='hand-drawn-border')
              i(class='material-icons-two-tone') handyman
              h3 Difficulty: {{ project.details.difficulty }}
            li(class='hand-drawn-border')
              i(class='material-icons-two-tone') schedule
              h3 Duration: {{ project.details.duration }}
          div(class='empty-section' v-else)
            h3 There are no details for this project yet.
          hr
        div(id='project-text')
          proto-layout(class='project-text-section' v-for='(SectionName) in ["materials", "steps"]')
            template(v-slot:proto-header)
              h2 {{ capitalize(SectionName) }}
            template(v-slot:proto-content)
              div(v-if='project.sections?.[SectionName]?.data?.length')
                ul(v-if='SectionName === "materials"')
                  li(v-for='element in project.sections[SectionName].data') {{ element.text }}
                ol(v-if='SectionName === "steps"')
                  li(v-for='element in project.sections[SectionName].data') {{ element.text }}
              div(class='empty-section'  v-else)
                h3 There are no {{ SectionName }} for this project yet.
            template(v-slot:proto-footer)
              hr
</template>

<style lang="less" scoped>
@import '@/assets/css/global.less';

h1 {
  font-size: 2.2rem;
}
h2 {
  font-size: 1.7rem;
}
h3 {
  font-size: 1.1rem;
}

ul,
ol {
  margin-left: 7px;
}
ul {
  list-style-type: none;
}
ol {
  list-style-type: decimal;
  list-style-position: inside;
}
.page {
  margin: 0 auto 0 auto;
}

#project-display {
  padding: 0 10px 0 10px;
}
#project-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  button {
    display: flex;
    flex-direction: row-reverse;
  }
}
#project-media {
  display: flex;
  align-self: center;
  align-items: center;
  align-content: center;
  justify-content: center;
}
#media-live,
#media-fallback {
  display: flex;
  align-items: center;
  flex-direction: column;
  img {
    box-sizing: border-box;
    max-height: 200px;
    max-width: 400px;
  }
}
#project-media-selected {
  display: flex;
  overflow: hidden;
  min-height: 200px;
  align-items: center;
  align-content: center;
  justify-content: center;
  flex-direction: column;
}
#project-media-thumbnails {
  display: flex;
  user-select: none;
  align-items: center;
  div {
    display: flex;
    align-items: center;
  }
  img {
    margin: 2px;
    max-height: 50px;
    max-width: 50px;
  }
}
#project-details-list {
  display: flex;
  flex-wrap: wrap;
  margin: 0;
  li {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: 2px;
    margin: 5px;
    white-space: nowrap;
  }
}
#section-step-number {
  //float: left;
  display: list-item;
  box-sizing: border-box;
  margin: 0 0 0 3px;
}
</style>