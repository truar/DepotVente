import { Inject, Injectable } from '@nestjs/common'
import type { User, CreateUserInput, UpdateUserInput } from '@cmr-apps/types'
import bcrypt from 'bcrypt'
import {
  USER_REPOSITORY,
  type IUserRepository,
} from './user-repository.interface.js'

/**
 * Service métier pour les utilisateurs
 * Contient la logique métier et utilise le repository pour l'accès aux données
 */
@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll()
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id)
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email)
  }

  async createUser(data: CreateUserInput): Promise<User> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10)
    }
    return this.userRepository.create(data)
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10)
    }
    return this.userRepository.update(id, data)
  }

  async deleteUser(id: string): Promise<void> {
    return this.userRepository.delete(id)
  }

  async getUserCount(): Promise<number> {
    return this.userRepository.count()
  }

  /**
   * Vérifier les credentials de connexion
   */
  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email)
    if (!user || !user.password) {
      return null
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    return isPasswordValid ? user : null
  }
}
