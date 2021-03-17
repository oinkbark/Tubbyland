import compileSchema from '../schema'
import { graphql } from 'graphql'

export default class InternalClient {
  schema: any = null

  private async verifySchema() {
    if (this.schema) return true
    else return this.schema = await compileSchema()
  }

  async run(query:string, variables:any, session:any = null) {
    await this.verifySchema()
    return graphql({
      schema: this.schema,
      source: query,
      variableValues: variables,
      ...(session) && { contextValue: { ctx: { session } } }
    })
  }
}

async ({ query, variables }:any) => {
  graphql({
    schema: await compileSchema(),
    source: query,
    variableValues: variables
  })
}