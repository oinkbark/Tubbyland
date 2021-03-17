import { Field, InputType, /*Authorized*/ } from 'type-graphql'
import { Matches, IsString, IsNumber, IsPositive, ValidateNested } from 'class-validator'
import * as Types from './output'

@InputType()
export class ProjectReturnLimits {
  @Field({ nullable: true })
  @IsPositive()
  images?: number

  @Field({ nullable: true })
  @IsPositive()
  total?: number

  @Field({ nullable: true })
  @IsPositive()
  offset?: number
}

@InputType()
export class SectionDataInput implements Types.SectionDataType {
  @Field()
  text!: string

  @Field({ nullable: true })
  name?: string
}

@InputType()
export class ProjectSectionInput implements Types.ProjectSectionType {
  @Field(() => [SectionDataInput])
  data!: Array<SectionDataInput>
}

@InputType()
export class ProjectSectionsInput implements Types.ProjectSectionsType {
  @Field(() => ProjectSectionInput, { nullable: true })
  images?: ProjectSectionInput

  @Field(() => ProjectSectionInput, { nullable: true })
  materials?: ProjectSectionInput

  @Field(() => ProjectSectionInput, { nullable: true })
  steps?: ProjectSectionInput
}

@InputType()
export class PublishedSectionsInput implements Types.PublishedSectionsType {
  @Field(() => ProjectSectionInput)
  images!: ProjectSectionInput

  @Field(() => ProjectSectionInput)
  materials!: ProjectSectionInput

  @Field(() => ProjectSectionInput)
  steps!: ProjectSectionInput
}

@InputType()
//@Type(() => Types.ProjectDetailsType)
export class ProjectDetailsInput implements Types.ProjectDetailsType {
  @Field({ nullable: true })
  @IsString()
  @Matches(/^(A couple minutes|Around an hour|A few hours|All day|Multiple days)/s)
  duration?: Types.ProjectDurationList

  @Field({ nullable: true })
  @IsString()
  @Matches(/^(Beginner|Easy|Normal|Challenging|Advanced)/s)
  difficulty?: Types.ProjectDifficultyList

  @Field({ nullable: true })
  @IsNumber()
  cost?: number
}

@InputType()
export class PublishedDetailsInput implements Types.PublishedDetailsType {
  @Field()
  duration!: Types.ProjectDurationList

  @Field()
  difficulty!: Types.ProjectDifficultyList

  @Field()
  cost!: number
}

@InputType()
export class ArtProjectInput {
  @Field({ nullable: true })
  title?: string

  @Field({ nullable: true })
  isPublished?: boolean

  @Field(() => ProjectSectionsInput, { nullable: true })
  @ValidateNested()
  sections?: ProjectSectionsInput

  @Field(() => ProjectDetailsInput, { nullable: true })
  @ValidateNested()
  details?: ProjectDetailsInput
}

// @InputType()
// export class getAllProjects {
//   @Field({ nullable: true })
//   limits?: ProjectReturnLimits

//   @Field({ nullable: true })
//   @Authorized()
//   @Matches(/^(published|draft)/is)
//   index: string = 'published'
// }

// @InputType()
// export class getProject {
//   @Field()
//   identifier!: string

//   @Field({ nullable: true })
//   isURI?: boolean

//   @Field({ nullable: true })
//   @Authorized()
//   @Matches(/^(published|draft)/is)
//   index: string = 'published'
// }
