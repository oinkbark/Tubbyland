// GrapqhQL
import { ApolloError, AuthenticationError } from 'apollo-server-koa'
import { Resolver, Mutation, Query, Arg, Authorized, Ctx } from 'type-graphql'
// import { Context } from 'koa'
import { validate } from 'class-validator'
import { plainToClass, classToPlain } from 'class-transformer'

import { MongoDB, MongoService } from '../../services/nomad/mongo'
import RedisService from '../../services/nomad/redis'
import { randomBytes } from 'crypto'
import merge from 'deepmerge'

import GoogleStorage from '../../services/GoogleStorage'

import * as Util from '../../services/util' 
import * as Types from './output'
import * as Input from './input'


export interface ICache {
  enabled: boolean,
  size: {
    [key: string]: number
    published: number,
    draft: number
  }
}

@Resolver()
export default class ArtProjectResolver {
  private readonly databaseName:string = process.env.PREVIEW ? 'Preview' : 'OinkServer'
  private readonly collectionName:string = 'Projects'

  private RedisClient:any = null
  private MongoService:any = null

  private cache:ICache = {
    enabled: Boolean(!process.env.PREVIEW && this.RedisClient),
    size: {
      published: 0,
      draft: 0
    }
  }
  private async verifyMongoConnection():Promise<boolean> {
    if (this.MongoService?.collection) return true

    const newService = new MongoService()
    const result = await newService.verifyConnection(this.databaseName, this.collectionName)
    if (result === true) {
      this.MongoService = newService
      await this.MongoService.collection.createIndex({ uri: 1 }, { unique: true })
      return result
    } else {
      throw new ApolloError('Cannot connect to database', '503')
    }
  }
  private async verifyRedisConnection():Promise<boolean> {
    if (this.RedisClient) return true

    const newService = new RedisService()
    const result = await newService.verifyConnection()
    if (result === true) this.RedisClient = newService.client

    return result
  }

  private async fillCache(index: string = 'published'):Promise<boolean> {
    if (await this.verifyRedisConnection() === false) return false

    const projects = await this.getAllProjectsDirectly(index)
    if (projects.length === 0) {
      console.debug('No projects found to fill cache with')
      return true
    }

    for await (const project of projects) {
      const field = project.uri
      const value = JSON.stringify(project)
      await this.RedisClient.hset(index, [field, value])
    }
    this.cache.size[index] = await this.RedisClient.hlen(index)

    return true
  }

  private async updateCache(index:string, uri:string):Promise<boolean> {
    if (await this.verifyRedisConnection() === false) return false

    const project = await this.getProjectDirectly(uri, true)
    const field = uri
    const value = JSON.stringify(project)
    await this.RedisClient.hset(index, [field, value])

    return true
  }

  // hash com.tubbyland.published
  // hash com.tubbyland.drafts
  // hash com.tubbyland.sessions
  // each hash field is the title, and the field value is json string of project


  private async getAllProjectsFromCache(index:string = 'published'):Promise<Array<Types.ArtProjectType>> {
    if (await this.verifyRedisConnection() === false) return []

    if (this.cache.size[index] === 0) await this.fillCache(index)
    const result = await this.RedisClient.hgetall(index)
    const stringProjects:Array<string> = Object.values(result)
    let realProjects = []

    for await (const item of stringProjects) {
      realProjects.push(JSON.parse(item))
    }
    return realProjects
  }

  private async getAllProjectsDirectly(index:string = 'published'):Promise<Array<Types.ArtProjectType>> {
    await this.verifyMongoConnection()
    const filter = {
      isPublished: Boolean(index === 'published')
     }

     const result = await this.MongoService.collection.find(filter)
    if (await result.count() === 0) return []
    else return await result.toArray()
  }

  private async getProjectFromCache(uri:string, index:string = 'published'):Promise<Types.ArtProjectType | null> {
    if (await this.verifyRedisConnection() === false) return null

    // Nomad health check triggers this to minimize cache misses
    if (this.cache.size[index] === 0) {
      await this.fillCache(index)
      if (!this.cache.size[index]) return null
    }
    const result = await this.RedisClient.hget(index, uri)
    return JSON.parse(result || '')
  }

  private async getProjectDirectly(identifier: string, isURI?: boolean):Promise<Types.ArtProjectType> {
    await this.verifyMongoConnection()

    const filter:any = isURI ? {  uri: identifier } : { _id: new MongoDB.ObjectId(identifier) }

    const result = await this.MongoService.collection.findOne(filter)

    return result
  }

