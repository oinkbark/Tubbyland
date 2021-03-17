import { buildSchema } from 'type-graphql'
import authChecker from './middleware/authCheck'
import * as Resolvers from './providers'

export default () => buildSchema({
  resolvers: [
    Resolvers.ArtProject,
    Resolvers.OAuth
  ],
  dateScalarMode: 'isoDate',
  authChecker
})
