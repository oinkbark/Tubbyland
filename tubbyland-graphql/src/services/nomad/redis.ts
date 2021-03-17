import { createNodeRedisClient } from 'handy-redis'

export default class RedisService {
  client:any = null
  readonly options:any = {
    host: 'tubbyland-redis.service.consul'
  }
  
  async init():Promise<boolean> {
    try {
      this.client = await createNodeRedisClient(this.options)
    } catch(err) {
        console.error(err)
        return false
    }
    return true
  }
  async verifyConnection():Promise<boolean> {
    if (this.client) return true

    await this.init()
    if (this.client) {
      return true
    }
    else return false
  }
}
