import { gql } from "apollo-server";

const schema = gql`
scalar Date

type Team {
  id: ID!
  name: String!
  users: [User!]!
  programs: [Program!]!
}

type User {
  id: ID!
  firstName: String!
  lastName: String!
  email: String!
  role: Role!
  teams: [Team!]!
}

type Role {
  id: ID!
  name: String!
  description: String!
}

type Program {
  id: ID!
  name: String!
  description: String!
  team: Team!
  datasets: [Dataset!]!
  targets: [Target!]!
  tags: [Tag!]!
}

type Tag {
  id: ID!
  name: String!
  description: String!
  tagType: String!
  programs: [Program!]!
  dataset: [Dataset!]!
}

type Target {
  id: ID!
  program: Program!
  category: String!
  categoryValue: String!
  target: Float!
}

type Dataset {
  id: ID!
  name: String!
  description: String!
  program: Program!
  records: [Record!]!
  inputter: User!
  tags: [Tag!]!
}

type Record {
  id: ID!
  dataset: Dataset!
  publicationDate: Date
  category: String!
  categoryValue: String!
  count: Int!
}

input UpsertUserInput {
  id: ID
  firstName: String!
  lastName: String!
  email: String!
  role: String!
}

type UpsertUserOutput {
  user: User!
}

type DeleteUserOutput {
  id: ID!
}

type Query {
  # Retrieve a single user.
  user(id: ID!): User
}

type Mutation {
  # Upsert a user.
  upsertUser(input: UpsertUserInput): UpsertUserOutput!

  # Delete a user.
  deleteUser(id: ID!): DeleteUserOutput!
}
`
export { schema };