  private async deleteProjectFromCache(index: string, uri: string):Promise<boolean> {
    if (await this.verifyRedisConnection() === false) return false
    await this.RedisClient.hdel(index, uri)
    return true
  }

  private async deleteProjectDirectly(_id: string) {
    await this.verifyMongoConnection()

    const filter = { _id: new MongoDB.ObjectId(_id) }

    await this.MongoService.collection.deleteOne(filter)

    return true
  }

  @Query(() => [Types.ArtProjectType], { nullable: true })
  public async getAllProjects(
    @Arg('limits', { nullable: true }) limits: Input.ProjectReturnLimits,
    @Arg('index', { nullable: true }) index: string = 'published',
    @Ctx() ctx: any):Promise<Array<Types.ArtProjectType> | null> {

    if (index !== 'published') {
      let shouldThrow = false
      const sessionKey = ctx?.cookies.get('oinkserver.session')
      
      if (!sessionKey) shouldThrow = true
      else {
        const session = await ctx?.sessionStore.get(sessionKey)
        if (!session?.oauth?.user) shouldThrow = true
      }

      if (shouldThrow) throw new AuthenticationError(`Requested index: "${index}" is a protected resource`)
    }
    
    let allProjects = null
    if (this.cache.enabled && this.cache.size[index] !== 0) allProjects = await this.getAllProjectsFromCache(index)
    else allProjects = await this.getAllProjectsDirectly(index)

    if (allProjects?.length && limits) {
      if (limits.offset) allProjects.splice(0, limits.offset)
      if (limits.total && allProjects.length > limits.total) allProjects.length = limits.total
      if (limits.images) {
        for (const project of allProjects) {
          if (!project.sections?.images?.data.length) continue
          if (project.sections?.images?.data.length < limits.images) continue
          project.sections.images.data.length = limits.images
        }
      }
    }
    
    return allProjects
  }

  // Index is ignored when fetching by ID
  @Query(() => Types.ArtProjectType, { nullable: true })
  public async getProject(
    @Arg('identifier') identifier: string,
    @Arg('isURI', { nullable: true }) isURI: boolean = false,
    @Arg('index', { nullable: true }) index: string = 'published',
    @Ctx() ctx: any):Promise<Types.ArtProjectType | null> {

    if (index !== 'published') {
      let shouldThrow = false
      const sessionKey = ctx?.cookies.get('oinkserver.session')
      
      if (!sessionKey) shouldThrow = true
      else {
        const session = await ctx?.sessionStore.get(sessionKey)
        if (!session?.oauth?.user) shouldThrow = true
      }

      if (shouldThrow) throw new AuthenticationError(`Requested index: "${index}" is a protected resource`)
    }

    let result = null

    if (isURI) {
      if (this.cache.enabled) {
        const cached = await this.getProjectFromCache(identifier, (index || 'published'))
        if (cached) return cached
      }
      result = await this.getProjectDirectly(identifier, true)
      
      // We can also make getProjectDirectly accept a filter, but this is acceptable
      // If we fetch by ID (like for updateProject) we do not care about index filter
      if (index) {
        if (index === 'draft' && result?.isPublished === true) return null
        else if (index === 'published' && result?.isPublished === false) return null
      }
    }
    else result = await this.getProjectDirectly(identifier, false)

    return result
  }


  @Authorized()
  @Mutation(() => Types.ArtProjectType)
  public async spawnProject(
  @Arg('title') title: string) {
    await this.verifyMongoConnection()

    const initState = {
      title,
      isPublished: false,
      publishDate: undefined,
      revisionDate: undefined,
      uri: Util.formatTitle(title),
      stateHash: randomBytes(12).toString('hex'),
      creationDate: new Date(Date.now())
    }

    const result = await this.MongoService.collection.insertOne(initState)
    if (result.insertedCount === 0) throw new ApolloError('Failed to spawn project', '500')

    const projectStorage = new GoogleStorage({ bucketName: result.ops[0]._id })
    await projectStorage.createBucket()

    if (this.cache.enabled) this.updateCache('draft', result.ops[0]?.uri)

    return plainToClass(Types.ArtProjectType, result.ops[0])
  }

