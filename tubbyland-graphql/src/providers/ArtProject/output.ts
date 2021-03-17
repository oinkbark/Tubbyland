import { Field, ObjectType } from 'type-graphql'
import { Min, Max, Matches, IsNotEmpty, IsString, IsNumber, ArrayMinSize, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

// @ObjectType()
// export class ProjectDurationType {
//   @IsString()
//   @Matches(/A couple minutes|Around an hour|A few hours|All day|Multiple days/)
//   @Field()
//   duration?: 'A couple minutes' | 'Around an hour' | 'A few hours' | 'All day' | 'Multiple days'
// }

// @ObjectType()
// export class ProjectDifficultyType {
//   @IsString()
//   @Matches(/Beginner|Easy|Normal|Challenging|Advanced/)
//   @Field()
//   difficulty?: 'Beginner' | 'Easy' | 'Normal' | 'Challenging' | 'Advanced'
// }

// @ObjectType()
// export class ProjectCostType {
//   @IsNumber()
//   @Min(0)
//   @Max(1000)
//   @Field()
//  cost?: number
// }

export type ProjectDifficultyList = 'Beginner' | 'Easy' | 'Normal' | 'Challenging' | 'Advanced';
export type ProjectDurationList = 'A couple minutes' | 'Around an hour' | 'A few hours' | 'All day' | 'Multiple days';


@ObjectType()
export class ProjectDetailsType {
  @Field({ nullable: true })
  @IsString()
  @Matches(/^(A couple minutes|Around an hour|A few hours|All day|Multiple days)/s)
  duration?: ProjectDurationList

  @Field({ nullable: true })
  @IsString()
  @Matches(/^(Beginner|Easy|Normal|Challenging|Advanced)/s)
  difficulty?: ProjectDifficultyList

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  @Max(1000)
 cost?: number
}

@ObjectType()
export class PublishedDetailsType implements ProjectDetailsType {
  @IsNotEmpty()
  @Field()
  duration!: ProjectDurationList

  @IsNotEmpty()
  @Field()
  difficulty!: ProjectDifficultyList

  @IsNotEmpty()
  @Field()
 cost!: number
}

@ObjectType()
export class SectionDataType {
  @Field()
  text!: string

  @Field({ nullable: true })
  name?: string
}

@ObjectType()
export class ProjectSectionType {
  [key: string]: any
  @Field(() => [SectionDataType])
  data!: Array<SectionDataType>
}

@ObjectType()
export class PublishedSectionType implements ProjectSectionType {
  @Field(() => [SectionDataType])
  @ArrayMinSize(1)
  @ValidateNested()
  data!: Array<SectionDataType>
}

@ObjectType()
export class ProjectSectionsType {
  @Field(() => ProjectSectionType, { nullable: true })
  images?: ProjectSectionType

  @Field(() => ProjectSectionType, { nullable: true })
  materials?: ProjectSectionType

  @Field(() => ProjectSectionType, { nullable: true })
  steps?: ProjectSectionType
}

@ObjectType()
export class PublishedSectionsType {
  @Field(() => PublishedSectionType)
  @IsNotEmpty()
  @ValidateNested()
  images!: PublishedSectionType

  @Field(() => PublishedSectionType)
  @IsNotEmpty()
  @ValidateNested()
  materials!: PublishedSectionType

  @Field(() => PublishedSectionType)
  @IsNotEmpty()
  @ValidateNested()
  steps!: PublishedSectionType
}

@ObjectType()
export class ArtProjectType {
  [key: string]: any
  // Server generated dynamic values
  @Field()
  readonly _id!: string

  @Field()
  readonly uri!: string

  @Field()
  readonly stateHash!: string

  @Field()
  readonly creationDate!: Date

  @Field({ nullable: true })
  readonly publishDate?: Date

  @Field({ nullable: true })
  readonly revisionDate?: Date

  //  Human Generated
  @Field()
  title!: string

  @Field()
  isPublished!: boolean

  @Field(() => ProjectSectionsType, { nullable: true })
  @Type(() => ProjectSectionsType)
  @ValidateNested()
  sections?: ProjectSectionsType

  @Field(() => ProjectDetailsType, { nullable: true })
  @Type(() => ProjectDetailsType)
  @ValidateNested()
  //@Transform(value => new ProjectDetailsType(value), { toClassOnly: true })
  details?: ProjectDetailsType
}

@ObjectType()
export class PublishedProjectType extends ArtProjectType {
  @Field()
  readonly _id!: string

  @Field()
  isPublished!: boolean

  @Field()
  publishDate!: Date

  @Field(() => PublishedSectionsType)
  @IsNotEmpty()
  @ValidateNested()
  sections!: PublishedSectionsType

  @Field(() => PublishedDetailsType)
  //@Type(() => ProjectDetailsType)
  //@IsInstance(PublishedDetailsType)
  @IsNotEmpty()
  @ValidateNested()
  details!: PublishedDetailsType
}

@ObjectType()
export class ProjectImageEndpoint {
  @Field()
  filename!: string

  @Field()
  url!: string
}
