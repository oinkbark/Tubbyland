import { Storage } from '@google-cloud/storage'
import { ServerKey } from 'secrets'

export default class GoogleStorage {
  constructor({ bucketName }:any = 'api') {
    this.bucketName =`${bucketName}.tubbyland.com`
  }
  readonly bucketName:string = ''
  readonly api = new Storage({
    projectId: 'tubbyland',
    // Must be a service account
    // Must be listed as a domain owner: https://www.google.com/webmasters/verification/home
    // Must have create, delete, and list bucket permissions
    credentials: ServerKey
  })
  readonly defaultIAM:any = [
    {
      role: 'roles/storage.legacyBucketOwner',
      members: [ 'projectEditor:tubbyland', 'projectOwner:tubbyland' ]
    },
    {
      role: 'roles/storage.legacyBucketReader',
      members: [ 'projectViewer:tubbyland' ]
    },
    {
      role: 'roles/storage.objectAdmin',
      members: [ 'projectEditor:tubbyland', 'projectOwner:tubbyland' ]
    }
  ]
  readonly publicIAM:any = [
    {
      role: 'roles/storage.objectViewer',
      members: [ 'allUsers' ]
    }
  ]
  async createBucket() {
    try {
      await this.api.createBucket(this.bucketName, {
        location: 'US-WEST4',
        storageClass: 'STANDARD'
      })

      const bucket = this.api.bucket(this.bucketName)

      await bucket.setMetadata({
        // Disable fine-grained ACL's
        iamConfiguration: {
          uniformBucketLevelAccess: {
            enabled: true,
          }
        },
        // Save space & cost
        versioning: {
          enabled: false
        }
      })

      await this.setBucketAccess(false)

      // await api.bucket(bucketName).setCorsConfiguration([
      //   {
      //     method: ['PUT'],
      //     origin: ['https://tubbyland.com'],
      //   }
      // ])

    } catch(e) {
      console.error(e)
      return false
    }
    return true
  }
  async setBucketAccess(toPublic?:boolean) {
    try {
      const bucket = this.api.bucket(this.bucketName)

      await bucket.iam.setPolicy({
        version: 3,
        bindings: [
          ...this.defaultIAM,
          ...(toPublic ? this.publicIAM : [])
        ]
      })

    } catch (e) {
      console.error(e)
    }
  }
  async markBucket() {
    try {
      // Remove all objects
      await this.api.bucket(this.bucketName).addLifecycleRule({
        action: 'delete',
        condition: { age: 0 },
      })

      // Make bucket private
      await this.setBucketAccess(false)

    } catch(e) {
      console.error(e)
      return false
    }
    return true
  }
  async deleteEmptyBucket(bucketName:string = this.bucketName) {
    try {
      await this.api.bucket(bucketName).delete()
    } catch(e) {
      return false
    }
    return true
  }
  async deleteOrphanBuckets():Promise<number> {
    let deleteCount = 0
    const [list] = await this.api.getBuckets()
    for (const bucket of list) {
      const hasLifecycle = bucket.metadata.lifecycle?.rule?.length
      if (!hasLifecycle) continue
  
      const isMarked = bucket.metadata.lifecycle.rule.some((r:any) => r.action.type === 'Delete' && r.condition.age === 0)
      if (isMarked) try {
        const success = await this.deleteEmptyBucket(bucket.name)
        if (success) deleteCount++
      } catch {
        continue
      }
    }
    return deleteCount
  }
}
