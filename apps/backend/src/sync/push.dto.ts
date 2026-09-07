import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator'

// Collections a client may push. Must stay in step with the tables the
// frontend keeps in Dexie (apps/frontend/src/db.ts) and with the delegate
// map in ReplicationService.
export const COLLECTIONS = [
  'deposits',
  'contacts',
  'articles',
  'sales',
  'refunds',
  'predeposits',
  'predepositArticles',
  'cashRegisterControls',
] as const
export type Collection = (typeof COLLECTIONS)[number]

export const OPERATIONS = ['create', 'update', 'delete'] as const
export type Operation = (typeof OPERATIONS)[number]

// Envelope of one outbox operation. A body that fails here is refused with
// 400 INVALID_PAYLOAD and the client will not retry it.
export class PushDto {
  @IsString()
  @IsNotEmpty()
  operationId!: string

  @IsIn(COLLECTIONS)
  collection!: Collection

  @IsIn(OPERATIONS)
  operation!: Operation

  @IsString()
  @IsNotEmpty()
  recordId!: string

  @IsObject()
  data!: Record<string, unknown>

  @IsOptional()
  @IsNumber()
  timestamp?: number
}
