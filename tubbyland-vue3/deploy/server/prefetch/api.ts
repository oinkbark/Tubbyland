import fetch from 'node-fetch'

export async function api(query:string, variables:object)  {
  const apiEndpoint = 'https://api.tubbyland.com/graphql'
  //  tubbyland-graphql.service.consul:8080

  const res = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  })

  if (res?.ok !== true && res.status !== 400) {
    console.error(res)
    return null
  }
  else {
    const apiRes = await res.json()

    if (apiRes.errors) {
      console.error(apiRes.errors)
      return null
    }
    else {
      return apiRes.data
    }
  }
}
