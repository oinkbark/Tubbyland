import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class OAuthUser {
  @Field()
  name!: string

  @Field()
  email!: string

  @Field()
  icon!: string
}

@ObjectType()
export class OAuthToken {
  @Field()
  value!: string

  @Field()
  expiration!: Date
}

@ObjectType()
export class OAuthResponse {
  @Field(() => OAuthToken)
  token!: OAuthToken
}
