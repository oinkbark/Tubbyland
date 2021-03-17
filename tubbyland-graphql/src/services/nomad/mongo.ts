import * as MongoDB from 'mongodb'
import { DatabaseCredentials as Secret } from 'secrets'

export { MongoDB }

export class MongoService {
  readonly credentials:string = `${Secret.username}:${encodeURIComponent(Secret.password)}`
  readonly uri:string = `mongodb://${this.credentials}@tubbyland-mongo.service.consul:27017`

  client:any = null
  database: any = null
  collection: any = null

  async init() {
    try {
      this.client = new MongoDB.MongoClient(this.uri, {
        useUnifiedTopology: true
        // auth: {
        //   username: Secret.username,
        //   password: Secret.password
        // }
      })
    } catch(err) {
      console.error(err)
      return false
    }
    return true
  }
  async connect(databaseName: string, collectionName:string) {
    let connectedDatabase: any = null
    let connectedCollection: any = null

    if (!this.client) return null
  
    try {
      await this.client.connect()
    
      connectedDatabase = this.client.db(databaseName)
      connectedCollection = connectedDatabase.collection(collectionName)
    
      await connectedDatabase.command({ ping: 1 })
      console.debug(`Connected to ${databaseName}:${collectionName}`)
  
      return { database: connectedDatabase, collection: connectedCollection }
    } catch(err) {
      console.error(err)
      return null
    }
  }
  async verifyConnection(databaseName:string, collectionName:string) {
    if (this.client && this.database && this.collection) return true

    let result:any = null
    const initStatus = await this.init()

    if (!initStatus) return false

    if (this.client) {
      result = await this.connect(databaseName, collectionName)
      if (!result || !result.database || !result.collection) return false

      this.database = result.database
      this.collection = result.collection

      return true
    } else {
      return false
    }
  }
}
