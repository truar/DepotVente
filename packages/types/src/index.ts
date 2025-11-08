// Shared types for frontend and backend
// Based on Prisma schema but framework-agnostic

// Export generated Zod schemas (auto-generated from Prisma schema)
export * from './generated'

// User types
export interface User {
  id: string
  lastName: string
  firstName: string
  email?: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

export type CreateUserInput = Pick<User, 'firstName' | 'lastName'> & {
  email?: string
}

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
  totalAmount: number
  createdAt: Date
  deletedAt?: Date | null
}

export type CreateSaleInput = Pick<Sale, 'workstationId' | 'totalAmount'> & {
  userId?: string
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
  id: string
  eventId: string
  name: string
  price: number
  barcode?: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

export type CreateArticleInput = Pick<Article, 'eventId' | 'name' | 'price'> & {
  barcode?: string
}

export type UpdateArticleInput = Partial<Omit<CreateArticleInput, 'eventId'>>

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
}
