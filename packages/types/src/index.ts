// Shared types for frontend and backend.
//
// The Zod schemas and row types are generated from the Prisma schema
// (`pnpm --filter database db:generate`); only the User shape, which the auth
// code on both sides reads, is written by hand.

export * from './generated/index.js'

export interface User {
  id: string
  email: string
  password: string
  role: 'ADMIN' | 'BENEVOLE'
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

export type CreateUserInput = Pick<User, 'email' | 'password'>

export type UpdateUserInput = Partial<CreateUserInput>