  @Authorized()
  @Mutation(() => Types.ArtProjectType)
  public async updateProject(
  @Arg('_id') _id: string,
  @Arg('revisions') revisions: Input.ArtProjectInput,
  @Arg('renewCache', { nullable: true }) renewCache: boolean = true):Promise<Types.ArtProjectType> {
    await this.verifyMongoConnection() 

    const currentState = await this.getProjectDirectly(_id)
    if (!currentState) throw new ApolloError('Cannot locate project', '400')

    let serverGenerated:any = {
      stateHash: randomBytes(12).toString('hex'),
      ...(revisions.title) && { uri: Util.formatTitle(revisions.title) },
      ...(revisions.details) && { details: plainToClass(Types.ProjectDetailsType, revisions.details) },
      ...(revisions.sections) && { sections: plainToClass(Types.ProjectSectionsType, revisions.sections) }
    }

    let publishedStateChanged = false

    if (currentState.isPublished) {
      // State of publish changed to "not published"
      if (revisions.isPublished === false) {
        publishedStateChanged = true
        serverGenerated['publishDate'] = undefined
        serverGenerated['revisionDate'] = undefined
      }
      //  Sate of publish not changed; standard revision
      else {
        serverGenerated['revisionDate'] = new Date(Date.now())
      }
    }
    // State of publish changed to "published"
    else if (revisions.isPublished === true) {
      publishedStateChanged = true
      serverGenerated['publishDate'] = new Date(Date.now())
    }
    const overwriteMerge = (_destinationArray:Array<any>, sourceArray:Array<any>, _options:any) => sourceArray

    const modifiedProperties = merge(classToPlain(revisions), serverGenerated, { arrayMerge: overwriteMerge })
    const newState = merge(currentState, modifiedProperties)
    const newType = modifiedProperties.isPublished ? new Types.PublishedProjectType() : new Types.ArtProjectType()
    const testClass = merge(newType, newState)

    const projectValidationErrors = await validate(testClass)
    console.debug(projectValidationErrors)

    if (projectValidationErrors.length) {
      let message:string = 'Cannot update project with invalid values'
      if (modifiedProperties.isPublished) message = 'Cannot publish incomplete draft'
      throw new ApolloError(message, '400')
    }

    const filter =  { _id: new MongoDB.ObjectId(_id) }
    const instructions = { $set: modifiedProperties }
    const options = { returnOriginal: false }

    const result = await this.MongoService.collection.findOneAndUpdate(filter, instructions, options)
    const newIndex = result.isPublished ? 'published' : 'draft'

    if (publishedStateChanged) {
      const projectStorage = new GoogleStorage({ bucketName: result.value?._id })
      await projectStorage.setBucketAccess(result.value?.isPublished)
    }

    if (renewCache && this.cache.enabled) {
      if (modifiedProperties.uri) {
        this.deleteProjectFromCache(newIndex, currentState.uri)
      }
      if (publishedStateChanged) {
        const oldIndex = currentState.isPublished ? 'draft' : 'published'
        this.deleteProjectFromCache(oldIndex, result.value?.uri)
        // or, use event bus and make redis subscribe to project update event emit
        // that way if you have multiple cache servers, they all update and you dont have to loop each one

      }
      this.updateCache(newIndex, result.value?.uri)
    }

    return plainToClass(Types.ArtProjectType, result.value)
  }

  @Authorized()
  @Mutation(() => Boolean)
  public async deleteProject(
  @Arg('_id') _id: string,
  @Arg('renewCache', { nullable: true }) renewCache: boolean = true):Promise<boolean> {
    if (renewCache && this.cache.enabled) {
      const currentProject = await this.getProjectDirectly(_id)
      const currentIndex = currentProject.isPublished ? 'published' : 'draft'
      
      this.deleteProjectFromCache(currentIndex, currentProject.uri)
    }
    await this.deleteProjectDirectly(_id)

    const projectStorage = new GoogleStorage({ bucketName: _id })
    await projectStorage.markBucket()

    return true
  }

  @Authorized()
  @Mutation(() => Boolean)
  public async resetAllProjects(
    @Arg('index', { nullable: true }) index: string = 'published'):Promise<boolean> {
    
    const projects = await this.getAllProjectsDirectly(index)
    if (!projects) return false

    for await (const project of projects) {
      await this.deleteProject(project._id, false)
    }
    return true
  }

  @Authorized()
  @Mutation(() => Number)
  public async deleteOrphanBuckets():Promise<number> {
    const projectStorage = new GoogleStorage()
    const result = await projectStorage.deleteOrphanBuckets()
    console.debug(`Deleted ${result} Orphan Buckets`)

    return result
  }
}
