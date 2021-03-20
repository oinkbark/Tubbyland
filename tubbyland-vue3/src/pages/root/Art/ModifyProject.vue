<script>
import { defineComponent, ref, reactive, computed, inject } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

import ProtoLayout from '@/components/PROTO.vue'
import DragDrop from 'vuedraggable'
import InternalAPI from '@/components/InternalAPI.ts'
import GoogleAPI from '@/components/GoogleAPI.ts'
import LoginFlow from '@/components/LoginFlow.ts'

export default defineComponent({
  components: {
    ProtoLayout,
    DragDrop
  },
  props: {
    project: {
      type: Object,
      required: false
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    // Imports
    const uniqueKey = ref(10)
    const dragging = ref(false)
    const store = useStore()
    const router = useRouter()
    const capitalize = inject('capitalize')
    const assetBucket = inject('assetBucket')

    function isImageFile (file) {
      if (file.type.split('/')[0] !== 'image') {
        formErrors.data.push({ section: 'images', message: `The uploaded file "${file.name}" is not an image.` })
        return false
      }
      if (!/\.(jpe?g|png)$/i.test(file.name)) {
        formErrors.data.push({ section: 'images', message: `The uploaded image "${file.name}" is not supported. It must have one of these extensions: .png .jpg .jpeg` })
        return false
      }
      return true
    }
    async function processUploadedImages (event) {
      const fileInput = event.target
      const uploadedFiles = fileInput.files
      const dataIndex = fileInput.attributes.dataIndex.value

      // Remove real file input
      Form.sections.images.data.splice(dataIndex, 1)

      for (let i = 0; i < uploadedFiles.length; i++) {
        const imageFile = uploadedFiles[i]

        if (isImageFile(imageFile)) {
          let imageSrc = await fileReaderAsync(imageFile)

          Form.sections.images.data.splice(dataIndex, 0, { file: imageFile, name: imageFile.name, src: imageSrc, text: '' })
        }
      }
    }

    async function fileReaderAsync(imageFile) {
      return new Promise((resolve, reject) => {
        let reader = new window.FileReader()

        reader.onerror = reject
        reader.readAsDataURL(imageFile)

        reader.onload = () => {
          resolve(reader.result)
        }
      })
    }

    const renderGuide = {
      sections: {
        images: {
          listType: 'ul',
          inputType: 'image',
          labels: [ 'Featured Image' ]
        },
        materials: {
          listType: 'ul',
          inputType: 'text'
        },
        steps: {
          listType: 'ol',
          inputType: 'text'
        }
      },
      details: {
        difficulty: [
          'Beginner',
          'Easy',
          'Normal',
          'Challenging',
          'Advanced'
        ],
        duration: [
          'A couple minutes',
          'Around an hour',
          'A few hours',
          'All day',
          'Multiple days'
        ]
      }
    }

    const emptySections = {
      images: {
        data: []
      },
      materials: {
        data: []
      },
      steps: {
        data: []
      }
    }
    const defaultDetails = {
      cost: 0,
      difficulty: 'Normal',
      duration: 'A few hours'
    }
    // GraphQL fields are nullable; we need a common form data structure
    function formify(project) {
      if (project.sections === null) {
        project.sections = emptySections
      } else {
        for (const SectionName in emptySections) {
          if (!project.sections[SectionName]?.data) {
            project.sections[SectionName] = emptySections[SectionName]
          }
        }
      }
      if (project.details === null) {
        project.details = defaultDetails
      }

      return project
    }

    const DefaultState = {
      title: '',
      isPublished: false,
      sections: emptySections,
      details: defaultDetails
    }
    const InitialState = props.project ? formify(JSON.parse(JSON.stringify(props.project))) : DefaultState
    const Form = props.project ? reactive(formify(props.project)) : reactive(DefaultState)

    const projectActions = computed(() => {
      let exit = 'Cancel'
      let decline = 'Delete Project'
      let neutral = 'Save as Draft'
      let accept = 'Publish Project'

      if (Form.creationDate) {
        exit = 'Discard Changes'
        neutral = 'Save Changes'
        if (Form.isPublished) {
          neutral = 'Hide Project'
          accept = 'Publish Changes'
        }
      }

      return {
        exit,
        decline,
        neutral,
        accept
      }
    })
    const formErrors = reactive({
      data: [],
      validate: function (willPublish) {
        this.data = []

        //  Level 0: Pre Validation
        if (store.state.demoMode) this.data.push({ section: 'none', message: 'Cannot access API in demo mode :(' })

        //  Level 1: Basic Validation
        if (!Form.title) this.data.push({ section: 'title', message: 'Title is always required.' })
        if (willPublish) {
          let publishErrors = []
          if (!Form.sections.images.data[0]?.src) publishErrors.push({ section: 'images', message: 'At least one image is required.' })
          if (!Form.sections.materials.data[0]?.text) publishErrors.push({ section: 'materials', message:'At least one material is required.' })
          if (!Form.sections.steps.data[0]?.text) publishErrors.push({ section: 'steps', message:'At least one step is required.' })
          if (publishErrors.length) {
            this.data.splice(this.data.length, 0, { header: { count: publishErrors.length, children: ['images', 'materials', 'steps']}, message: 'Before Publishing:' }, ...publishErrors)
          }
        }

        // Level 2: Iterative Validation
        if (!this.data.length) {
          const imageData = Form.sections.images.data
          let rawImageNames = new Set()
          for (const img of imageData) {
            rawImageNames.add(img.name || img.file?.name)
          }
          if (imageData.length !== rawImageNames.size) this.data.push({ section: 'images', message: 'Duplicate image names are not permitted.' })
        }

        return Boolean(this.data.length)
      },
      removeError: function (sectionName) {
        const errorIndex = formErrors.data.findIndex(el => el.section === sectionName)
        if (errorIndex !== -1) {
          formErrors.data.splice(errorIndex, 1)

          const errorHeaderIndex = formErrors.data.findIndex(el => el.header?.children.includes(sectionName))
          if (errorHeaderIndex !== -1) {
            formErrors.data[errorHeaderIndex].header.count--
            if (formErrors.data[errorHeaderIndex].header.count <= 0) {
              formErrors.data.splice(errorHeaderIndex, 1)
            }
          }
        }
      },
      resetErrors: function() {
        api.result.reset()
        formErrors.data = []
      }
    })
    async function uploadImages(bucketName) {
      api.result.message = 'Uploading images...'

      const newImageNames = new Set()
      const google = new GoogleAPI()
  
      for (let i = 0; i < Form.sections?.images?.data?.length; i++) {
        const img = Form.sections.images.data[i]

        newImageNames.add(img.name || img.file?.name)
        // Do not reupload unchanged images when editing existing project
        // Existing images will start with 'https://storage.googleapis.com' or 'blob:'
        if (img.src.startsWith('data:')) {
          await google.uploadBucketObject(bucketName, img.file.name, img.file)
        }
        else continue
      }

      const oldImages = InitialState.sections?.images?.data

      if (oldImages.length) {
        for (const oldImg of oldImages) {

          if (!newImageNames.has(oldImg.name)) {
            await google.deleteBucketObject(bucketName, oldImg.name)
          }

        }
      }

    }

    const api = new InternalAPI()
    const account = new LoginFlow(store)

    api.result = reactive(api.result)

    api.methods = {
      verifyRequestSession(method, args) {
        if (api.result.error && api.result.message.startsWith('Invalid account')) {
           api.result.message = 'Retrying Login...'
           store.commit('setCallback', { method: method.bind(this), args, thisContext: this })
           account.loginWithGoogle()
           return false
        }
        return true
      },
      async spawnProject(title = Form.title) {
        if (store.state.demoMode) return formErrors.data.push({ section: 'none', message: 'Cannot access API in demo mode :(' })

        api.result.message = 'Spawning project...'
        const query = 'mutation ($title: String!) { spawnProject(title: $title) { title, uri, _id, creationDate } }'
        const variables = { title }
        const apiRes = await api.query(query, variables)
        if (!apiRes) {
          if (api.result.error && api.result.rawMessage?.toLowerCase().includes('duplicate key')) {
            formErrors.data.push({ section: 'title', message: 'Title must be unique.' })
          }
          return
        }

        const projectInfo = apiRes.spawnProject

        api.result.message = 'Uploading images...'
        await uploadImages(projectInfo._id)
        return projectInfo
      },
      async updateProject(willPublish) {
        if (formErrors.validate(willPublish) === true) return

        if (!Form.creationDate) {
          const initState = await this.spawnProject()
          if (!api.methods.verifyRequestSession(api.methods.updateProject, [willPublish])) return
          if (api.result.error) return

          Form._id = initState._id
        }

        if (!Form._id) return console.error('Cannot update project without ID')

        const query = 'mutation ($_id: String!, $revisions: ArtProjectInput!) { updateProject(_id: $_id, revisions: $revisions) { _id, uri, title, stateHash, creationDate, isPublished, publishDate, revisionDate, sections { images { data { name, text } }, materials { data { text } }, steps { data { text } } }, details { duration, difficulty, cost } } }'
        let variables = { 
          _id: Form._id, 
          revisions: JSON.parse(JSON.stringify(Form))
        }

        api.result.message = 'Preparing data...'

        variables.revisions.isPublished = Boolean(willPublish)
        variables.revisions.details.cost = new Number(variables.revisions.details.cost)

        const nonEditable = ['_id', 'uri', 'stateHash', 'creationDate', 'publishDate', 'revisionDate']
        for (const field of nonEditable) delete variables.revisions[field]

        for (const SectionName in variables.revisions.sections) {
          for (const ElementData of variables.revisions.sections[SectionName].data) { 
            // Dragdrop
            delete ElementData.id
            // Google Bucket
            delete ElementData.file
            // Thumbnail
            delete ElementData.src
          }
        }

        api.result.message = 'Uploading data...'
        const apiRes = await api.query(query, variables)
        if (!api.methods.verifyRequestSession(api.methods.updateProject, [willPublish])) return
        if (!apiRes) {
          if (api.result.error && api.result.rawMessage?.toLowerCase().includes('duplicate key')) {
            formErrors.data.push({ section: 'title', message: 'Title must be unique.' })
          }
          return
        }

        api.result.message = 'Uploading images...'
        await uploadImages(Form._id)

        const payload = apiRes.updateProject
        const oldIndex = InitialState.isPublished ? 'published' : 'draft'
        const newIndex = payload.isPublished ? 'published' : 'draft'

        store.commit('art/setProject', {
          ...(InitialState.uri) && {
              oldState: {
              uri: InitialState.uri,
              index: oldIndex,
            } 
          },
          index: newIndex, 
          payload
        })
        await store.dispatch('art/populateMediaSrc', { uri: payload.uri, index: newIndex })

        emit("close")
        router.push(`/art/${payload.uri}`)
      },
      async deleteProject(_id = Form._id) {
        if (!_id) return emit("close")
        if (store.state.demoMode) return formErrors.data.push({ section: 'none', message: 'Cannot access API in demo mode :(' })

        const query = 'mutation ($_id: String!) { deleteProject(_id: $_id) }'
        const variables = { _id }
        
        api.result.message = 'Deleting project...'
        const apiRes = await api.query(query, variables)
        if (!api.methods.verifyRequestSession(api.methods.deleteProject, [_id])) return
        if (!apiRes) return
        
        store.commit('art/deleteProject', {
          index: (Form.isPublished ? 'published' : 'draft'),
          uri: Form.uri
        })
        emit("close")
      }
    }

    function appendInput (sectionName) {
      formErrors.removeError(sectionName)
      return Form.sections[sectionName].data.push({ text: '', id: ++this.uniqueKey })
    }

    function requestClose(resetState) {
      // With proxy values we are editing state directly
      // Therefore we need to undo these changes
      if (resetState || projectActions.value.exit === 'Discard Changes') {
        store.commit('art/setProject', {
          index: (InitialState.isPublished ? 'published' : 'draft'), 
          payload: InitialState
        })
      }
      emit("close")
    }

    return {
      Form,
      capitalize,
      assetBucket,
      uniqueKey,
      dragging,
      renderGuide,
      appendInput,
      processUploadedImages,
      projectActions,
      api,
      formErrors,
      requestClose
    }
  }
})
</script>

<template lang='pug'>

form(id='modify-project' @submit.prevent)
  proto-layout
    template(v-slot:proto-header)
      div(id='modify-project-header')
        div(class='static-header-title')
          h1 {{ Form.creationDate ? 'Edit' : 'New' }} Project
        div(class='static-header-action')
          button(class='decline-button' @click.prevent='requestClose()') 
            div {{ api.result.error ? 'Close' : projectActions.exit }}
            i(class='material-icons') clear
    template(v-slot:proto-content)
      proto-layout(class='modify-project-section' :class='{ "section-error": formErrors.data.find(el => el.section === "title") }')
        template(v-slot:proto-header)
          div(class='section-header')
            div(class='static-header-title')
              img(:src='`${assetBucket}/svg/ModifyProject/title.svg`' alt='Title')
              h2 Title
        template(v-slot:proto-content)
          input(class='section-input' type='text' v-model='Form.title' @input='formErrors.removeError("title")' placeholder='Title' label='Title' autocomplete='off')
        template(v-slot:proto-footer)
          hr
      proto-layout(v-for='(SectionValue, SectionName, SectionIndex) in Form.sections' class='modify-project-section' :class='{ "section-error": formErrors.data.find(el => el.section === SectionName) }')
        template(v-slot:proto-header)
          div(class='section-header')
            div(class='static-header-title')
              img(:src='`${assetBucket}/svg/ModifyProject/${SectionName}.svg`' :alt='SectionName')
              h2 {{ capitalize(SectionName) }}
            div(class='static-header-action')
              button(class='accept-button' @click.prevent='appendInput(SectionName)')
                i(class=' material-icons') add
        template(v-slot:proto-content)
          div(class='dashed-border')
            div(v-if='!SectionValue.data.length')
              h3 No {{ SectionName }}. Click the plus icon to add some!
            drag-drop(v-else v-model='Form.sections[SectionName].data' :group='{ name: SectionName }' itemKey='id' :tag='renderGuide.sections[SectionName].listType' @start='dragging=true' @end='dragging=false' class='modify-project-dragdrop-rectangle' ghost-class='ghost' :animation='200')
              template(v-slot:item='{ element, index }')
                div(class='section-element' :var='inputType = renderGuide.sections[SectionName].inputType')
                  i(class='material-icons dragdrop-handle') drag_handle
                  li(class='section-step-number' v-if='SectionName==="steps"')
                  li(class='section-input' v-if='inputType==="image"')
                    label
                      // label(v-if='index===0' for='static-image-preview')
                      div(v-if='index===0') Featured Image
                      div(class='static-image-preview' v-if='element.src || element.name')
                        img(v-if='element.src' :src='element.src')
                        img(v-else src='/LoadingImage.svg')
                        input(v-model='element.text' type='text' placeholder='Image Description')
                      input(v-else='!element.src' type='file' multiple accept='.jpg, .jpeg, .png' @change='processUploadedImages' :dataIndex='index')
                  li(class='section-input' v-else-if='inputType==="text"')
                    input(type='text' v-model='element.text' :placeholder='"New " + SectionName.slice(0, -1)')
                  button(class='decline-button' @click='SectionValue.data.splice(index, 1)')
                    i(class='material-icons') remove
        template(v-slot:proto-footer)
          hr
      proto-layout(id='modify-project-details' class='modify-project-section' :class='{ "section-error": formErrors.data.find(el => el.section === "details") }')
        template(v-slot:proto-header)
          div(class='section-header')
            div(class='static-header-title')
              img(:src='`${assetBucket}/svg/ModifyProject/details.svg`' alt='Details')
              h2 Details
        template(v-slot:proto-content)
          div(class='dashed-border')
            label(class='section-element') Cost
              div
                div $
                input(type='number' placeholder='0.00' v-model='Form.details.cost')
            label(class='section-element' v-for='(detailValue, detailName) in renderGuide.details') {{ capitalize(detailName) }}
              select(v-model='Form.details[detailName]')
                option(v-for='option in detailValue' :value='option') {{ option }}
        template(v-slot:proto-footer)
          hr

    template(v-slot:proto-footer)
      proto-layout(class='section-error modify-project-section' v-if='formErrors.data.length')
        template(v-slot:proto-header)
          div(class='section-header')
            div(class='static-header-title')
              img(:src='`${assetBucket}/svg/ModifyProject/error.svg`' alt='Error')
              h2 Error
            div(class='static-header-action')
              button(class='neutral-button' @click.prevent='formErrors.resetErrors()') Okay
            
        template(v-slot:proto-content)
          div(id='project-error-messages' class='dashed-border')
            ul(class='section-element')
              li(v-for='error in formErrors.data') {{ error.message }}
        template(v-slot:proto-footer)
          hr
      div(id='modify-project-gateway' class='modify-project-section')
        div(id='modify-project-confirmation' v-if='(!api.result.message && !api.result.error && api.result.pending === false) || formErrors.data.length')
          button(class='decline-button' @click.prevent='api.methods.deleteProject()') {{ projectActions.decline }}
          button(class='neutral-button' @click.prevent='api.methods.updateProject(projectActions.neutral.startsWith("Hide") ? false : undefined)') {{ projectActions.neutral }}
          button(class='accept-button' @click='api.methods.updateProject(true)') {{ projectActions.accept }}
        div(id='modify-project-status' v-else)
          div(class='project-status-state' v-if='api.result.error')
            div There was an error processing your request:
            div {{ api.result.message || 'Unknown Error' }}
          div(class='project-status-state' v-else-if='api.result.pending')
            div Please Wait
            div(class='project-status-state' v-if='api.result.message') {{ api.result.message }}
          div(v-else)
            div Request completed.

</template>

<style scoped lang="less">
@import '@/assets/css/global.less';

// Main root elements
ul,
ol {
  padding: 0;
  margin: 0;
}
ul {
  list-style-type: none;
}
ol {
  list-style-type: decimal;
  list-style-position: inside;
}
i,
input {
  user-select: none;
}
img {
  &:extend(.unselectable-image);
  display: flex;
  width: 40px;
  height: 40px;
}
input {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 2px;
  margin: 5px;
}
input[type='text'] {
  background-color: transparent;
  border: 0;
  border-bottom: 2px solid black;
  font-size: 1rem;
  &:focus {
    outline: none;
  }
}
.dark-theme {
  input,
  select {
    background-color: #75746f;
  }
}

// Global imports
hr {
  display: flex;
  border: 0;
  height: 1px;
  margin: 15px 0 10px 0;
  background-color: #d6d6d6;
}
.dashed-border {
  border-color: @var-graphite;
}

// Component Import: DragDrop
.item-placeholder {
  min-height: 50px;
  display: none;
  width: 100%;
  box-sizing: border-box;
}
.ghost {
  background: #c8ebfb;
}
.dark-theme {
  .ghost {
    background: #3ab7f1;
  }
}
.dragdrop-handle {
  &:hover {
    cursor: pointer;
  }
}

// Main Component Export
#modify-project {
  display: flex;
  align-content: center;
  align-items: center;
  align-self: center;
  justify-content: center;
  flex-wrap: wrap;
  flex-flow: column;
  margin: 0 10px 0 10px;
  background-color: inherit;
}
.modify-project-section {
  &:extend(.hand-drawn-container);
  display: flex;
  flex-direction: column;
  padding-left: 10px;
  padding-right: 10px;
  background-color: @var-paper;
  margin: 15px 0 15px 0;
  border: 2px solid @var-graphite;
}
.dark-theme {
  .modify-project-section {
    background-color: @var-graphite;
  }
}
.proto-header {
  user-select: none;
}
#modify-project-header {
  display: flex;
  flex-wrap: wrap-reverse;
  padding: 2px;

  button {
    display: flex;
    flex: 0 1 1;
    padding: 3px;
  }
  .static-header-title {
    display: flex;
    flex: 0 1 0;
    white-space: nowrap;
  }
  .static-header-action {
    display: flex;
    flex: 1 1 0;
    justify-content: flex-end;
  }
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 5px 0 5px 0;
  button {
    margin-right: 7px;
  }
}
.static-header-title {
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  img {
    width: 30px;
    height: 30px;
    margin: 5px;
  }
}
.dashed-border {
  display: flex;
  flex-direction: column;
  h3 {
    user-select: none;
    margin: 10px;
  }
  div {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
  }
  label {
    display: flex;
    flex-direction: column;
  }
  .section-element {
    margin: 5px;
    padding: 7px 5px 7px 0;
  }
}
.modify-project-dragdrop-rectangle {
  display: flex;
  flex: 1;
  flex-direction: column;
}
.section-input {
  display: flex;
  flex: 1;
}
.section-step-number {
  display: list-item;
  box-sizing: border-box;
  margin: 0 0 0 3px;
}
.section-error {
  border-color: @var-lightRed;
  .dashed-border {
    border-color: @var-lightRed;
  }
  hr {
    background-color: @var-lightRed;
  }
}
#modify-project-gateway {
  display: flex;
  min-height: 20px;
  padding: 5px;
}
#modify-project-confirmation {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  align-content: center;
  flex-flow: row nowrap;
  flex: 1 0;
  button {
    padding: 5px;
  }
}
#modify-project-status {
  &:extend(.hand-drawn-border);
  border: 2px solid @var-graphite;
  display: flex;
  align-self: center;
  align-items: center;
  justify-content: center;
  padding: 5px;
  min-width: 30%;
  background-color: @var-lightBlue;
  .project-status-state {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
}
</style>