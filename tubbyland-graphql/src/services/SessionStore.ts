import RedisService from './nomad/redis'

export default class SessionStore {
  readonly index:string = 'session'
  RedisClient: any = null
  async verifyRedisConnection():Promise<boolean> {
    if (this.RedisClient) return true

    const newService = new RedisService()
    const result = await newService.verifyConnection()
    if (result === true) this.RedisClient = newService.client

    return result
  }
  async get (key:string, _maxAge?:number, _opts?:any) {
    await this.verifyRedisConnection()

    return JSON.parse(await this.RedisClient.hget(this.index, key))
  }
  async set (key:string, sess: any, _maxAge?:number, _opts?:any) {
    await this.verifyRedisConnection()
    await this.RedisClient.hset(this.index, [ key, JSON.stringify(sess) ])

    return true
  }
  async destroy (key:string) {
    await this.verifyRedisConnection()

    return await this.RedisClient.hdel(this.index, key)
  }
}
