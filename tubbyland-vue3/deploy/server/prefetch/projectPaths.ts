import { api } from './api'
import queries from './queries.json'

export async function returnDynamicPaths() {
  let data = null

  const query = queries.fetchPaths
  const variables = { index: 'published' }
  const apiRes = await api(query, variables)
  const payload = apiRes?.getAllProjects

  if (payload) {
    data = {
      index: 'published',
      payload
    }
  }

  return {
    data
  }
}
