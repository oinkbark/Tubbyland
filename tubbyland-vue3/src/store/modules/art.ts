import InternalAPI from '@/components/InternalAPI'
import GoogleAPI from '@/components/GoogleAPI'

const api = new InternalAPI()
api.methods = {
  async fetchFullProject(uri:string, index:string = 'published') {
    console.debug(`Store.Art -> fetchFullProject: Fetching full project from index ${index}`)
    const query = 'query ($identifier: String!, $isURI: Boolean!, $index: String!) { getProject(identifier: $identifier, isURI: $isURI, index: $index) { _id, uri, title, stateHash, creationDate, isPublished, publishDate, revisionDate, sections { images { data { name, text } }, materials { data { text } }, steps { data { text } } }, details { duration, difficulty, cost } } }'
    const variables = {
      identifier: uri,
      isURI: true,
      index
    }
    const apiRes = await api.query(query, variables)
    const payload = apiRes?.getProject

    return payload
  },
  async fetchPartialProject(uri:string, index:string = 'published') {
    console.debug(`Store.Art -> fetchPartialProject: Fetching partial project from index: ${index}`)
    const query = 'query ($identifier: String!, $isURI: Boolean!, $index: String!) { getProject(identifier: $identifier, isURI: $isURI, index: $index) { stateHash, publishDate, revisionDate, sections { images { data { name, text } }, materials { data { text } }, steps { data { text } } } } }'
    const variables = {
      identifier: uri,
      isURI: true,
      index
    }
    const apiRes = await api.query(query, variables)
    const payload = apiRes?.getProject

    return payload
  },
  // stateHash is specifically not fetched
  // that is how we know that the full data has not been fetched for it yet
  async fetchPreviews(index:string):Promise<any[]> {
    const query = 'query ($index: String, $limits: ProjectReturnLimits) { getAllProjects(index: $index, limits: $limits) { _id, title, uri, creationDate, isPublished, sections { images { data { name, text } } }, details { cost, difficulty, duration } } }'
    const variables = { index, limits: { images: 1 } }

    const apiRes = await api.query(query, variables)

    const payload = apiRes?.getAllProjects || []

    return payload
  }
}

export default {
  namespaced: true,
  state: () => ({
    published: {
      data: {},
      didFetch: false
    },
    draft: {
      data: {},
      didFetch: false
    }
  }),
  actions: {
    async populateFullProject({ commit, dispatch }:any, args:any) {
      const { uri, index } = args
      const payload = await api.methods.fetchFullProject(uri, index)
      if (!payload) return

      commit('setProject', { index, payload })
      await dispatch('populateMediaSrc', { uri, index })

    },
    async populatePreviews({ commit, dispatch }:any, args:any) {
      const { index } = args
      const payload = await api.methods.fetchPreviews(index)
      if (!payload) return

      commit('setPreviews', { index, payload })

      for (const preview of payload) {
        dispatch('populateMediaSrc', { uri: preview.uri, index })
      }
    },
    async populatePartialProject({ getters, commit, dispatch }:any, args:any) {
      const { uri, index } = args
      const payload = await api.methods.fetchPartialProject(uri, index)
      if (!payload) return

      const currentProject = getters['getProject'](uri, index)
      // Make copy & strip proxies
      let newProject = JSON.parse(JSON.stringify(currentProject))
  
      newProject.stateHash = payload.stateHash
      newProject.publishDate = payload.publishDate
      newProject.revisionDate = payload.revisionDate
      newProject.sections = payload.sections

      commit('setProject', { 
        oldState: {
          uri,
          index,
        }, 
        index, 
        payload: newProject 
      })
      await dispatch('populateMediaSrc', { uri, index })
    },
    async populateMediaSrc({ getters, dispatch, commit }:any, args:any) {
      const { uri, index } = args
      const project = getters['getProject'](uri, index)
      if (!project) throw new Error('Invalid index; cannot prefetch protected index without auth')
      if (!project.sections?.images?.data?.length) return
    
      const modifiedMedia = await dispatch('attachMediaSrc', {
        projectID: project._id,
        isPublished: project.isPublished,
        dataArray: project.sections.images.data
      })
      project.sections.images.data = modifiedMedia
  
      commit('setProject', { index, payload: project })
    },
    async attachMediaSrc({ }:any, args:any) {
      const { projectID, isPublished, dataArray } = args

      for (let i=0; i<dataArray.length; i++) {
        // do not redownload image data that was fetched directly
        // This is when projects go from draft -> published
        // Or when loading draft images beyond the first preview
        if (dataArray[i].src?.startsWith('blob:')) continue

        const mediaName = dataArray[i].name
        let mediaSrc

        if (isPublished) {
          const bucketBase = 'https://storage.googleapis.com'
          mediaSrc = `${bucketBase}/${projectID}.tubbyland.com/${mediaName}`
        } else {
          const google = new GoogleAPI()
          mediaSrc = await google.fetchBucketObject(projectID, mediaName)
        }

        dataArray[i].src = mediaSrc
      }

      return dataArray
    }
  },
  getters: {
    getProject(state:any) {
      return (uri:string, index: string = 'published') => {
        return state[index].data[uri]
      }
    },
    findProject(state:any) {
      return (uri:string) => {
        let project = null
        project = state.published.data[uri]
        if (!project && state.auth.user /* && !state.demoMode */ ) {
          project = state.draft.data[uri]
        }
        return project
      }
    }
  },
  mutations: {
    setProject(state:any, { oldState, index, payload }:any) {

      if (oldState) {
        const currentProject = state[oldState.index].data[oldState.uri]
        const newProject = payload
        if (!currentProject) throw new Error(`Project not found in index: ${oldState.index} with uri: ${oldState.uri}`)

        const uriWasChanged = Boolean(oldState.index !== index)
        const indexWasChanged = Boolean(oldState.uri !== newProject.uri)

        const hasCurrentImages = Boolean(currentProject.sections?.images?.data?.length)
        const hasNewImages = Boolean(newProject.sections?.images?.data?.length)

        // used by updateProject and populatePartialProject
        if (hasCurrentImages && hasNewImages) {
          const currentMedia = currentProject.sections.images.data
          const newMedia = newProject.sections.images.data
  
          if (currentMedia[0].src?.startsWith('blob:') && (currentMedia[0].name === newMedia[0].name)) payload.sections.images.data[0] = currentMedia[0]
        }

        if (uriWasChanged || indexWasChanged) delete state[oldState.index].data[oldState.uri]
      }
  
      return state[index].data[payload.uri] = payload
    },
    setPreviews(state:any, { index, payload }:any) {
      state[index].didFetch = true
      for (const project of payload) {
        //  If project has already been loaded in
        if (state[index].data[project.uri]?._id) continue
        state[index].data[project.uri] = project
      }
    },
    deleteProject(state:any, { index, uri }:any) {
      return delete state[index].data[uri]
    },
    removeAuthorizedData(state:any) {
      state.draft.data = {}
      state.draft.didFetch = false
      return
    }
  }
}
