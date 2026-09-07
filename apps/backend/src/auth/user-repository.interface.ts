import type { User, CreateUserInput, UpdateUserInput } from '@cmr-apps/types'

export const USER_REPOSITORY = Symbol('USER_REPOSITORY')

/**
 * Interface pour l'accès aux données des utilisateurs
 * Permet de changer facilement de source de données (Prisma, MongoDB, API externe, etc.)
 */
export interface IUserRepository {
  findAll(): Promise<User[]>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(data: CreateUserInput): Promise<User>
  update(id: string, data: UpdateUserInput): Promise<User>
  delete(id: string): Promise<void>
  count(): Promise<number>
}
