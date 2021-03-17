import { api } from './api'
import queries from './queries.json'

export async function returnCommitPlan(uri:string) {
  let data = null

  const query = queries.fetchFullProject
  const variables = { identifier: uri, isURI: true, index: 'published' }
  const apiRes = await api(query, variables)
  const payload = apiRes?.getProject

  if (payload) {
    data = {
      index: 'published',
      payload
    }
  }

  return {
    path: 'art/setProject',
    data
  }
}
