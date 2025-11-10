import type { User, CreateUserInput, UpdateUserInput } from "@cmr-apps/types";

/**
 * Interface pour l'accès aux données des utilisateurs
 * Permet de changer facilement de source de données (Prisma, MongoDB, API externe, etc.)
 */
export interface IUserRepository {
  /**
   * Récupérer tous les utilisateurs
   */
  findAll(): Promise<User[]>;

  /**
   * Récupérer un utilisateur par son ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Récupérer un utilisateur par son email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Créer un nouvel utilisateur
   */
  create(data: CreateUserInput): Promise<User>;

  /**
   * Mettre à jour un utilisateur
   */
  update(id: string, data: UpdateUserInput): Promise<User>;

  /**
   * Supprimer un utilisateur
   */
  delete(id: string): Promise<void>;

  /**
   * Compter le nombre total d'utilisateurs
   */
  count(): Promise<number>;
}
