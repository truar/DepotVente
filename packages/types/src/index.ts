// Shared types for frontend and backend
// Based on Prisma schema but framework-agnostic

// Export generated Zod schemas (auto-generated from Prisma schema)
export * from './generated'

// Re-import generated types for composition
import type {
  Sale as GeneratedSale,
  Article as GeneratedArticle,
  Workstation as GeneratedWorkstation,
  Deposit as GeneratedDeposit
} from './generated'

// Types with relations (for API responses with nested data)
export type SaleWithRelations = GeneratedSale & {
  articles: GeneratedArticle[];
  workstation: GeneratedWorkstation;
}

export type DepositWithRelations = GeneratedDeposit & {
  articles: GeneratedArticle[];
  workstation: GeneratedWorkstation;
  user: User;
}

// User types
export interface User {
  id: string
  email: string
  password: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

export type CreateUserInput = Pick<User, 'email' | 'password'>

export type UpdateUserInput = Partial<CreateUserInput>

// Event types
export interface Event {
  id: string
  name: string
  year: number
  description?: string | null
  startDate?: Date | null
  endDate?: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

export type CreateEventInput = Pick<Event, 'name' | 'year'> & {
  description?: string
  startDate?: Date
  endDate?: Date
}

export type UpdateEventInput = Partial<CreateEventInput>

// Checkout types
export interface Checkout {
  id: string
  eventId: string
  name: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

export type CreateCheckoutInput = Pick<Checkout, 'eventId' | 'name'>

export type UpdateCheckoutInput = Partial<Omit<CreateCheckoutInput, 'eventId'>>

// Workstation types
export interface Workstation {
  id: string
  checkoutId: string
  name: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

export type CreateWorkstationInput = Pick<Workstation, 'checkoutId' | 'name'>

export type UpdateWorkstationInput = Partial<Omit<CreateWorkstationInput, 'checkoutId'>>

// Deposit types
export interface Deposit {
  id: string
  userId: string
  workstationId: string
  amount: number
  createdAt: Date
  deletedAt?: Date | null
}

export type CreateDepositInput = Pick<Deposit, 'userId' | 'workstationId' | 'amount'>

// Sale types
export interface Sale {
  id: string
  userId?: string | null
  workstationId: string
  cashAmount?: number | null
  cardAmount?: number | null
  checkAmount?: number | null
  totalAmount: number
  createdAt: Date
  deletedAt?: Date | null
}

export type UpdateSaleInput = {
  cashAmount?: number | null
  cardAmount?: number | null
  checkAmount?: number | null
}

// CashTransaction types
export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
}

export interface CashTransaction {
  id: string
  userId: string
  workstationId: string
  type: TransactionType
  amount: number
  createdAt: Date
  deletedAt?: Date | null
}

export type CreateCashTransactionInput = Pick<
  CashTransaction,
  'userId' | 'workstationId' | 'type' | 'amount'
>

// Article types
export interface Article {
  id: string;
  price: number;
  discipline: string | null;
  categorie: string | null;
  code?: string | null;
  description?: string | null;
  color?: string | null;
  size?: string | null;
  depositId?: string | null;
  deposit?: Deposit | null;
  saleId?: string | null;
  sale?: Sale | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type CreateArticleInput = Pick<Article, 'price'> & {
  discipline?: string | null;
  categorie?: string | null;
  brand?: string | null;
  description?: string | null;
  color?: string | null;
  size?: string | null;
  code?: string | null;
  depositId?: string | null;
}

export type UpdateArticleInput = Partial<CreateArticleInput>

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
