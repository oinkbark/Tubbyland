import { getComplexity, simpleEstimator, fieldExtensionsEstimator } from "graphql-query-complexity"

export default class QueryPlugin{
  constructor(schema:any) {
    this.schema = schema
  }
  schema:any

  validateComplexity(request:any, document:any, maxComplexity:number = 50) {
    const estimatedValue = getComplexity({
      schema: this.schema,
      // Only check requested operation, not entire document
      operationName: request.operationName,
      query: document,
      variables: request.variables,
      estimators: [
        fieldExtensionsEstimator(),
        // Each field has a default of 1 if not set
        simpleEstimator({ defaultComplexity: 1 }),
      ],
    })
    if (estimatedValue > maxComplexity) throw new Error(`Operation complexity of ${estimatedValue} exceeds the max allowable of ${maxComplexity}`)
  }
}
