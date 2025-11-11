import { z } from 'zod';
import { Prisma } from '../../../database/generated/client';
import Decimal from 'decimal.js';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// DECIMAL
//------------------------------------------------------

export const DecimalJsLikeSchema: z.ZodType<Prisma.DecimalJsLike> = z.object({
  d: z.array(z.number()),
  e: z.number(),
  s: z.number(),
  toFixed: z.any(),
})

export const DECIMAL_STRING_REGEX = /^(?:-?Infinity|NaN|-?(?:0[bB][01]+(?:\.[01]+)?(?:[pP][-+]?\d+)?|0[oO][0-7]+(?:\.[0-7]+)?(?:[pP][-+]?\d+)?|0[xX][\da-fA-F]+(?:\.[\da-fA-F]+)?(?:[pP][-+]?\d+)?|(?:\d+|\d*\.\d+)(?:[eE][-+]?\d+)?))$/;

export const isValidDecimalInput =
  (v?: null | string | number | Prisma.DecimalJsLike): v is string | number | Prisma.DecimalJsLike => {
    if (v === undefined || v === null) return false;
    return (
      (typeof v === 'object' && 'd' in v && 'e' in v && 's' in v && 'toFixed' in v) ||
      (typeof v === 'string' && DECIMAL_STRING_REGEX.test(v)) ||
      typeof v === 'number'
    )
  };

/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const EventScalarFieldEnumSchema = z.enum(['id','name','year','description','startDate','endDate','isActive','createdAt','updatedAt','deletedAt']);

export const CheckoutScalarFieldEnumSchema = z.enum(['id','name','initialCash','currentCash','eventId','createdAt','updatedAt','deletedAt']);

export const WorkstationScalarFieldEnumSchema = z.enum(['id','eventId','name','increment_start','createdAt','updatedAt','deletedAt']);

export const UserScalarFieldEnumSchema = z.enum(['id','lastName','firstName','phoneNumber','password','email','city','postalCode','createdAt','updatedAt','deletedAt']);

export const DepositScalarFieldEnumSchema = z.enum(['id','eventId','userId','workstationId','contributionStatus','status','createdAt','updatedAt','deletedAt']);

export const SaleScalarFieldEnumSchema = z.enum(['id','eventId','userId','workstationId','checkoutId','cardAmount','cashAmount','checkAmount','totalAmount','postalCode','saleAt','createdAt','updatedAt','deletedAt']);

export const CashTransactionScalarFieldEnumSchema = z.enum(['id','saleId','cashReceived','cashGiven','createdAt','updatedAt','deletedAt']);

export const ArticleScalarFieldEnumSchema = z.enum(['id','discipline','categorie','brand','description','color','size','price','code','depositId','saleId','createdAt','updatedAt','deletedAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const ContributionStatusSchema = z.enum(['PAYER','A_PAYER','GRATUIT']);

export type ContributionStatusType = `${z.infer<typeof ContributionStatusSchema>}`

export const DepotStatusSchema = z.enum(['PRE_DEPOT','VALIDE','EN_ATTENTE']);

export type DepotStatusType = `${z.infer<typeof DepotStatusSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// EVENT SCHEMA
/////////////////////////////////////////

export const EventSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  year: z.number().int(),
  description: z.string().nullable(),
  startDate: z.coerce.date().nullable(),
  endDate: z.coerce.date().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

export type Event = z.infer<typeof EventSchema>

/////////////////////////////////////////
// CHECKOUT SCHEMA
/////////////////////////////////////////

export const CheckoutSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  initialCash: z.instanceof(Prisma.Decimal, { message: "Field 'initialCash' must be a Decimal. Location: ['Models', 'Checkout']"}),
  currentCash: z.instanceof(Prisma.Decimal, { message: "Field 'currentCash' must be a Decimal. Location: ['Models', 'Checkout']"}),
  eventId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

export type Checkout = z.infer<typeof CheckoutSchema>

/////////////////////////////////////////
// WORKSTATION SCHEMA
/////////////////////////////////////////

export const WorkstationSchema = z.object({
  id: z.uuid(),
  eventId: z.string(),
  name: z.string(),
  increment_start: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

export type Workstation = z.infer<typeof WorkstationSchema>

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.uuid(),
  lastName: z.string(),
  firstName: z.string(),
  phoneNumber: z.string().nullable(),
  password: z.string().nullable(),
  email: z.string().nullable(),
  city: z.string().nullable(),
  postalCode: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// DEPOSIT SCHEMA
/////////////////////////////////////////

export const DepositSchema = z.object({
  contributionStatus: ContributionStatusSchema,
  status: DepotStatusSchema,
  id: z.uuid(),
  eventId: z.string(),
  userId: z.string(),
  workstationId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

export type Deposit = z.infer<typeof DepositSchema>

/////////////////////////////////////////
// SALE SCHEMA
/////////////////////////////////////////

export const SaleSchema = z.object({
  id: z.uuid(),
  eventId: z.string(),
  userId: z.string(),
  workstationId: z.string(),
  checkoutId: z.string(),
  cardAmount: z.instanceof(Prisma.Decimal, { message: "Field 'cardAmount' must be a Decimal. Location: ['Models', 'Sale']"}),
  cashAmount: z.instanceof(Prisma.Decimal, { message: "Field 'cashAmount' must be a Decimal. Location: ['Models', 'Sale']"}),
  checkAmount: z.instanceof(Prisma.Decimal, { message: "Field 'checkAmount' must be a Decimal. Location: ['Models', 'Sale']"}),
  totalAmount: z.instanceof(Prisma.Decimal, { message: "Field 'totalAmount' must be a Decimal. Location: ['Models', 'Sale']"}),
  postalCode: z.string().nullable(),
  saleAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

export type Sale = z.infer<typeof SaleSchema>

/////////////////////////////////////////
// CASH TRANSACTION SCHEMA
/////////////////////////////////////////

export const CashTransactionSchema = z.object({
  id: z.uuid(),
  saleId: z.string(),
  cashReceived: z.instanceof(Prisma.Decimal, { message: "Field 'cashReceived' must be a Decimal. Location: ['Models', 'CashTransaction']"}),
  cashGiven: z.instanceof(Prisma.Decimal, { message: "Field 'cashGiven' must be a Decimal. Location: ['Models', 'CashTransaction']"}),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

export type CashTransaction = z.infer<typeof CashTransactionSchema>

/////////////////////////////////////////
// ARTICLE SCHEMA
/////////////////////////////////////////

export const ArticleSchema = z.object({
  id: z.uuid(),
  discipline: z.string().nullable(),
  categorie: z.string().nullable(),
  brand: z.string().nullable(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  size: z.string().nullable(),
  price: z.instanceof(Prisma.Decimal, { message: "Field 'price' must be a Decimal. Location: ['Models', 'Article']"}).nullable(),
  code: z.string().nullable(),
  depositId: z.string().nullable(),
  saleId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

export type Article = z.infer<typeof ArticleSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// EVENT
//------------------------------------------------------

export const EventIncludeSchema: z.ZodType<Prisma.EventInclude> = z.object({
  sales: z.union([z.boolean(),z.lazy(() => SaleFindManyArgsSchema)]).optional(),
  deposits: z.union([z.boolean(),z.lazy(() => DepositFindManyArgsSchema)]).optional(),
  workstations: z.union([z.boolean(),z.lazy(() => WorkstationFindManyArgsSchema)]).optional(),
  checkouts: z.union([z.boolean(),z.lazy(() => CheckoutFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => EventCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const EventArgsSchema: z.ZodType<Prisma.EventDefaultArgs> = z.object({
  select: z.lazy(() => EventSelectSchema).optional(),
  include: z.lazy(() => EventIncludeSchema).optional(),
}).strict();

export const EventCountOutputTypeArgsSchema: z.ZodType<Prisma.EventCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => EventCountOutputTypeSelectSchema).nullish(),
}).strict();

export const EventCountOutputTypeSelectSchema: z.ZodType<Prisma.EventCountOutputTypeSelect> = z.object({
  sales: z.boolean().optional(),
  deposits: z.boolean().optional(),
  workstations: z.boolean().optional(),
  checkouts: z.boolean().optional(),
}).strict();

export const EventSelectSchema: z.ZodType<Prisma.EventSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  year: z.boolean().optional(),
  description: z.boolean().optional(),
  startDate: z.boolean().optional(),
  endDate: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  sales: z.union([z.boolean(),z.lazy(() => SaleFindManyArgsSchema)]).optional(),
  deposits: z.union([z.boolean(),z.lazy(() => DepositFindManyArgsSchema)]).optional(),
  workstations: z.union([z.boolean(),z.lazy(() => WorkstationFindManyArgsSchema)]).optional(),
  checkouts: z.union([z.boolean(),z.lazy(() => CheckoutFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => EventCountOutputTypeArgsSchema)]).optional(),
}).strict()

// CHECKOUT
//------------------------------------------------------

export const CheckoutIncludeSchema: z.ZodType<Prisma.CheckoutInclude> = z.object({
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  sales: z.union([z.boolean(),z.lazy(() => SaleFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => CheckoutCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const CheckoutArgsSchema: z.ZodType<Prisma.CheckoutDefaultArgs> = z.object({
  select: z.lazy(() => CheckoutSelectSchema).optional(),
  include: z.lazy(() => CheckoutIncludeSchema).optional(),
}).strict();

export const CheckoutCountOutputTypeArgsSchema: z.ZodType<Prisma.CheckoutCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => CheckoutCountOutputTypeSelectSchema).nullish(),
}).strict();

export const CheckoutCountOutputTypeSelectSchema: z.ZodType<Prisma.CheckoutCountOutputTypeSelect> = z.object({
  sales: z.boolean().optional(),
}).strict();

export const CheckoutSelectSchema: z.ZodType<Prisma.CheckoutSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  initialCash: z.boolean().optional(),
  currentCash: z.boolean().optional(),
  eventId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  sales: z.union([z.boolean(),z.lazy(() => SaleFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => CheckoutCountOutputTypeArgsSchema)]).optional(),
}).strict()

// WORKSTATION
//------------------------------------------------------

export const WorkstationIncludeSchema: z.ZodType<Prisma.WorkstationInclude> = z.object({
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  sales: z.union([z.boolean(),z.lazy(() => SaleFindManyArgsSchema)]).optional(),
  deposits: z.union([z.boolean(),z.lazy(() => DepositFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => WorkstationCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const WorkstationArgsSchema: z.ZodType<Prisma.WorkstationDefaultArgs> = z.object({
  select: z.lazy(() => WorkstationSelectSchema).optional(),
  include: z.lazy(() => WorkstationIncludeSchema).optional(),
}).strict();

export const WorkstationCountOutputTypeArgsSchema: z.ZodType<Prisma.WorkstationCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => WorkstationCountOutputTypeSelectSchema).nullish(),
}).strict();

export const WorkstationCountOutputTypeSelectSchema: z.ZodType<Prisma.WorkstationCountOutputTypeSelect> = z.object({
  sales: z.boolean().optional(),
  deposits: z.boolean().optional(),
}).strict();

export const WorkstationSelectSchema: z.ZodType<Prisma.WorkstationSelect> = z.object({
  id: z.boolean().optional(),
  eventId: z.boolean().optional(),
  name: z.boolean().optional(),
  increment_start: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  sales: z.union([z.boolean(),z.lazy(() => SaleFindManyArgsSchema)]).optional(),
  deposits: z.union([z.boolean(),z.lazy(() => DepositFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => WorkstationCountOutputTypeArgsSchema)]).optional(),
}).strict()

// USER
//------------------------------------------------------

export const UserIncludeSchema: z.ZodType<Prisma.UserInclude> = z.object({
  sales: z.union([z.boolean(),z.lazy(() => SaleFindManyArgsSchema)]).optional(),
  depots: z.union([z.boolean(),z.lazy(() => DepositFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const UserArgsSchema: z.ZodType<Prisma.UserDefaultArgs> = z.object({
  select: z.lazy(() => UserSelectSchema).optional(),
  include: z.lazy(() => UserIncludeSchema).optional(),
}).strict();

export const UserCountOutputTypeArgsSchema: z.ZodType<Prisma.UserCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => UserCountOutputTypeSelectSchema).nullish(),
}).strict();

export const UserCountOutputTypeSelectSchema: z.ZodType<Prisma.UserCountOutputTypeSelect> = z.object({
  sales: z.boolean().optional(),
  depots: z.boolean().optional(),
}).strict();

export const UserSelectSchema: z.ZodType<Prisma.UserSelect> = z.object({
  id: z.boolean().optional(),
  lastName: z.boolean().optional(),
  firstName: z.boolean().optional(),
  phoneNumber: z.boolean().optional(),
  password: z.boolean().optional(),
  email: z.boolean().optional(),
  city: z.boolean().optional(),
  postalCode: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  sales: z.union([z.boolean(),z.lazy(() => SaleFindManyArgsSchema)]).optional(),
  depots: z.union([z.boolean(),z.lazy(() => DepositFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

// DEPOSIT
//------------------------------------------------------

export const DepositIncludeSchema: z.ZodType<Prisma.DepositInclude> = z.object({
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  workstation: z.union([z.boolean(),z.lazy(() => WorkstationArgsSchema)]).optional(),
  articles: z.union([z.boolean(),z.lazy(() => ArticleFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => DepositCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const DepositArgsSchema: z.ZodType<Prisma.DepositDefaultArgs> = z.object({
  select: z.lazy(() => DepositSelectSchema).optional(),
  include: z.lazy(() => DepositIncludeSchema).optional(),
}).strict();

export const DepositCountOutputTypeArgsSchema: z.ZodType<Prisma.DepositCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => DepositCountOutputTypeSelectSchema).nullish(),
}).strict();

export const DepositCountOutputTypeSelectSchema: z.ZodType<Prisma.DepositCountOutputTypeSelect> = z.object({
  articles: z.boolean().optional(),
}).strict();

export const DepositSelectSchema: z.ZodType<Prisma.DepositSelect> = z.object({
  id: z.boolean().optional(),
  eventId: z.boolean().optional(),
  userId: z.boolean().optional(),
  workstationId: z.boolean().optional(),
  contributionStatus: z.boolean().optional(),
  status: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  workstation: z.union([z.boolean(),z.lazy(() => WorkstationArgsSchema)]).optional(),
  articles: z.union([z.boolean(),z.lazy(() => ArticleFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => DepositCountOutputTypeArgsSchema)]).optional(),
}).strict()

// SALE
//------------------------------------------------------

export const SaleIncludeSchema: z.ZodType<Prisma.SaleInclude> = z.object({
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  workstation: z.union([z.boolean(),z.lazy(() => WorkstationArgsSchema)]).optional(),
  checkout: z.union([z.boolean(),z.lazy(() => CheckoutArgsSchema)]).optional(),
  articles: z.union([z.boolean(),z.lazy(() => ArticleFindManyArgsSchema)]).optional(),
  cashTransactions: z.union([z.boolean(),z.lazy(() => CashTransactionFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => SaleCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const SaleArgsSchema: z.ZodType<Prisma.SaleDefaultArgs> = z.object({
  select: z.lazy(() => SaleSelectSchema).optional(),
  include: z.lazy(() => SaleIncludeSchema).optional(),
}).strict();

export const SaleCountOutputTypeArgsSchema: z.ZodType<Prisma.SaleCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => SaleCountOutputTypeSelectSchema).nullish(),
}).strict();

export const SaleCountOutputTypeSelectSchema: z.ZodType<Prisma.SaleCountOutputTypeSelect> = z.object({
  articles: z.boolean().optional(),
  cashTransactions: z.boolean().optional(),
}).strict();

export const SaleSelectSchema: z.ZodType<Prisma.SaleSelect> = z.object({
  id: z.boolean().optional(),
  eventId: z.boolean().optional(),
  userId: z.boolean().optional(),
  workstationId: z.boolean().optional(),
  checkoutId: z.boolean().optional(),
  cardAmount: z.boolean().optional(),
  cashAmount: z.boolean().optional(),
  checkAmount: z.boolean().optional(),
  totalAmount: z.boolean().optional(),
  postalCode: z.boolean().optional(),
  saleAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  workstation: z.union([z.boolean(),z.lazy(() => WorkstationArgsSchema)]).optional(),
  checkout: z.union([z.boolean(),z.lazy(() => CheckoutArgsSchema)]).optional(),
  articles: z.union([z.boolean(),z.lazy(() => ArticleFindManyArgsSchema)]).optional(),
  cashTransactions: z.union([z.boolean(),z.lazy(() => CashTransactionFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => SaleCountOutputTypeArgsSchema)]).optional(),
}).strict()

// CASH TRANSACTION
//------------------------------------------------------

export const CashTransactionIncludeSchema: z.ZodType<Prisma.CashTransactionInclude> = z.object({
  sale: z.union([z.boolean(),z.lazy(() => SaleArgsSchema)]).optional(),
}).strict();

export const CashTransactionArgsSchema: z.ZodType<Prisma.CashTransactionDefaultArgs> = z.object({
  select: z.lazy(() => CashTransactionSelectSchema).optional(),
  include: z.lazy(() => CashTransactionIncludeSchema).optional(),
}).strict();

export const CashTransactionSelectSchema: z.ZodType<Prisma.CashTransactionSelect> = z.object({
  id: z.boolean().optional(),
  saleId: z.boolean().optional(),
  cashReceived: z.boolean().optional(),
  cashGiven: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  sale: z.union([z.boolean(),z.lazy(() => SaleArgsSchema)]).optional(),
}).strict()

// ARTICLE
//------------------------------------------------------

export const ArticleIncludeSchema: z.ZodType<Prisma.ArticleInclude> = z.object({
  deposit: z.union([z.boolean(),z.lazy(() => DepositArgsSchema)]).optional(),
  sale: z.union([z.boolean(),z.lazy(() => SaleArgsSchema)]).optional(),
}).strict();

export const ArticleArgsSchema: z.ZodType<Prisma.ArticleDefaultArgs> = z.object({
  select: z.lazy(() => ArticleSelectSchema).optional(),
  include: z.lazy(() => ArticleIncludeSchema).optional(),
}).strict();

export const ArticleSelectSchema: z.ZodType<Prisma.ArticleSelect> = z.object({
  id: z.boolean().optional(),
  discipline: z.boolean().optional(),
  categorie: z.boolean().optional(),
  brand: z.boolean().optional(),
  description: z.boolean().optional(),
  color: z.boolean().optional(),
  size: z.boolean().optional(),
  price: z.boolean().optional(),
  code: z.boolean().optional(),
  depositId: z.boolean().optional(),
  saleId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  deposit: z.union([z.boolean(),z.lazy(() => DepositArgsSchema)]).optional(),
  sale: z.union([z.boolean(),z.lazy(() => SaleArgsSchema)]).optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const EventWhereInputSchema: z.ZodType<Prisma.EventWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => EventWhereInputSchema), z.lazy(() => EventWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => EventWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EventWhereInputSchema), z.lazy(() => EventWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  year: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  startDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  endDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  sales: z.lazy(() => SaleListRelationFilterSchema).optional(),
  deposits: z.lazy(() => DepositListRelationFilterSchema).optional(),
  workstations: z.lazy(() => WorkstationListRelationFilterSchema).optional(),
  checkouts: z.lazy(() => CheckoutListRelationFilterSchema).optional(),
});

export const EventOrderByWithRelationInputSchema: z.ZodType<Prisma.EventOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  startDate: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  endDate: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  sales: z.lazy(() => SaleOrderByRelationAggregateInputSchema).optional(),
  deposits: z.lazy(() => DepositOrderByRelationAggregateInputSchema).optional(),
  workstations: z.lazy(() => WorkstationOrderByRelationAggregateInputSchema).optional(),
  checkouts: z.lazy(() => CheckoutOrderByRelationAggregateInputSchema).optional(),
});

export const EventWhereUniqueInputSchema: z.ZodType<Prisma.EventWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => EventWhereInputSchema), z.lazy(() => EventWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => EventWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EventWhereInputSchema), z.lazy(() => EventWhereInputSchema).array() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  year: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  startDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  endDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  sales: z.lazy(() => SaleListRelationFilterSchema).optional(),
  deposits: z.lazy(() => DepositListRelationFilterSchema).optional(),
  workstations: z.lazy(() => WorkstationListRelationFilterSchema).optional(),
  checkouts: z.lazy(() => CheckoutListRelationFilterSchema).optional(),
}));

export const EventOrderByWithAggregationInputSchema: z.ZodType<Prisma.EventOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  startDate: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  endDate: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => EventCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => EventAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => EventMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => EventMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => EventSumOrderByAggregateInputSchema).optional(),
});

export const EventScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.EventScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => EventScalarWhereWithAggregatesInputSchema), z.lazy(() => EventScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => EventScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EventScalarWhereWithAggregatesInputSchema), z.lazy(() => EventScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  year: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  startDate: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  endDate: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  isActive: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const CheckoutWhereInputSchema: z.ZodType<Prisma.CheckoutWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => CheckoutWhereInputSchema), z.lazy(() => CheckoutWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CheckoutWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CheckoutWhereInputSchema), z.lazy(() => CheckoutWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  initialCash: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  currentCash: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  eventId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  sales: z.lazy(() => SaleListRelationFilterSchema).optional(),
});

export const CheckoutOrderByWithRelationInputSchema: z.ZodType<Prisma.CheckoutOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  initialCash: z.lazy(() => SortOrderSchema).optional(),
  currentCash: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
  sales: z.lazy(() => SaleOrderByRelationAggregateInputSchema).optional(),
});

export const CheckoutWhereUniqueInputSchema: z.ZodType<Prisma.CheckoutWhereUniqueInput> = z.union([
  z.object({
    id: z.uuid(),
    eventId_name: z.lazy(() => CheckoutEventIdNameCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.uuid(),
  }),
  z.object({
    eventId_name: z.lazy(() => CheckoutEventIdNameCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.uuid().optional(),
  eventId_name: z.lazy(() => CheckoutEventIdNameCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => CheckoutWhereInputSchema), z.lazy(() => CheckoutWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CheckoutWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CheckoutWhereInputSchema), z.lazy(() => CheckoutWhereInputSchema).array() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  initialCash: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  currentCash: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  eventId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  sales: z.lazy(() => SaleListRelationFilterSchema).optional(),
}));

export const CheckoutOrderByWithAggregationInputSchema: z.ZodType<Prisma.CheckoutOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  initialCash: z.lazy(() => SortOrderSchema).optional(),
  currentCash: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => CheckoutCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => CheckoutAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => CheckoutMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => CheckoutMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => CheckoutSumOrderByAggregateInputSchema).optional(),
});

export const CheckoutScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.CheckoutScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => CheckoutScalarWhereWithAggregatesInputSchema), z.lazy(() => CheckoutScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => CheckoutScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CheckoutScalarWhereWithAggregatesInputSchema), z.lazy(() => CheckoutScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  initialCash: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  currentCash: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  eventId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const WorkstationWhereInputSchema: z.ZodType<Prisma.WorkstationWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => WorkstationWhereInputSchema), z.lazy(() => WorkstationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => WorkstationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WorkstationWhereInputSchema), z.lazy(() => WorkstationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  increment_start: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  sales: z.lazy(() => SaleListRelationFilterSchema).optional(),
  deposits: z.lazy(() => DepositListRelationFilterSchema).optional(),
});

export const WorkstationOrderByWithRelationInputSchema: z.ZodType<Prisma.WorkstationOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  increment_start: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
  sales: z.lazy(() => SaleOrderByRelationAggregateInputSchema).optional(),
  deposits: z.lazy(() => DepositOrderByRelationAggregateInputSchema).optional(),
});

export const WorkstationWhereUniqueInputSchema: z.ZodType<Prisma.WorkstationWhereUniqueInput> = z.union([
  z.object({
    id: z.uuid(),
    eventId_name: z.lazy(() => WorkstationEventIdNameCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.uuid(),
  }),
  z.object({
    eventId_name: z.lazy(() => WorkstationEventIdNameCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.uuid().optional(),
  eventId_name: z.lazy(() => WorkstationEventIdNameCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => WorkstationWhereInputSchema), z.lazy(() => WorkstationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => WorkstationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WorkstationWhereInputSchema), z.lazy(() => WorkstationWhereInputSchema).array() ]).optional(),
  eventId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  increment_start: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  sales: z.lazy(() => SaleListRelationFilterSchema).optional(),
  deposits: z.lazy(() => DepositListRelationFilterSchema).optional(),
}));

export const WorkstationOrderByWithAggregationInputSchema: z.ZodType<Prisma.WorkstationOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  increment_start: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => WorkstationCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => WorkstationAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => WorkstationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => WorkstationMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => WorkstationSumOrderByAggregateInputSchema).optional(),
});

export const WorkstationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.WorkstationScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => WorkstationScalarWhereWithAggregatesInputSchema), z.lazy(() => WorkstationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => WorkstationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WorkstationScalarWhereWithAggregatesInputSchema), z.lazy(() => WorkstationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  increment_start: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const UserWhereInputSchema: z.ZodType<Prisma.UserWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  lastName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  firstName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  phoneNumber: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  email: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  city: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  postalCode: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  sales: z.lazy(() => SaleListRelationFilterSchema).optional(),
  depots: z.lazy(() => DepositListRelationFilterSchema).optional(),
});

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  password: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  email: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  city: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  postalCode: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  sales: z.lazy(() => SaleOrderByRelationAggregateInputSchema).optional(),
  depots: z.lazy(() => DepositOrderByRelationAggregateInputSchema).optional(),
});

export const UserWhereUniqueInputSchema: z.ZodType<Prisma.UserWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  lastName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  firstName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  phoneNumber: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  email: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  city: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  postalCode: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  sales: z.lazy(() => SaleListRelationFilterSchema).optional(),
  depots: z.lazy(() => DepositListRelationFilterSchema).optional(),
}));

export const UserOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  password: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  email: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  city: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  postalCode: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => UserCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserMinOrderByAggregateInputSchema).optional(),
});

export const UserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema), z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema), z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  lastName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  firstName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  phoneNumber: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  email: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  city: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  postalCode: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const DepositWhereInputSchema: z.ZodType<Prisma.DepositWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => DepositWhereInputSchema), z.lazy(() => DepositWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => DepositWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DepositWhereInputSchema), z.lazy(() => DepositWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  workstationId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  contributionStatus: z.union([ z.lazy(() => EnumContributionStatusFilterSchema), z.lazy(() => ContributionStatusSchema) ]).optional(),
  status: z.union([ z.lazy(() => EnumDepotStatusFilterSchema), z.lazy(() => DepotStatusSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  workstation: z.union([ z.lazy(() => WorkstationScalarRelationFilterSchema), z.lazy(() => WorkstationWhereInputSchema) ]).optional(),
  articles: z.lazy(() => ArticleListRelationFilterSchema).optional(),
});

export const DepositOrderByWithRelationInputSchema: z.ZodType<Prisma.DepositOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  workstationId: z.lazy(() => SortOrderSchema).optional(),
  contributionStatus: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  workstation: z.lazy(() => WorkstationOrderByWithRelationInputSchema).optional(),
  articles: z.lazy(() => ArticleOrderByRelationAggregateInputSchema).optional(),
});

export const DepositWhereUniqueInputSchema: z.ZodType<Prisma.DepositWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => DepositWhereInputSchema), z.lazy(() => DepositWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => DepositWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DepositWhereInputSchema), z.lazy(() => DepositWhereInputSchema).array() ]).optional(),
  eventId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  workstationId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  contributionStatus: z.union([ z.lazy(() => EnumContributionStatusFilterSchema), z.lazy(() => ContributionStatusSchema) ]).optional(),
  status: z.union([ z.lazy(() => EnumDepotStatusFilterSchema), z.lazy(() => DepotStatusSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  workstation: z.union([ z.lazy(() => WorkstationScalarRelationFilterSchema), z.lazy(() => WorkstationWhereInputSchema) ]).optional(),
  articles: z.lazy(() => ArticleListRelationFilterSchema).optional(),
}));

export const DepositOrderByWithAggregationInputSchema: z.ZodType<Prisma.DepositOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  workstationId: z.lazy(() => SortOrderSchema).optional(),
  contributionStatus: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => DepositCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => DepositMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => DepositMinOrderByAggregateInputSchema).optional(),
});

export const DepositScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.DepositScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => DepositScalarWhereWithAggregatesInputSchema), z.lazy(() => DepositScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => DepositScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DepositScalarWhereWithAggregatesInputSchema), z.lazy(() => DepositScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  workstationId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  contributionStatus: z.union([ z.lazy(() => EnumContributionStatusWithAggregatesFilterSchema), z.lazy(() => ContributionStatusSchema) ]).optional(),
  status: z.union([ z.lazy(() => EnumDepotStatusWithAggregatesFilterSchema), z.lazy(() => DepotStatusSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const SaleWhereInputSchema: z.ZodType<Prisma.SaleWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SaleWhereInputSchema), z.lazy(() => SaleWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SaleWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SaleWhereInputSchema), z.lazy(() => SaleWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  workstationId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  checkoutId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  cardAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  cashAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  checkAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  totalAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  postalCode: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  saleAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  workstation: z.union([ z.lazy(() => WorkstationScalarRelationFilterSchema), z.lazy(() => WorkstationWhereInputSchema) ]).optional(),
  checkout: z.union([ z.lazy(() => CheckoutScalarRelationFilterSchema), z.lazy(() => CheckoutWhereInputSchema) ]).optional(),
  articles: z.lazy(() => ArticleListRelationFilterSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionListRelationFilterSchema).optional(),
});

export const SaleOrderByWithRelationInputSchema: z.ZodType<Prisma.SaleOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  workstationId: z.lazy(() => SortOrderSchema).optional(),
  checkoutId: z.lazy(() => SortOrderSchema).optional(),
  cardAmount: z.lazy(() => SortOrderSchema).optional(),
  cashAmount: z.lazy(() => SortOrderSchema).optional(),
  checkAmount: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
  postalCode: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  saleAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  workstation: z.lazy(() => WorkstationOrderByWithRelationInputSchema).optional(),
  checkout: z.lazy(() => CheckoutOrderByWithRelationInputSchema).optional(),
  articles: z.lazy(() => ArticleOrderByRelationAggregateInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionOrderByRelationAggregateInputSchema).optional(),
});

export const SaleWhereUniqueInputSchema: z.ZodType<Prisma.SaleWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => SaleWhereInputSchema), z.lazy(() => SaleWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SaleWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SaleWhereInputSchema), z.lazy(() => SaleWhereInputSchema).array() ]).optional(),
  eventId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  workstationId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  checkoutId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  cardAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  cashAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  checkAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  totalAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  postalCode: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  saleAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  workstation: z.union([ z.lazy(() => WorkstationScalarRelationFilterSchema), z.lazy(() => WorkstationWhereInputSchema) ]).optional(),
  checkout: z.union([ z.lazy(() => CheckoutScalarRelationFilterSchema), z.lazy(() => CheckoutWhereInputSchema) ]).optional(),
  articles: z.lazy(() => ArticleListRelationFilterSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionListRelationFilterSchema).optional(),
}));

export const SaleOrderByWithAggregationInputSchema: z.ZodType<Prisma.SaleOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  workstationId: z.lazy(() => SortOrderSchema).optional(),
  checkoutId: z.lazy(() => SortOrderSchema).optional(),
  cardAmount: z.lazy(() => SortOrderSchema).optional(),
  cashAmount: z.lazy(() => SortOrderSchema).optional(),
  checkAmount: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
  postalCode: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  saleAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => SaleCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => SaleAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => SaleMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => SaleMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => SaleSumOrderByAggregateInputSchema).optional(),
});

export const SaleScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.SaleScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SaleScalarWhereWithAggregatesInputSchema), z.lazy(() => SaleScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => SaleScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SaleScalarWhereWithAggregatesInputSchema), z.lazy(() => SaleScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  workstationId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  checkoutId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  cardAmount: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  cashAmount: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  checkAmount: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  totalAmount: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  postalCode: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  saleAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const CashTransactionWhereInputSchema: z.ZodType<Prisma.CashTransactionWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => CashTransactionWhereInputSchema), z.lazy(() => CashTransactionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CashTransactionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CashTransactionWhereInputSchema), z.lazy(() => CashTransactionWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  saleId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  cashReceived: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  cashGiven: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  sale: z.union([ z.lazy(() => SaleScalarRelationFilterSchema), z.lazy(() => SaleWhereInputSchema) ]).optional(),
});

export const CashTransactionOrderByWithRelationInputSchema: z.ZodType<Prisma.CashTransactionOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  saleId: z.lazy(() => SortOrderSchema).optional(),
  cashReceived: z.lazy(() => SortOrderSchema).optional(),
  cashGiven: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  sale: z.lazy(() => SaleOrderByWithRelationInputSchema).optional(),
});

export const CashTransactionWhereUniqueInputSchema: z.ZodType<Prisma.CashTransactionWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => CashTransactionWhereInputSchema), z.lazy(() => CashTransactionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CashTransactionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CashTransactionWhereInputSchema), z.lazy(() => CashTransactionWhereInputSchema).array() ]).optional(),
  saleId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  cashReceived: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  cashGiven: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  sale: z.union([ z.lazy(() => SaleScalarRelationFilterSchema), z.lazy(() => SaleWhereInputSchema) ]).optional(),
}));

export const CashTransactionOrderByWithAggregationInputSchema: z.ZodType<Prisma.CashTransactionOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  saleId: z.lazy(() => SortOrderSchema).optional(),
  cashReceived: z.lazy(() => SortOrderSchema).optional(),
  cashGiven: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => CashTransactionCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => CashTransactionAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => CashTransactionMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => CashTransactionMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => CashTransactionSumOrderByAggregateInputSchema).optional(),
});

export const CashTransactionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.CashTransactionScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => CashTransactionScalarWhereWithAggregatesInputSchema), z.lazy(() => CashTransactionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => CashTransactionScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CashTransactionScalarWhereWithAggregatesInputSchema), z.lazy(() => CashTransactionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  saleId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  cashReceived: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  cashGiven: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const ArticleWhereInputSchema: z.ZodType<Prisma.ArticleWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ArticleWhereInputSchema), z.lazy(() => ArticleWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ArticleWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ArticleWhereInputSchema), z.lazy(() => ArticleWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  discipline: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  categorie: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  brand: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  color: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  size: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  price: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  code: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  depositId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  saleId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  deposit: z.union([ z.lazy(() => DepositNullableScalarRelationFilterSchema), z.lazy(() => DepositWhereInputSchema) ]).optional().nullable(),
  sale: z.union([ z.lazy(() => SaleNullableScalarRelationFilterSchema), z.lazy(() => SaleWhereInputSchema) ]).optional().nullable(),
});

export const ArticleOrderByWithRelationInputSchema: z.ZodType<Prisma.ArticleOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  discipline: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  categorie: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  brand: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  color: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  size: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  price: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  code: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  depositId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  saleId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  deposit: z.lazy(() => DepositOrderByWithRelationInputSchema).optional(),
  sale: z.lazy(() => SaleOrderByWithRelationInputSchema).optional(),
});

export const ArticleWhereUniqueInputSchema: z.ZodType<Prisma.ArticleWhereUniqueInput> = z.union([
  z.object({
    id: z.uuid(),
    code: z.string(),
  }),
  z.object({
    id: z.uuid(),
  }),
  z.object({
    code: z.string(),
  }),
])
.and(z.strictObject({
  id: z.uuid().optional(),
  code: z.string().optional(),
  AND: z.union([ z.lazy(() => ArticleWhereInputSchema), z.lazy(() => ArticleWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ArticleWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ArticleWhereInputSchema), z.lazy(() => ArticleWhereInputSchema).array() ]).optional(),
  discipline: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  categorie: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  brand: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  color: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  size: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  price: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  depositId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  saleId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  deposit: z.union([ z.lazy(() => DepositNullableScalarRelationFilterSchema), z.lazy(() => DepositWhereInputSchema) ]).optional().nullable(),
  sale: z.union([ z.lazy(() => SaleNullableScalarRelationFilterSchema), z.lazy(() => SaleWhereInputSchema) ]).optional().nullable(),
}));

export const ArticleOrderByWithAggregationInputSchema: z.ZodType<Prisma.ArticleOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  discipline: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  categorie: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  brand: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  color: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  size: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  price: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  code: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  depositId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  saleId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => ArticleCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => ArticleAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ArticleMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ArticleMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => ArticleSumOrderByAggregateInputSchema).optional(),
});

export const ArticleScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ArticleScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ArticleScalarWhereWithAggregatesInputSchema), z.lazy(() => ArticleScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ArticleScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ArticleScalarWhereWithAggregatesInputSchema), z.lazy(() => ArticleScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  discipline: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  categorie: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  brand: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  description: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  color: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  size: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  price: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  code: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  depositId: z.union([ z.lazy(() => UuidNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  saleId: z.union([ z.lazy(() => UuidNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const EventCreateInputSchema: z.ZodType<Prisma.EventCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  year: z.number().int(),
  description: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleCreateNestedManyWithoutEventInputSchema).optional(),
  deposits: z.lazy(() => DepositCreateNestedManyWithoutEventInputSchema).optional(),
  workstations: z.lazy(() => WorkstationCreateNestedManyWithoutEventInputSchema).optional(),
  checkouts: z.lazy(() => CheckoutCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUncheckedCreateInputSchema: z.ZodType<Prisma.EventUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  year: z.number().int(),
  description: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  deposits: z.lazy(() => DepositUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  workstations: z.lazy(() => WorkstationUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  checkouts: z.lazy(() => CheckoutUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUpdateInputSchema: z.ZodType<Prisma.EventUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUpdateManyWithoutEventNestedInputSchema).optional(),
  deposits: z.lazy(() => DepositUpdateManyWithoutEventNestedInputSchema).optional(),
  workstations: z.lazy(() => WorkstationUpdateManyWithoutEventNestedInputSchema).optional(),
  checkouts: z.lazy(() => CheckoutUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventUncheckedUpdateInputSchema: z.ZodType<Prisma.EventUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  deposits: z.lazy(() => DepositUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  workstations: z.lazy(() => WorkstationUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  checkouts: z.lazy(() => CheckoutUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventCreateManyInputSchema: z.ZodType<Prisma.EventCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  year: z.number().int(),
  description: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const EventUpdateManyMutationInputSchema: z.ZodType<Prisma.EventUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const EventUncheckedUpdateManyInputSchema: z.ZodType<Prisma.EventUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const CheckoutCreateInputSchema: z.ZodType<Prisma.CheckoutCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  initialCash: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  currentCash: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  event: z.lazy(() => EventCreateNestedOneWithoutCheckoutsInputSchema),
  sales: z.lazy(() => SaleCreateNestedManyWithoutCheckoutInputSchema).optional(),
});

export const CheckoutUncheckedCreateInputSchema: z.ZodType<Prisma.CheckoutUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  initialCash: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  currentCash: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  eventId: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleUncheckedCreateNestedManyWithoutCheckoutInputSchema).optional(),
});

export const CheckoutUpdateInputSchema: z.ZodType<Prisma.CheckoutUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  initialCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currentCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutCheckoutsNestedInputSchema).optional(),
  sales: z.lazy(() => SaleUpdateManyWithoutCheckoutNestedInputSchema).optional(),
});

export const CheckoutUncheckedUpdateInputSchema: z.ZodType<Prisma.CheckoutUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  initialCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currentCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUncheckedUpdateManyWithoutCheckoutNestedInputSchema).optional(),
});

export const CheckoutCreateManyInputSchema: z.ZodType<Prisma.CheckoutCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  initialCash: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  currentCash: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  eventId: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const CheckoutUpdateManyMutationInputSchema: z.ZodType<Prisma.CheckoutUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  initialCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currentCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const CheckoutUncheckedUpdateManyInputSchema: z.ZodType<Prisma.CheckoutUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  initialCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currentCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const WorkstationCreateInputSchema: z.ZodType<Prisma.WorkstationCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  increment_start: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  event: z.lazy(() => EventCreateNestedOneWithoutWorkstationsInputSchema),
  sales: z.lazy(() => SaleCreateNestedManyWithoutWorkstationInputSchema).optional(),
  deposits: z.lazy(() => DepositCreateNestedManyWithoutWorkstationInputSchema).optional(),
});

export const WorkstationUncheckedCreateInputSchema: z.ZodType<Prisma.WorkstationUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  name: z.string(),
  increment_start: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleUncheckedCreateNestedManyWithoutWorkstationInputSchema).optional(),
  deposits: z.lazy(() => DepositUncheckedCreateNestedManyWithoutWorkstationInputSchema).optional(),
});

export const WorkstationUpdateInputSchema: z.ZodType<Prisma.WorkstationUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  increment_start: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutWorkstationsNestedInputSchema).optional(),
  sales: z.lazy(() => SaleUpdateManyWithoutWorkstationNestedInputSchema).optional(),
  deposits: z.lazy(() => DepositUpdateManyWithoutWorkstationNestedInputSchema).optional(),
});

export const WorkstationUncheckedUpdateInputSchema: z.ZodType<Prisma.WorkstationUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  increment_start: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUncheckedUpdateManyWithoutWorkstationNestedInputSchema).optional(),
  deposits: z.lazy(() => DepositUncheckedUpdateManyWithoutWorkstationNestedInputSchema).optional(),
});

export const WorkstationCreateManyInputSchema: z.ZodType<Prisma.WorkstationCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  name: z.string(),
  increment_start: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const WorkstationUpdateManyMutationInputSchema: z.ZodType<Prisma.WorkstationUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  increment_start: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const WorkstationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.WorkstationUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  increment_start: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  lastName: z.string(),
  firstName: z.string(),
  phoneNumber: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleCreateNestedManyWithoutUserInputSchema).optional(),
  depots: z.lazy(() => DepositCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateInputSchema: z.ZodType<Prisma.UserUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  lastName: z.string(),
  firstName: z.string(),
  phoneNumber: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  depots: z.lazy(() => DepositUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUpdateInputSchema: z.ZodType<Prisma.UserUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  city: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUpdateManyWithoutUserNestedInputSchema).optional(),
  depots: z.lazy(() => DepositUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  city: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  depots: z.lazy(() => DepositUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  lastName: z.string(),
  firstName: z.string(),
  phoneNumber: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const UserUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  city: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const UserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  city: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const DepositCreateInputSchema: z.ZodType<Prisma.DepositCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  status: z.lazy(() => DepotStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  event: z.lazy(() => EventCreateNestedOneWithoutDepositsInputSchema),
  user: z.lazy(() => UserCreateNestedOneWithoutDepotsInputSchema),
  workstation: z.lazy(() => WorkstationCreateNestedOneWithoutDepositsInputSchema),
  articles: z.lazy(() => ArticleCreateNestedManyWithoutDepositInputSchema).optional(),
});

export const DepositUncheckedCreateInputSchema: z.ZodType<Prisma.DepositUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  userId: z.string(),
  workstationId: z.string(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  status: z.lazy(() => DepotStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedCreateNestedManyWithoutDepositInputSchema).optional(),
});

export const DepositUpdateInputSchema: z.ZodType<Prisma.DepositUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => EnumDepotStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutDepositsNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutDepotsNestedInputSchema).optional(),
  workstation: z.lazy(() => WorkstationUpdateOneRequiredWithoutDepositsNestedInputSchema).optional(),
  articles: z.lazy(() => ArticleUpdateManyWithoutDepositNestedInputSchema).optional(),
});

export const DepositUncheckedUpdateInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  workstationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => EnumDepotStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedUpdateManyWithoutDepositNestedInputSchema).optional(),
});

export const DepositCreateManyInputSchema: z.ZodType<Prisma.DepositCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  userId: z.string(),
  workstationId: z.string(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  status: z.lazy(() => DepotStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const DepositUpdateManyMutationInputSchema: z.ZodType<Prisma.DepositUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => EnumDepotStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const DepositUncheckedUpdateManyInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  workstationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => EnumDepotStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SaleCreateInputSchema: z.ZodType<Prisma.SaleCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  event: z.lazy(() => EventCreateNestedOneWithoutSalesInputSchema),
  user: z.lazy(() => UserCreateNestedOneWithoutSalesInputSchema),
  workstation: z.lazy(() => WorkstationCreateNestedOneWithoutSalesInputSchema),
  checkout: z.lazy(() => CheckoutCreateNestedOneWithoutSalesInputSchema),
  articles: z.lazy(() => ArticleCreateNestedManyWithoutSaleInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionCreateNestedManyWithoutSaleInputSchema).optional(),
});

export const SaleUncheckedCreateInputSchema: z.ZodType<Prisma.SaleUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  userId: z.string(),
  workstationId: z.string(),
  checkoutId: z.string(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedCreateNestedManyWithoutSaleInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionUncheckedCreateNestedManyWithoutSaleInputSchema).optional(),
});

export const SaleUpdateInputSchema: z.ZodType<Prisma.SaleUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  workstation: z.lazy(() => WorkstationUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  checkout: z.lazy(() => CheckoutUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  articles: z.lazy(() => ArticleUpdateManyWithoutSaleNestedInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const SaleUncheckedUpdateInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  workstationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  checkoutId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedUpdateManyWithoutSaleNestedInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionUncheckedUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const SaleCreateManyInputSchema: z.ZodType<Prisma.SaleCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  userId: z.string(),
  workstationId: z.string(),
  checkoutId: z.string(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const SaleUpdateManyMutationInputSchema: z.ZodType<Prisma.SaleUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SaleUncheckedUpdateManyInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  workstationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  checkoutId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const CashTransactionCreateInputSchema: z.ZodType<Prisma.CashTransactionCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  cashReceived: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  cashGiven: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sale: z.lazy(() => SaleCreateNestedOneWithoutCashTransactionsInputSchema),
});

export const CashTransactionUncheckedCreateInputSchema: z.ZodType<Prisma.CashTransactionUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  saleId: z.string(),
  cashReceived: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  cashGiven: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const CashTransactionUpdateInputSchema: z.ZodType<Prisma.CashTransactionUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cashReceived: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashGiven: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sale: z.lazy(() => SaleUpdateOneRequiredWithoutCashTransactionsNestedInputSchema).optional(),
});

export const CashTransactionUncheckedUpdateInputSchema: z.ZodType<Prisma.CashTransactionUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  saleId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cashReceived: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashGiven: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const CashTransactionCreateManyInputSchema: z.ZodType<Prisma.CashTransactionCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  saleId: z.string(),
  cashReceived: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  cashGiven: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const CashTransactionUpdateManyMutationInputSchema: z.ZodType<Prisma.CashTransactionUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cashReceived: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashGiven: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const CashTransactionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.CashTransactionUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  saleId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cashReceived: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashGiven: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ArticleCreateInputSchema: z.ZodType<Prisma.ArticleCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  discipline: z.string().optional().nullable(),
  categorie: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  code: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  deposit: z.lazy(() => DepositCreateNestedOneWithoutArticlesInputSchema).optional(),
  sale: z.lazy(() => SaleCreateNestedOneWithoutArticlesInputSchema).optional(),
});

export const ArticleUncheckedCreateInputSchema: z.ZodType<Prisma.ArticleUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  discipline: z.string().optional().nullable(),
  categorie: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  code: z.string().optional().nullable(),
  depositId: z.string().optional().nullable(),
  saleId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const ArticleUpdateInputSchema: z.ZodType<Prisma.ArticleUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categorie: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  brand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  size: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  code: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deposit: z.lazy(() => DepositUpdateOneWithoutArticlesNestedInputSchema).optional(),
  sale: z.lazy(() => SaleUpdateOneWithoutArticlesNestedInputSchema).optional(),
});

export const ArticleUncheckedUpdateInputSchema: z.ZodType<Prisma.ArticleUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categorie: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  brand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  size: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  code: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  depositId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ArticleCreateManyInputSchema: z.ZodType<Prisma.ArticleCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  discipline: z.string().optional().nullable(),
  categorie: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  code: z.string().optional().nullable(),
  depositId: z.string().optional().nullable(),
  saleId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const ArticleUpdateManyMutationInputSchema: z.ZodType<Prisma.ArticleUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categorie: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  brand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  size: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  code: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ArticleUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ArticleUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categorie: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  brand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  size: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  code: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  depositId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const UuidFilterSchema: z.ZodType<Prisma.UuidFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedUuidFilterSchema) ]).optional(),
});

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const IntFilterSchema: z.ZodType<Prisma.IntFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
});

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const DateTimeNullableFilterSchema: z.ZodType<Prisma.DateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export const DateTimeFilterSchema: z.ZodType<Prisma.DateTimeFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
});

export const SaleListRelationFilterSchema: z.ZodType<Prisma.SaleListRelationFilter> = z.strictObject({
  every: z.lazy(() => SaleWhereInputSchema).optional(),
  some: z.lazy(() => SaleWhereInputSchema).optional(),
  none: z.lazy(() => SaleWhereInputSchema).optional(),
});

export const DepositListRelationFilterSchema: z.ZodType<Prisma.DepositListRelationFilter> = z.strictObject({
  every: z.lazy(() => DepositWhereInputSchema).optional(),
  some: z.lazy(() => DepositWhereInputSchema).optional(),
  none: z.lazy(() => DepositWhereInputSchema).optional(),
});

export const WorkstationListRelationFilterSchema: z.ZodType<Prisma.WorkstationListRelationFilter> = z.strictObject({
  every: z.lazy(() => WorkstationWhereInputSchema).optional(),
  some: z.lazy(() => WorkstationWhereInputSchema).optional(),
  none: z.lazy(() => WorkstationWhereInputSchema).optional(),
});

export const CheckoutListRelationFilterSchema: z.ZodType<Prisma.CheckoutListRelationFilter> = z.strictObject({
  every: z.lazy(() => CheckoutWhereInputSchema).optional(),
  some: z.lazy(() => CheckoutWhereInputSchema).optional(),
  none: z.lazy(() => CheckoutWhereInputSchema).optional(),
});

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.strictObject({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional(),
});

export const SaleOrderByRelationAggregateInputSchema: z.ZodType<Prisma.SaleOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const DepositOrderByRelationAggregateInputSchema: z.ZodType<Prisma.DepositOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const WorkstationOrderByRelationAggregateInputSchema: z.ZodType<Prisma.WorkstationOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const CheckoutOrderByRelationAggregateInputSchema: z.ZodType<Prisma.CheckoutOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const EventCountOrderByAggregateInputSchema: z.ZodType<Prisma.EventCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  startDate: z.lazy(() => SortOrderSchema).optional(),
  endDate: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EventAvgOrderByAggregateInputSchema: z.ZodType<Prisma.EventAvgOrderByAggregateInput> = z.strictObject({
  year: z.lazy(() => SortOrderSchema).optional(),
});

export const EventMaxOrderByAggregateInputSchema: z.ZodType<Prisma.EventMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  startDate: z.lazy(() => SortOrderSchema).optional(),
  endDate: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EventMinOrderByAggregateInputSchema: z.ZodType<Prisma.EventMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  startDate: z.lazy(() => SortOrderSchema).optional(),
  endDate: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EventSumOrderByAggregateInputSchema: z.ZodType<Prisma.EventSumOrderByAggregateInput> = z.strictObject({
  year: z.lazy(() => SortOrderSchema).optional(),
});

export const UuidWithAggregatesFilterSchema: z.ZodType<Prisma.UuidWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedUuidWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const IntWithAggregatesFilterSchema: z.ZodType<Prisma.IntWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional(),
});

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const DateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
});

export const DateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
});

export const DecimalFilterSchema: z.ZodType<Prisma.DecimalFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  lt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalFilterSchema) ]).optional(),
});

export const EventScalarRelationFilterSchema: z.ZodType<Prisma.EventScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => EventWhereInputSchema).optional(),
  isNot: z.lazy(() => EventWhereInputSchema).optional(),
});

export const CheckoutEventIdNameCompoundUniqueInputSchema: z.ZodType<Prisma.CheckoutEventIdNameCompoundUniqueInput> = z.strictObject({
  eventId: z.string(),
  name: z.string(),
});

export const CheckoutCountOrderByAggregateInputSchema: z.ZodType<Prisma.CheckoutCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  initialCash: z.lazy(() => SortOrderSchema).optional(),
  currentCash: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const CheckoutAvgOrderByAggregateInputSchema: z.ZodType<Prisma.CheckoutAvgOrderByAggregateInput> = z.strictObject({
  initialCash: z.lazy(() => SortOrderSchema).optional(),
  currentCash: z.lazy(() => SortOrderSchema).optional(),
});

export const CheckoutMaxOrderByAggregateInputSchema: z.ZodType<Prisma.CheckoutMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  initialCash: z.lazy(() => SortOrderSchema).optional(),
  currentCash: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const CheckoutMinOrderByAggregateInputSchema: z.ZodType<Prisma.CheckoutMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  initialCash: z.lazy(() => SortOrderSchema).optional(),
  currentCash: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const CheckoutSumOrderByAggregateInputSchema: z.ZodType<Prisma.CheckoutSumOrderByAggregateInput> = z.strictObject({
  initialCash: z.lazy(() => SortOrderSchema).optional(),
  currentCash: z.lazy(() => SortOrderSchema).optional(),
});

export const DecimalWithAggregatesFilterSchema: z.ZodType<Prisma.DecimalWithAggregatesFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  lt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _sum: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _min: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _max: z.lazy(() => NestedDecimalFilterSchema).optional(),
});

export const WorkstationEventIdNameCompoundUniqueInputSchema: z.ZodType<Prisma.WorkstationEventIdNameCompoundUniqueInput> = z.strictObject({
  eventId: z.string(),
  name: z.string(),
});

export const WorkstationCountOrderByAggregateInputSchema: z.ZodType<Prisma.WorkstationCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  increment_start: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const WorkstationAvgOrderByAggregateInputSchema: z.ZodType<Prisma.WorkstationAvgOrderByAggregateInput> = z.strictObject({
  increment_start: z.lazy(() => SortOrderSchema).optional(),
});

export const WorkstationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.WorkstationMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  increment_start: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const WorkstationMinOrderByAggregateInputSchema: z.ZodType<Prisma.WorkstationMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  increment_start: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const WorkstationSumOrderByAggregateInputSchema: z.ZodType<Prisma.WorkstationSumOrderByAggregateInput> = z.strictObject({
  increment_start: z.lazy(() => SortOrderSchema).optional(),
});

export const UserCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  city: z.lazy(() => SortOrderSchema).optional(),
  postalCode: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const UserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  city: z.lazy(() => SortOrderSchema).optional(),
  postalCode: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const UserMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  city: z.lazy(() => SortOrderSchema).optional(),
  postalCode: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumContributionStatusFilterSchema: z.ZodType<Prisma.EnumContributionStatusFilter> = z.strictObject({
  equals: z.lazy(() => ContributionStatusSchema).optional(),
  in: z.lazy(() => ContributionStatusSchema).array().optional(),
  notIn: z.lazy(() => ContributionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => NestedEnumContributionStatusFilterSchema) ]).optional(),
});

export const EnumDepotStatusFilterSchema: z.ZodType<Prisma.EnumDepotStatusFilter> = z.strictObject({
  equals: z.lazy(() => DepotStatusSchema).optional(),
  in: z.lazy(() => DepotStatusSchema).array().optional(),
  notIn: z.lazy(() => DepotStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => NestedEnumDepotStatusFilterSchema) ]).optional(),
});

export const UserScalarRelationFilterSchema: z.ZodType<Prisma.UserScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => UserWhereInputSchema).optional(),
  isNot: z.lazy(() => UserWhereInputSchema).optional(),
});

export const WorkstationScalarRelationFilterSchema: z.ZodType<Prisma.WorkstationScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => WorkstationWhereInputSchema).optional(),
  isNot: z.lazy(() => WorkstationWhereInputSchema).optional(),
});

export const ArticleListRelationFilterSchema: z.ZodType<Prisma.ArticleListRelationFilter> = z.strictObject({
  every: z.lazy(() => ArticleWhereInputSchema).optional(),
  some: z.lazy(() => ArticleWhereInputSchema).optional(),
  none: z.lazy(() => ArticleWhereInputSchema).optional(),
});

export const ArticleOrderByRelationAggregateInputSchema: z.ZodType<Prisma.ArticleOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const DepositCountOrderByAggregateInputSchema: z.ZodType<Prisma.DepositCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  workstationId: z.lazy(() => SortOrderSchema).optional(),
  contributionStatus: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const DepositMaxOrderByAggregateInputSchema: z.ZodType<Prisma.DepositMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  workstationId: z.lazy(() => SortOrderSchema).optional(),
  contributionStatus: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const DepositMinOrderByAggregateInputSchema: z.ZodType<Prisma.DepositMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  workstationId: z.lazy(() => SortOrderSchema).optional(),
  contributionStatus: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumContributionStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumContributionStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => ContributionStatusSchema).optional(),
  in: z.lazy(() => ContributionStatusSchema).array().optional(),
  notIn: z.lazy(() => ContributionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => NestedEnumContributionStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumContributionStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumContributionStatusFilterSchema).optional(),
});

export const EnumDepotStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumDepotStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => DepotStatusSchema).optional(),
  in: z.lazy(() => DepotStatusSchema).array().optional(),
  notIn: z.lazy(() => DepotStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => NestedEnumDepotStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumDepotStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumDepotStatusFilterSchema).optional(),
});

export const CheckoutScalarRelationFilterSchema: z.ZodType<Prisma.CheckoutScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => CheckoutWhereInputSchema).optional(),
  isNot: z.lazy(() => CheckoutWhereInputSchema).optional(),
});

export const CashTransactionListRelationFilterSchema: z.ZodType<Prisma.CashTransactionListRelationFilter> = z.strictObject({
  every: z.lazy(() => CashTransactionWhereInputSchema).optional(),
  some: z.lazy(() => CashTransactionWhereInputSchema).optional(),
  none: z.lazy(() => CashTransactionWhereInputSchema).optional(),
});

export const CashTransactionOrderByRelationAggregateInputSchema: z.ZodType<Prisma.CashTransactionOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const SaleCountOrderByAggregateInputSchema: z.ZodType<Prisma.SaleCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  workstationId: z.lazy(() => SortOrderSchema).optional(),
  checkoutId: z.lazy(() => SortOrderSchema).optional(),
  cardAmount: z.lazy(() => SortOrderSchema).optional(),
  cashAmount: z.lazy(() => SortOrderSchema).optional(),
  checkAmount: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
  postalCode: z.lazy(() => SortOrderSchema).optional(),
  saleAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const SaleAvgOrderByAggregateInputSchema: z.ZodType<Prisma.SaleAvgOrderByAggregateInput> = z.strictObject({
  cardAmount: z.lazy(() => SortOrderSchema).optional(),
  cashAmount: z.lazy(() => SortOrderSchema).optional(),
  checkAmount: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
});

export const SaleMaxOrderByAggregateInputSchema: z.ZodType<Prisma.SaleMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  workstationId: z.lazy(() => SortOrderSchema).optional(),
  checkoutId: z.lazy(() => SortOrderSchema).optional(),
  cardAmount: z.lazy(() => SortOrderSchema).optional(),
  cashAmount: z.lazy(() => SortOrderSchema).optional(),
  checkAmount: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
  postalCode: z.lazy(() => SortOrderSchema).optional(),
  saleAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const SaleMinOrderByAggregateInputSchema: z.ZodType<Prisma.SaleMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  workstationId: z.lazy(() => SortOrderSchema).optional(),
  checkoutId: z.lazy(() => SortOrderSchema).optional(),
  cardAmount: z.lazy(() => SortOrderSchema).optional(),
  cashAmount: z.lazy(() => SortOrderSchema).optional(),
  checkAmount: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
  postalCode: z.lazy(() => SortOrderSchema).optional(),
  saleAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const SaleSumOrderByAggregateInputSchema: z.ZodType<Prisma.SaleSumOrderByAggregateInput> = z.strictObject({
  cardAmount: z.lazy(() => SortOrderSchema).optional(),
  cashAmount: z.lazy(() => SortOrderSchema).optional(),
  checkAmount: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
});

export const SaleScalarRelationFilterSchema: z.ZodType<Prisma.SaleScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => SaleWhereInputSchema).optional(),
  isNot: z.lazy(() => SaleWhereInputSchema).optional(),
});

export const CashTransactionCountOrderByAggregateInputSchema: z.ZodType<Prisma.CashTransactionCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  saleId: z.lazy(() => SortOrderSchema).optional(),
  cashReceived: z.lazy(() => SortOrderSchema).optional(),
  cashGiven: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const CashTransactionAvgOrderByAggregateInputSchema: z.ZodType<Prisma.CashTransactionAvgOrderByAggregateInput> = z.strictObject({
  cashReceived: z.lazy(() => SortOrderSchema).optional(),
  cashGiven: z.lazy(() => SortOrderSchema).optional(),
});

export const CashTransactionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.CashTransactionMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  saleId: z.lazy(() => SortOrderSchema).optional(),
  cashReceived: z.lazy(() => SortOrderSchema).optional(),
  cashGiven: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const CashTransactionMinOrderByAggregateInputSchema: z.ZodType<Prisma.CashTransactionMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  saleId: z.lazy(() => SortOrderSchema).optional(),
  cashReceived: z.lazy(() => SortOrderSchema).optional(),
  cashGiven: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const CashTransactionSumOrderByAggregateInputSchema: z.ZodType<Prisma.CashTransactionSumOrderByAggregateInput> = z.strictObject({
  cashReceived: z.lazy(() => SortOrderSchema).optional(),
  cashGiven: z.lazy(() => SortOrderSchema).optional(),
});

export const DecimalNullableFilterSchema: z.ZodType<Prisma.DecimalNullableFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  lt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalNullableFilterSchema) ]).optional().nullable(),
});

export const UuidNullableFilterSchema: z.ZodType<Prisma.UuidNullableFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedUuidNullableFilterSchema) ]).optional().nullable(),
});

export const DepositNullableScalarRelationFilterSchema: z.ZodType<Prisma.DepositNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => DepositWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => DepositWhereInputSchema).optional().nullable(),
});

export const SaleNullableScalarRelationFilterSchema: z.ZodType<Prisma.SaleNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => SaleWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => SaleWhereInputSchema).optional().nullable(),
});

export const ArticleCountOrderByAggregateInputSchema: z.ZodType<Prisma.ArticleCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  discipline: z.lazy(() => SortOrderSchema).optional(),
  categorie: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  color: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  depositId: z.lazy(() => SortOrderSchema).optional(),
  saleId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ArticleAvgOrderByAggregateInputSchema: z.ZodType<Prisma.ArticleAvgOrderByAggregateInput> = z.strictObject({
  price: z.lazy(() => SortOrderSchema).optional(),
});

export const ArticleMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ArticleMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  discipline: z.lazy(() => SortOrderSchema).optional(),
  categorie: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  color: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  depositId: z.lazy(() => SortOrderSchema).optional(),
  saleId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ArticleMinOrderByAggregateInputSchema: z.ZodType<Prisma.ArticleMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  discipline: z.lazy(() => SortOrderSchema).optional(),
  categorie: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  color: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  depositId: z.lazy(() => SortOrderSchema).optional(),
  saleId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ArticleSumOrderByAggregateInputSchema: z.ZodType<Prisma.ArticleSumOrderByAggregateInput> = z.strictObject({
  price: z.lazy(() => SortOrderSchema).optional(),
});

export const DecimalNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DecimalNullableWithAggregatesFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  lt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
});

export const UuidNullableWithAggregatesFilterSchema: z.ZodType<Prisma.UuidNullableWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedUuidNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const SaleCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.SaleCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutEventInputSchema), z.lazy(() => SaleCreateWithoutEventInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutEventInputSchema), z.lazy(() => SaleUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutEventInputSchema), z.lazy(() => SaleCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
});

export const DepositCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.DepositCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutEventInputSchema), z.lazy(() => DepositCreateWithoutEventInputSchema).array(), z.lazy(() => DepositUncheckedCreateWithoutEventInputSchema), z.lazy(() => DepositUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DepositCreateOrConnectWithoutEventInputSchema), z.lazy(() => DepositCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DepositCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
});

export const WorkstationCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.WorkstationCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => WorkstationCreateWithoutEventInputSchema), z.lazy(() => WorkstationCreateWithoutEventInputSchema).array(), z.lazy(() => WorkstationUncheckedCreateWithoutEventInputSchema), z.lazy(() => WorkstationUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => WorkstationCreateOrConnectWithoutEventInputSchema), z.lazy(() => WorkstationCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => WorkstationCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => WorkstationWhereUniqueInputSchema), z.lazy(() => WorkstationWhereUniqueInputSchema).array() ]).optional(),
});

export const CheckoutCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.CheckoutCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => CheckoutCreateWithoutEventInputSchema), z.lazy(() => CheckoutCreateWithoutEventInputSchema).array(), z.lazy(() => CheckoutUncheckedCreateWithoutEventInputSchema), z.lazy(() => CheckoutUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CheckoutCreateOrConnectWithoutEventInputSchema), z.lazy(() => CheckoutCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CheckoutCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CheckoutWhereUniqueInputSchema), z.lazy(() => CheckoutWhereUniqueInputSchema).array() ]).optional(),
});

export const SaleUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.SaleUncheckedCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutEventInputSchema), z.lazy(() => SaleCreateWithoutEventInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutEventInputSchema), z.lazy(() => SaleUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutEventInputSchema), z.lazy(() => SaleCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
});

export const DepositUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.DepositUncheckedCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutEventInputSchema), z.lazy(() => DepositCreateWithoutEventInputSchema).array(), z.lazy(() => DepositUncheckedCreateWithoutEventInputSchema), z.lazy(() => DepositUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DepositCreateOrConnectWithoutEventInputSchema), z.lazy(() => DepositCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DepositCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
});

export const WorkstationUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.WorkstationUncheckedCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => WorkstationCreateWithoutEventInputSchema), z.lazy(() => WorkstationCreateWithoutEventInputSchema).array(), z.lazy(() => WorkstationUncheckedCreateWithoutEventInputSchema), z.lazy(() => WorkstationUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => WorkstationCreateOrConnectWithoutEventInputSchema), z.lazy(() => WorkstationCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => WorkstationCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => WorkstationWhereUniqueInputSchema), z.lazy(() => WorkstationWhereUniqueInputSchema).array() ]).optional(),
});

export const CheckoutUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.CheckoutUncheckedCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => CheckoutCreateWithoutEventInputSchema), z.lazy(() => CheckoutCreateWithoutEventInputSchema).array(), z.lazy(() => CheckoutUncheckedCreateWithoutEventInputSchema), z.lazy(() => CheckoutUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CheckoutCreateOrConnectWithoutEventInputSchema), z.lazy(() => CheckoutCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CheckoutCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CheckoutWhereUniqueInputSchema), z.lazy(() => CheckoutWhereUniqueInputSchema).array() ]).optional(),
});

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional(),
});

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> = z.strictObject({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional(),
});

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional().nullable(),
});

export const NullableDateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional().nullable(),
});

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> = z.strictObject({
  set: z.boolean().optional(),
});

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional(),
});

export const SaleUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.SaleUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutEventInputSchema), z.lazy(() => SaleCreateWithoutEventInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutEventInputSchema), z.lazy(() => SaleUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutEventInputSchema), z.lazy(() => SaleCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SaleUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => SaleUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SaleUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => SaleUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SaleUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => SaleUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SaleScalarWhereInputSchema), z.lazy(() => SaleScalarWhereInputSchema).array() ]).optional(),
});

export const DepositUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.DepositUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutEventInputSchema), z.lazy(() => DepositCreateWithoutEventInputSchema).array(), z.lazy(() => DepositUncheckedCreateWithoutEventInputSchema), z.lazy(() => DepositUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DepositCreateOrConnectWithoutEventInputSchema), z.lazy(() => DepositCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => DepositUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => DepositUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DepositCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => DepositUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => DepositUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => DepositUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => DepositUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => DepositScalarWhereInputSchema), z.lazy(() => DepositScalarWhereInputSchema).array() ]).optional(),
});

export const WorkstationUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.WorkstationUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => WorkstationCreateWithoutEventInputSchema), z.lazy(() => WorkstationCreateWithoutEventInputSchema).array(), z.lazy(() => WorkstationUncheckedCreateWithoutEventInputSchema), z.lazy(() => WorkstationUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => WorkstationCreateOrConnectWithoutEventInputSchema), z.lazy(() => WorkstationCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => WorkstationUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => WorkstationUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => WorkstationCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => WorkstationWhereUniqueInputSchema), z.lazy(() => WorkstationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => WorkstationWhereUniqueInputSchema), z.lazy(() => WorkstationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => WorkstationWhereUniqueInputSchema), z.lazy(() => WorkstationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => WorkstationWhereUniqueInputSchema), z.lazy(() => WorkstationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => WorkstationUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => WorkstationUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => WorkstationUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => WorkstationUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => WorkstationScalarWhereInputSchema), z.lazy(() => WorkstationScalarWhereInputSchema).array() ]).optional(),
});

export const CheckoutUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.CheckoutUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CheckoutCreateWithoutEventInputSchema), z.lazy(() => CheckoutCreateWithoutEventInputSchema).array(), z.lazy(() => CheckoutUncheckedCreateWithoutEventInputSchema), z.lazy(() => CheckoutUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CheckoutCreateOrConnectWithoutEventInputSchema), z.lazy(() => CheckoutCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CheckoutUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => CheckoutUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CheckoutCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CheckoutWhereUniqueInputSchema), z.lazy(() => CheckoutWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CheckoutWhereUniqueInputSchema), z.lazy(() => CheckoutWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CheckoutWhereUniqueInputSchema), z.lazy(() => CheckoutWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CheckoutWhereUniqueInputSchema), z.lazy(() => CheckoutWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CheckoutUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => CheckoutUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CheckoutUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => CheckoutUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CheckoutScalarWhereInputSchema), z.lazy(() => CheckoutScalarWhereInputSchema).array() ]).optional(),
});

export const SaleUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutEventInputSchema), z.lazy(() => SaleCreateWithoutEventInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutEventInputSchema), z.lazy(() => SaleUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutEventInputSchema), z.lazy(() => SaleCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SaleUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => SaleUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SaleUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => SaleUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SaleUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => SaleUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SaleScalarWhereInputSchema), z.lazy(() => SaleScalarWhereInputSchema).array() ]).optional(),
});

export const DepositUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutEventInputSchema), z.lazy(() => DepositCreateWithoutEventInputSchema).array(), z.lazy(() => DepositUncheckedCreateWithoutEventInputSchema), z.lazy(() => DepositUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DepositCreateOrConnectWithoutEventInputSchema), z.lazy(() => DepositCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => DepositUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => DepositUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DepositCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => DepositUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => DepositUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => DepositUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => DepositUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => DepositScalarWhereInputSchema), z.lazy(() => DepositScalarWhereInputSchema).array() ]).optional(),
});

export const WorkstationUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.WorkstationUncheckedUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => WorkstationCreateWithoutEventInputSchema), z.lazy(() => WorkstationCreateWithoutEventInputSchema).array(), z.lazy(() => WorkstationUncheckedCreateWithoutEventInputSchema), z.lazy(() => WorkstationUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => WorkstationCreateOrConnectWithoutEventInputSchema), z.lazy(() => WorkstationCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => WorkstationUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => WorkstationUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => WorkstationCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => WorkstationWhereUniqueInputSchema), z.lazy(() => WorkstationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => WorkstationWhereUniqueInputSchema), z.lazy(() => WorkstationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => WorkstationWhereUniqueInputSchema), z.lazy(() => WorkstationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => WorkstationWhereUniqueInputSchema), z.lazy(() => WorkstationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => WorkstationUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => WorkstationUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => WorkstationUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => WorkstationUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => WorkstationScalarWhereInputSchema), z.lazy(() => WorkstationScalarWhereInputSchema).array() ]).optional(),
});

export const CheckoutUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.CheckoutUncheckedUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CheckoutCreateWithoutEventInputSchema), z.lazy(() => CheckoutCreateWithoutEventInputSchema).array(), z.lazy(() => CheckoutUncheckedCreateWithoutEventInputSchema), z.lazy(() => CheckoutUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CheckoutCreateOrConnectWithoutEventInputSchema), z.lazy(() => CheckoutCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CheckoutUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => CheckoutUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CheckoutCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CheckoutWhereUniqueInputSchema), z.lazy(() => CheckoutWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CheckoutWhereUniqueInputSchema), z.lazy(() => CheckoutWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CheckoutWhereUniqueInputSchema), z.lazy(() => CheckoutWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CheckoutWhereUniqueInputSchema), z.lazy(() => CheckoutWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CheckoutUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => CheckoutUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CheckoutUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => CheckoutUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CheckoutScalarWhereInputSchema), z.lazy(() => CheckoutScalarWhereInputSchema).array() ]).optional(),
});

export const EventCreateNestedOneWithoutCheckoutsInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutCheckoutsInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutCheckoutsInputSchema), z.lazy(() => EventUncheckedCreateWithoutCheckoutsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutCheckoutsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
});

export const SaleCreateNestedManyWithoutCheckoutInputSchema: z.ZodType<Prisma.SaleCreateNestedManyWithoutCheckoutInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutCheckoutInputSchema), z.lazy(() => SaleCreateWithoutCheckoutInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutCheckoutInputSchema), z.lazy(() => SaleUncheckedCreateWithoutCheckoutInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutCheckoutInputSchema), z.lazy(() => SaleCreateOrConnectWithoutCheckoutInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyCheckoutInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
});

export const SaleUncheckedCreateNestedManyWithoutCheckoutInputSchema: z.ZodType<Prisma.SaleUncheckedCreateNestedManyWithoutCheckoutInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutCheckoutInputSchema), z.lazy(() => SaleCreateWithoutCheckoutInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutCheckoutInputSchema), z.lazy(() => SaleUncheckedCreateWithoutCheckoutInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutCheckoutInputSchema), z.lazy(() => SaleCreateOrConnectWithoutCheckoutInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyCheckoutInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
});

export const DecimalFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DecimalFieldUpdateOperationsInput> = z.strictObject({
  set: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  increment: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  decrement: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  multiply: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  divide: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
});

export const EventUpdateOneRequiredWithoutCheckoutsNestedInputSchema: z.ZodType<Prisma.EventUpdateOneRequiredWithoutCheckoutsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutCheckoutsInputSchema), z.lazy(() => EventUncheckedCreateWithoutCheckoutsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutCheckoutsInputSchema).optional(),
  upsert: z.lazy(() => EventUpsertWithoutCheckoutsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => EventUpdateToOneWithWhereWithoutCheckoutsInputSchema), z.lazy(() => EventUpdateWithoutCheckoutsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutCheckoutsInputSchema) ]).optional(),
});

export const SaleUpdateManyWithoutCheckoutNestedInputSchema: z.ZodType<Prisma.SaleUpdateManyWithoutCheckoutNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutCheckoutInputSchema), z.lazy(() => SaleCreateWithoutCheckoutInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutCheckoutInputSchema), z.lazy(() => SaleUncheckedCreateWithoutCheckoutInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutCheckoutInputSchema), z.lazy(() => SaleCreateOrConnectWithoutCheckoutInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SaleUpsertWithWhereUniqueWithoutCheckoutInputSchema), z.lazy(() => SaleUpsertWithWhereUniqueWithoutCheckoutInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyCheckoutInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SaleUpdateWithWhereUniqueWithoutCheckoutInputSchema), z.lazy(() => SaleUpdateWithWhereUniqueWithoutCheckoutInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SaleUpdateManyWithWhereWithoutCheckoutInputSchema), z.lazy(() => SaleUpdateManyWithWhereWithoutCheckoutInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SaleScalarWhereInputSchema), z.lazy(() => SaleScalarWhereInputSchema).array() ]).optional(),
});

export const SaleUncheckedUpdateManyWithoutCheckoutNestedInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateManyWithoutCheckoutNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutCheckoutInputSchema), z.lazy(() => SaleCreateWithoutCheckoutInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutCheckoutInputSchema), z.lazy(() => SaleUncheckedCreateWithoutCheckoutInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutCheckoutInputSchema), z.lazy(() => SaleCreateOrConnectWithoutCheckoutInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SaleUpsertWithWhereUniqueWithoutCheckoutInputSchema), z.lazy(() => SaleUpsertWithWhereUniqueWithoutCheckoutInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyCheckoutInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SaleUpdateWithWhereUniqueWithoutCheckoutInputSchema), z.lazy(() => SaleUpdateWithWhereUniqueWithoutCheckoutInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SaleUpdateManyWithWhereWithoutCheckoutInputSchema), z.lazy(() => SaleUpdateManyWithWhereWithoutCheckoutInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SaleScalarWhereInputSchema), z.lazy(() => SaleScalarWhereInputSchema).array() ]).optional(),
});

export const EventCreateNestedOneWithoutWorkstationsInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutWorkstationsInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutWorkstationsInputSchema), z.lazy(() => EventUncheckedCreateWithoutWorkstationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutWorkstationsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
});

export const SaleCreateNestedManyWithoutWorkstationInputSchema: z.ZodType<Prisma.SaleCreateNestedManyWithoutWorkstationInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutWorkstationInputSchema), z.lazy(() => SaleCreateWithoutWorkstationInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutWorkstationInputSchema), z.lazy(() => SaleUncheckedCreateWithoutWorkstationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutWorkstationInputSchema), z.lazy(() => SaleCreateOrConnectWithoutWorkstationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyWorkstationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
});

export const DepositCreateNestedManyWithoutWorkstationInputSchema: z.ZodType<Prisma.DepositCreateNestedManyWithoutWorkstationInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutWorkstationInputSchema), z.lazy(() => DepositCreateWithoutWorkstationInputSchema).array(), z.lazy(() => DepositUncheckedCreateWithoutWorkstationInputSchema), z.lazy(() => DepositUncheckedCreateWithoutWorkstationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DepositCreateOrConnectWithoutWorkstationInputSchema), z.lazy(() => DepositCreateOrConnectWithoutWorkstationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DepositCreateManyWorkstationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
});

export const SaleUncheckedCreateNestedManyWithoutWorkstationInputSchema: z.ZodType<Prisma.SaleUncheckedCreateNestedManyWithoutWorkstationInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutWorkstationInputSchema), z.lazy(() => SaleCreateWithoutWorkstationInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutWorkstationInputSchema), z.lazy(() => SaleUncheckedCreateWithoutWorkstationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutWorkstationInputSchema), z.lazy(() => SaleCreateOrConnectWithoutWorkstationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyWorkstationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
});

export const DepositUncheckedCreateNestedManyWithoutWorkstationInputSchema: z.ZodType<Prisma.DepositUncheckedCreateNestedManyWithoutWorkstationInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutWorkstationInputSchema), z.lazy(() => DepositCreateWithoutWorkstationInputSchema).array(), z.lazy(() => DepositUncheckedCreateWithoutWorkstationInputSchema), z.lazy(() => DepositUncheckedCreateWithoutWorkstationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DepositCreateOrConnectWithoutWorkstationInputSchema), z.lazy(() => DepositCreateOrConnectWithoutWorkstationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DepositCreateManyWorkstationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
});

export const EventUpdateOneRequiredWithoutWorkstationsNestedInputSchema: z.ZodType<Prisma.EventUpdateOneRequiredWithoutWorkstationsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutWorkstationsInputSchema), z.lazy(() => EventUncheckedCreateWithoutWorkstationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutWorkstationsInputSchema).optional(),
  upsert: z.lazy(() => EventUpsertWithoutWorkstationsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => EventUpdateToOneWithWhereWithoutWorkstationsInputSchema), z.lazy(() => EventUpdateWithoutWorkstationsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutWorkstationsInputSchema) ]).optional(),
});

export const SaleUpdateManyWithoutWorkstationNestedInputSchema: z.ZodType<Prisma.SaleUpdateManyWithoutWorkstationNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutWorkstationInputSchema), z.lazy(() => SaleCreateWithoutWorkstationInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutWorkstationInputSchema), z.lazy(() => SaleUncheckedCreateWithoutWorkstationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutWorkstationInputSchema), z.lazy(() => SaleCreateOrConnectWithoutWorkstationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SaleUpsertWithWhereUniqueWithoutWorkstationInputSchema), z.lazy(() => SaleUpsertWithWhereUniqueWithoutWorkstationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyWorkstationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SaleUpdateWithWhereUniqueWithoutWorkstationInputSchema), z.lazy(() => SaleUpdateWithWhereUniqueWithoutWorkstationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SaleUpdateManyWithWhereWithoutWorkstationInputSchema), z.lazy(() => SaleUpdateManyWithWhereWithoutWorkstationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SaleScalarWhereInputSchema), z.lazy(() => SaleScalarWhereInputSchema).array() ]).optional(),
});

export const DepositUpdateManyWithoutWorkstationNestedInputSchema: z.ZodType<Prisma.DepositUpdateManyWithoutWorkstationNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutWorkstationInputSchema), z.lazy(() => DepositCreateWithoutWorkstationInputSchema).array(), z.lazy(() => DepositUncheckedCreateWithoutWorkstationInputSchema), z.lazy(() => DepositUncheckedCreateWithoutWorkstationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DepositCreateOrConnectWithoutWorkstationInputSchema), z.lazy(() => DepositCreateOrConnectWithoutWorkstationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => DepositUpsertWithWhereUniqueWithoutWorkstationInputSchema), z.lazy(() => DepositUpsertWithWhereUniqueWithoutWorkstationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DepositCreateManyWorkstationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => DepositUpdateWithWhereUniqueWithoutWorkstationInputSchema), z.lazy(() => DepositUpdateWithWhereUniqueWithoutWorkstationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => DepositUpdateManyWithWhereWithoutWorkstationInputSchema), z.lazy(() => DepositUpdateManyWithWhereWithoutWorkstationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => DepositScalarWhereInputSchema), z.lazy(() => DepositScalarWhereInputSchema).array() ]).optional(),
});

export const SaleUncheckedUpdateManyWithoutWorkstationNestedInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateManyWithoutWorkstationNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutWorkstationInputSchema), z.lazy(() => SaleCreateWithoutWorkstationInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutWorkstationInputSchema), z.lazy(() => SaleUncheckedCreateWithoutWorkstationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutWorkstationInputSchema), z.lazy(() => SaleCreateOrConnectWithoutWorkstationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SaleUpsertWithWhereUniqueWithoutWorkstationInputSchema), z.lazy(() => SaleUpsertWithWhereUniqueWithoutWorkstationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyWorkstationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SaleUpdateWithWhereUniqueWithoutWorkstationInputSchema), z.lazy(() => SaleUpdateWithWhereUniqueWithoutWorkstationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SaleUpdateManyWithWhereWithoutWorkstationInputSchema), z.lazy(() => SaleUpdateManyWithWhereWithoutWorkstationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SaleScalarWhereInputSchema), z.lazy(() => SaleScalarWhereInputSchema).array() ]).optional(),
});

export const DepositUncheckedUpdateManyWithoutWorkstationNestedInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateManyWithoutWorkstationNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutWorkstationInputSchema), z.lazy(() => DepositCreateWithoutWorkstationInputSchema).array(), z.lazy(() => DepositUncheckedCreateWithoutWorkstationInputSchema), z.lazy(() => DepositUncheckedCreateWithoutWorkstationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DepositCreateOrConnectWithoutWorkstationInputSchema), z.lazy(() => DepositCreateOrConnectWithoutWorkstationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => DepositUpsertWithWhereUniqueWithoutWorkstationInputSchema), z.lazy(() => DepositUpsertWithWhereUniqueWithoutWorkstationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DepositCreateManyWorkstationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => DepositUpdateWithWhereUniqueWithoutWorkstationInputSchema), z.lazy(() => DepositUpdateWithWhereUniqueWithoutWorkstationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => DepositUpdateManyWithWhereWithoutWorkstationInputSchema), z.lazy(() => DepositUpdateManyWithWhereWithoutWorkstationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => DepositScalarWhereInputSchema), z.lazy(() => DepositScalarWhereInputSchema).array() ]).optional(),
});

export const SaleCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SaleCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutUserInputSchema), z.lazy(() => SaleCreateWithoutUserInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutUserInputSchema), z.lazy(() => SaleUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutUserInputSchema), z.lazy(() => SaleCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
});

export const DepositCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.DepositCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutUserInputSchema), z.lazy(() => DepositCreateWithoutUserInputSchema).array(), z.lazy(() => DepositUncheckedCreateWithoutUserInputSchema), z.lazy(() => DepositUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DepositCreateOrConnectWithoutUserInputSchema), z.lazy(() => DepositCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DepositCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
});

export const SaleUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SaleUncheckedCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutUserInputSchema), z.lazy(() => SaleCreateWithoutUserInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutUserInputSchema), z.lazy(() => SaleUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutUserInputSchema), z.lazy(() => SaleCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
});

export const DepositUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.DepositUncheckedCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutUserInputSchema), z.lazy(() => DepositCreateWithoutUserInputSchema).array(), z.lazy(() => DepositUncheckedCreateWithoutUserInputSchema), z.lazy(() => DepositUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DepositCreateOrConnectWithoutUserInputSchema), z.lazy(() => DepositCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DepositCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
});

export const SaleUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SaleUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutUserInputSchema), z.lazy(() => SaleCreateWithoutUserInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutUserInputSchema), z.lazy(() => SaleUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutUserInputSchema), z.lazy(() => SaleCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SaleUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SaleUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SaleUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SaleUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SaleUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => SaleUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SaleScalarWhereInputSchema), z.lazy(() => SaleScalarWhereInputSchema).array() ]).optional(),
});

export const DepositUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.DepositUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutUserInputSchema), z.lazy(() => DepositCreateWithoutUserInputSchema).array(), z.lazy(() => DepositUncheckedCreateWithoutUserInputSchema), z.lazy(() => DepositUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DepositCreateOrConnectWithoutUserInputSchema), z.lazy(() => DepositCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => DepositUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => DepositUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DepositCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => DepositUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => DepositUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => DepositUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => DepositUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => DepositScalarWhereInputSchema), z.lazy(() => DepositScalarWhereInputSchema).array() ]).optional(),
});

export const SaleUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutUserInputSchema), z.lazy(() => SaleCreateWithoutUserInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutUserInputSchema), z.lazy(() => SaleUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutUserInputSchema), z.lazy(() => SaleCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SaleUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SaleUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SaleUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SaleUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SaleUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => SaleUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SaleScalarWhereInputSchema), z.lazy(() => SaleScalarWhereInputSchema).array() ]).optional(),
});

export const DepositUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutUserInputSchema), z.lazy(() => DepositCreateWithoutUserInputSchema).array(), z.lazy(() => DepositUncheckedCreateWithoutUserInputSchema), z.lazy(() => DepositUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DepositCreateOrConnectWithoutUserInputSchema), z.lazy(() => DepositCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => DepositUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => DepositUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DepositCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => DepositUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => DepositUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => DepositUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => DepositUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => DepositScalarWhereInputSchema), z.lazy(() => DepositScalarWhereInputSchema).array() ]).optional(),
});

export const EventCreateNestedOneWithoutDepositsInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutDepositsInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutDepositsInputSchema), z.lazy(() => EventUncheckedCreateWithoutDepositsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutDepositsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
});

export const UserCreateNestedOneWithoutDepotsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutDepotsInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutDepotsInputSchema), z.lazy(() => UserUncheckedCreateWithoutDepotsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutDepotsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const WorkstationCreateNestedOneWithoutDepositsInputSchema: z.ZodType<Prisma.WorkstationCreateNestedOneWithoutDepositsInput> = z.strictObject({
  create: z.union([ z.lazy(() => WorkstationCreateWithoutDepositsInputSchema), z.lazy(() => WorkstationUncheckedCreateWithoutDepositsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => WorkstationCreateOrConnectWithoutDepositsInputSchema).optional(),
  connect: z.lazy(() => WorkstationWhereUniqueInputSchema).optional(),
});

export const ArticleCreateNestedManyWithoutDepositInputSchema: z.ZodType<Prisma.ArticleCreateNestedManyWithoutDepositInput> = z.strictObject({
  create: z.union([ z.lazy(() => ArticleCreateWithoutDepositInputSchema), z.lazy(() => ArticleCreateWithoutDepositInputSchema).array(), z.lazy(() => ArticleUncheckedCreateWithoutDepositInputSchema), z.lazy(() => ArticleUncheckedCreateWithoutDepositInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ArticleCreateOrConnectWithoutDepositInputSchema), z.lazy(() => ArticleCreateOrConnectWithoutDepositInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ArticleCreateManyDepositInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
});

export const ArticleUncheckedCreateNestedManyWithoutDepositInputSchema: z.ZodType<Prisma.ArticleUncheckedCreateNestedManyWithoutDepositInput> = z.strictObject({
  create: z.union([ z.lazy(() => ArticleCreateWithoutDepositInputSchema), z.lazy(() => ArticleCreateWithoutDepositInputSchema).array(), z.lazy(() => ArticleUncheckedCreateWithoutDepositInputSchema), z.lazy(() => ArticleUncheckedCreateWithoutDepositInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ArticleCreateOrConnectWithoutDepositInputSchema), z.lazy(() => ArticleCreateOrConnectWithoutDepositInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ArticleCreateManyDepositInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
});

export const EnumContributionStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumContributionStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => ContributionStatusSchema).optional(),
});

export const EnumDepotStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumDepotStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => DepotStatusSchema).optional(),
});

export const EventUpdateOneRequiredWithoutDepositsNestedInputSchema: z.ZodType<Prisma.EventUpdateOneRequiredWithoutDepositsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutDepositsInputSchema), z.lazy(() => EventUncheckedCreateWithoutDepositsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutDepositsInputSchema).optional(),
  upsert: z.lazy(() => EventUpsertWithoutDepositsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => EventUpdateToOneWithWhereWithoutDepositsInputSchema), z.lazy(() => EventUpdateWithoutDepositsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutDepositsInputSchema) ]).optional(),
});

export const UserUpdateOneRequiredWithoutDepotsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutDepotsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutDepotsInputSchema), z.lazy(() => UserUncheckedCreateWithoutDepotsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutDepotsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutDepotsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutDepotsInputSchema), z.lazy(() => UserUpdateWithoutDepotsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutDepotsInputSchema) ]).optional(),
});

export const WorkstationUpdateOneRequiredWithoutDepositsNestedInputSchema: z.ZodType<Prisma.WorkstationUpdateOneRequiredWithoutDepositsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => WorkstationCreateWithoutDepositsInputSchema), z.lazy(() => WorkstationUncheckedCreateWithoutDepositsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => WorkstationCreateOrConnectWithoutDepositsInputSchema).optional(),
  upsert: z.lazy(() => WorkstationUpsertWithoutDepositsInputSchema).optional(),
  connect: z.lazy(() => WorkstationWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => WorkstationUpdateToOneWithWhereWithoutDepositsInputSchema), z.lazy(() => WorkstationUpdateWithoutDepositsInputSchema), z.lazy(() => WorkstationUncheckedUpdateWithoutDepositsInputSchema) ]).optional(),
});

export const ArticleUpdateManyWithoutDepositNestedInputSchema: z.ZodType<Prisma.ArticleUpdateManyWithoutDepositNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ArticleCreateWithoutDepositInputSchema), z.lazy(() => ArticleCreateWithoutDepositInputSchema).array(), z.lazy(() => ArticleUncheckedCreateWithoutDepositInputSchema), z.lazy(() => ArticleUncheckedCreateWithoutDepositInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ArticleCreateOrConnectWithoutDepositInputSchema), z.lazy(() => ArticleCreateOrConnectWithoutDepositInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ArticleUpsertWithWhereUniqueWithoutDepositInputSchema), z.lazy(() => ArticleUpsertWithWhereUniqueWithoutDepositInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ArticleCreateManyDepositInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ArticleUpdateWithWhereUniqueWithoutDepositInputSchema), z.lazy(() => ArticleUpdateWithWhereUniqueWithoutDepositInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ArticleUpdateManyWithWhereWithoutDepositInputSchema), z.lazy(() => ArticleUpdateManyWithWhereWithoutDepositInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ArticleScalarWhereInputSchema), z.lazy(() => ArticleScalarWhereInputSchema).array() ]).optional(),
});

export const ArticleUncheckedUpdateManyWithoutDepositNestedInputSchema: z.ZodType<Prisma.ArticleUncheckedUpdateManyWithoutDepositNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ArticleCreateWithoutDepositInputSchema), z.lazy(() => ArticleCreateWithoutDepositInputSchema).array(), z.lazy(() => ArticleUncheckedCreateWithoutDepositInputSchema), z.lazy(() => ArticleUncheckedCreateWithoutDepositInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ArticleCreateOrConnectWithoutDepositInputSchema), z.lazy(() => ArticleCreateOrConnectWithoutDepositInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ArticleUpsertWithWhereUniqueWithoutDepositInputSchema), z.lazy(() => ArticleUpsertWithWhereUniqueWithoutDepositInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ArticleCreateManyDepositInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ArticleUpdateWithWhereUniqueWithoutDepositInputSchema), z.lazy(() => ArticleUpdateWithWhereUniqueWithoutDepositInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ArticleUpdateManyWithWhereWithoutDepositInputSchema), z.lazy(() => ArticleUpdateManyWithWhereWithoutDepositInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ArticleScalarWhereInputSchema), z.lazy(() => ArticleScalarWhereInputSchema).array() ]).optional(),
});

export const EventCreateNestedOneWithoutSalesInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutSalesInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutSalesInputSchema), z.lazy(() => EventUncheckedCreateWithoutSalesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutSalesInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
});

export const UserCreateNestedOneWithoutSalesInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutSalesInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutSalesInputSchema), z.lazy(() => UserUncheckedCreateWithoutSalesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSalesInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const WorkstationCreateNestedOneWithoutSalesInputSchema: z.ZodType<Prisma.WorkstationCreateNestedOneWithoutSalesInput> = z.strictObject({
  create: z.union([ z.lazy(() => WorkstationCreateWithoutSalesInputSchema), z.lazy(() => WorkstationUncheckedCreateWithoutSalesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => WorkstationCreateOrConnectWithoutSalesInputSchema).optional(),
  connect: z.lazy(() => WorkstationWhereUniqueInputSchema).optional(),
});

export const CheckoutCreateNestedOneWithoutSalesInputSchema: z.ZodType<Prisma.CheckoutCreateNestedOneWithoutSalesInput> = z.strictObject({
  create: z.union([ z.lazy(() => CheckoutCreateWithoutSalesInputSchema), z.lazy(() => CheckoutUncheckedCreateWithoutSalesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CheckoutCreateOrConnectWithoutSalesInputSchema).optional(),
  connect: z.lazy(() => CheckoutWhereUniqueInputSchema).optional(),
});

export const ArticleCreateNestedManyWithoutSaleInputSchema: z.ZodType<Prisma.ArticleCreateNestedManyWithoutSaleInput> = z.strictObject({
  create: z.union([ z.lazy(() => ArticleCreateWithoutSaleInputSchema), z.lazy(() => ArticleCreateWithoutSaleInputSchema).array(), z.lazy(() => ArticleUncheckedCreateWithoutSaleInputSchema), z.lazy(() => ArticleUncheckedCreateWithoutSaleInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ArticleCreateOrConnectWithoutSaleInputSchema), z.lazy(() => ArticleCreateOrConnectWithoutSaleInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ArticleCreateManySaleInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
});

export const CashTransactionCreateNestedManyWithoutSaleInputSchema: z.ZodType<Prisma.CashTransactionCreateNestedManyWithoutSaleInput> = z.strictObject({
  create: z.union([ z.lazy(() => CashTransactionCreateWithoutSaleInputSchema), z.lazy(() => CashTransactionCreateWithoutSaleInputSchema).array(), z.lazy(() => CashTransactionUncheckedCreateWithoutSaleInputSchema), z.lazy(() => CashTransactionUncheckedCreateWithoutSaleInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CashTransactionCreateOrConnectWithoutSaleInputSchema), z.lazy(() => CashTransactionCreateOrConnectWithoutSaleInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CashTransactionCreateManySaleInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CashTransactionWhereUniqueInputSchema), z.lazy(() => CashTransactionWhereUniqueInputSchema).array() ]).optional(),
});

export const ArticleUncheckedCreateNestedManyWithoutSaleInputSchema: z.ZodType<Prisma.ArticleUncheckedCreateNestedManyWithoutSaleInput> = z.strictObject({
  create: z.union([ z.lazy(() => ArticleCreateWithoutSaleInputSchema), z.lazy(() => ArticleCreateWithoutSaleInputSchema).array(), z.lazy(() => ArticleUncheckedCreateWithoutSaleInputSchema), z.lazy(() => ArticleUncheckedCreateWithoutSaleInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ArticleCreateOrConnectWithoutSaleInputSchema), z.lazy(() => ArticleCreateOrConnectWithoutSaleInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ArticleCreateManySaleInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
});

export const CashTransactionUncheckedCreateNestedManyWithoutSaleInputSchema: z.ZodType<Prisma.CashTransactionUncheckedCreateNestedManyWithoutSaleInput> = z.strictObject({
  create: z.union([ z.lazy(() => CashTransactionCreateWithoutSaleInputSchema), z.lazy(() => CashTransactionCreateWithoutSaleInputSchema).array(), z.lazy(() => CashTransactionUncheckedCreateWithoutSaleInputSchema), z.lazy(() => CashTransactionUncheckedCreateWithoutSaleInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CashTransactionCreateOrConnectWithoutSaleInputSchema), z.lazy(() => CashTransactionCreateOrConnectWithoutSaleInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CashTransactionCreateManySaleInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CashTransactionWhereUniqueInputSchema), z.lazy(() => CashTransactionWhereUniqueInputSchema).array() ]).optional(),
});

export const EventUpdateOneRequiredWithoutSalesNestedInputSchema: z.ZodType<Prisma.EventUpdateOneRequiredWithoutSalesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutSalesInputSchema), z.lazy(() => EventUncheckedCreateWithoutSalesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutSalesInputSchema).optional(),
  upsert: z.lazy(() => EventUpsertWithoutSalesInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => EventUpdateToOneWithWhereWithoutSalesInputSchema), z.lazy(() => EventUpdateWithoutSalesInputSchema), z.lazy(() => EventUncheckedUpdateWithoutSalesInputSchema) ]).optional(),
});

export const UserUpdateOneRequiredWithoutSalesNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutSalesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutSalesInputSchema), z.lazy(() => UserUncheckedCreateWithoutSalesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSalesInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutSalesInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutSalesInputSchema), z.lazy(() => UserUpdateWithoutSalesInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSalesInputSchema) ]).optional(),
});

export const WorkstationUpdateOneRequiredWithoutSalesNestedInputSchema: z.ZodType<Prisma.WorkstationUpdateOneRequiredWithoutSalesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => WorkstationCreateWithoutSalesInputSchema), z.lazy(() => WorkstationUncheckedCreateWithoutSalesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => WorkstationCreateOrConnectWithoutSalesInputSchema).optional(),
  upsert: z.lazy(() => WorkstationUpsertWithoutSalesInputSchema).optional(),
  connect: z.lazy(() => WorkstationWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => WorkstationUpdateToOneWithWhereWithoutSalesInputSchema), z.lazy(() => WorkstationUpdateWithoutSalesInputSchema), z.lazy(() => WorkstationUncheckedUpdateWithoutSalesInputSchema) ]).optional(),
});

export const CheckoutUpdateOneRequiredWithoutSalesNestedInputSchema: z.ZodType<Prisma.CheckoutUpdateOneRequiredWithoutSalesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CheckoutCreateWithoutSalesInputSchema), z.lazy(() => CheckoutUncheckedCreateWithoutSalesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CheckoutCreateOrConnectWithoutSalesInputSchema).optional(),
  upsert: z.lazy(() => CheckoutUpsertWithoutSalesInputSchema).optional(),
  connect: z.lazy(() => CheckoutWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => CheckoutUpdateToOneWithWhereWithoutSalesInputSchema), z.lazy(() => CheckoutUpdateWithoutSalesInputSchema), z.lazy(() => CheckoutUncheckedUpdateWithoutSalesInputSchema) ]).optional(),
});

export const ArticleUpdateManyWithoutSaleNestedInputSchema: z.ZodType<Prisma.ArticleUpdateManyWithoutSaleNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ArticleCreateWithoutSaleInputSchema), z.lazy(() => ArticleCreateWithoutSaleInputSchema).array(), z.lazy(() => ArticleUncheckedCreateWithoutSaleInputSchema), z.lazy(() => ArticleUncheckedCreateWithoutSaleInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ArticleCreateOrConnectWithoutSaleInputSchema), z.lazy(() => ArticleCreateOrConnectWithoutSaleInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ArticleUpsertWithWhereUniqueWithoutSaleInputSchema), z.lazy(() => ArticleUpsertWithWhereUniqueWithoutSaleInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ArticleCreateManySaleInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ArticleUpdateWithWhereUniqueWithoutSaleInputSchema), z.lazy(() => ArticleUpdateWithWhereUniqueWithoutSaleInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ArticleUpdateManyWithWhereWithoutSaleInputSchema), z.lazy(() => ArticleUpdateManyWithWhereWithoutSaleInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ArticleScalarWhereInputSchema), z.lazy(() => ArticleScalarWhereInputSchema).array() ]).optional(),
});

export const CashTransactionUpdateManyWithoutSaleNestedInputSchema: z.ZodType<Prisma.CashTransactionUpdateManyWithoutSaleNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CashTransactionCreateWithoutSaleInputSchema), z.lazy(() => CashTransactionCreateWithoutSaleInputSchema).array(), z.lazy(() => CashTransactionUncheckedCreateWithoutSaleInputSchema), z.lazy(() => CashTransactionUncheckedCreateWithoutSaleInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CashTransactionCreateOrConnectWithoutSaleInputSchema), z.lazy(() => CashTransactionCreateOrConnectWithoutSaleInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CashTransactionUpsertWithWhereUniqueWithoutSaleInputSchema), z.lazy(() => CashTransactionUpsertWithWhereUniqueWithoutSaleInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CashTransactionCreateManySaleInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CashTransactionWhereUniqueInputSchema), z.lazy(() => CashTransactionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CashTransactionWhereUniqueInputSchema), z.lazy(() => CashTransactionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CashTransactionWhereUniqueInputSchema), z.lazy(() => CashTransactionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CashTransactionWhereUniqueInputSchema), z.lazy(() => CashTransactionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CashTransactionUpdateWithWhereUniqueWithoutSaleInputSchema), z.lazy(() => CashTransactionUpdateWithWhereUniqueWithoutSaleInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CashTransactionUpdateManyWithWhereWithoutSaleInputSchema), z.lazy(() => CashTransactionUpdateManyWithWhereWithoutSaleInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CashTransactionScalarWhereInputSchema), z.lazy(() => CashTransactionScalarWhereInputSchema).array() ]).optional(),
});

export const ArticleUncheckedUpdateManyWithoutSaleNestedInputSchema: z.ZodType<Prisma.ArticleUncheckedUpdateManyWithoutSaleNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ArticleCreateWithoutSaleInputSchema), z.lazy(() => ArticleCreateWithoutSaleInputSchema).array(), z.lazy(() => ArticleUncheckedCreateWithoutSaleInputSchema), z.lazy(() => ArticleUncheckedCreateWithoutSaleInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ArticleCreateOrConnectWithoutSaleInputSchema), z.lazy(() => ArticleCreateOrConnectWithoutSaleInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ArticleUpsertWithWhereUniqueWithoutSaleInputSchema), z.lazy(() => ArticleUpsertWithWhereUniqueWithoutSaleInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ArticleCreateManySaleInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ArticleUpdateWithWhereUniqueWithoutSaleInputSchema), z.lazy(() => ArticleUpdateWithWhereUniqueWithoutSaleInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ArticleUpdateManyWithWhereWithoutSaleInputSchema), z.lazy(() => ArticleUpdateManyWithWhereWithoutSaleInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ArticleScalarWhereInputSchema), z.lazy(() => ArticleScalarWhereInputSchema).array() ]).optional(),
});

export const CashTransactionUncheckedUpdateManyWithoutSaleNestedInputSchema: z.ZodType<Prisma.CashTransactionUncheckedUpdateManyWithoutSaleNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CashTransactionCreateWithoutSaleInputSchema), z.lazy(() => CashTransactionCreateWithoutSaleInputSchema).array(), z.lazy(() => CashTransactionUncheckedCreateWithoutSaleInputSchema), z.lazy(() => CashTransactionUncheckedCreateWithoutSaleInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CashTransactionCreateOrConnectWithoutSaleInputSchema), z.lazy(() => CashTransactionCreateOrConnectWithoutSaleInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CashTransactionUpsertWithWhereUniqueWithoutSaleInputSchema), z.lazy(() => CashTransactionUpsertWithWhereUniqueWithoutSaleInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CashTransactionCreateManySaleInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CashTransactionWhereUniqueInputSchema), z.lazy(() => CashTransactionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CashTransactionWhereUniqueInputSchema), z.lazy(() => CashTransactionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CashTransactionWhereUniqueInputSchema), z.lazy(() => CashTransactionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CashTransactionWhereUniqueInputSchema), z.lazy(() => CashTransactionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CashTransactionUpdateWithWhereUniqueWithoutSaleInputSchema), z.lazy(() => CashTransactionUpdateWithWhereUniqueWithoutSaleInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CashTransactionUpdateManyWithWhereWithoutSaleInputSchema), z.lazy(() => CashTransactionUpdateManyWithWhereWithoutSaleInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CashTransactionScalarWhereInputSchema), z.lazy(() => CashTransactionScalarWhereInputSchema).array() ]).optional(),
});

export const SaleCreateNestedOneWithoutCashTransactionsInputSchema: z.ZodType<Prisma.SaleCreateNestedOneWithoutCashTransactionsInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutCashTransactionsInputSchema), z.lazy(() => SaleUncheckedCreateWithoutCashTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SaleCreateOrConnectWithoutCashTransactionsInputSchema).optional(),
  connect: z.lazy(() => SaleWhereUniqueInputSchema).optional(),
});

export const SaleUpdateOneRequiredWithoutCashTransactionsNestedInputSchema: z.ZodType<Prisma.SaleUpdateOneRequiredWithoutCashTransactionsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutCashTransactionsInputSchema), z.lazy(() => SaleUncheckedCreateWithoutCashTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SaleCreateOrConnectWithoutCashTransactionsInputSchema).optional(),
  upsert: z.lazy(() => SaleUpsertWithoutCashTransactionsInputSchema).optional(),
  connect: z.lazy(() => SaleWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => SaleUpdateToOneWithWhereWithoutCashTransactionsInputSchema), z.lazy(() => SaleUpdateWithoutCashTransactionsInputSchema), z.lazy(() => SaleUncheckedUpdateWithoutCashTransactionsInputSchema) ]).optional(),
});

export const DepositCreateNestedOneWithoutArticlesInputSchema: z.ZodType<Prisma.DepositCreateNestedOneWithoutArticlesInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutArticlesInputSchema), z.lazy(() => DepositUncheckedCreateWithoutArticlesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => DepositCreateOrConnectWithoutArticlesInputSchema).optional(),
  connect: z.lazy(() => DepositWhereUniqueInputSchema).optional(),
});

export const SaleCreateNestedOneWithoutArticlesInputSchema: z.ZodType<Prisma.SaleCreateNestedOneWithoutArticlesInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutArticlesInputSchema), z.lazy(() => SaleUncheckedCreateWithoutArticlesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SaleCreateOrConnectWithoutArticlesInputSchema).optional(),
  connect: z.lazy(() => SaleWhereUniqueInputSchema).optional(),
});

export const NullableDecimalFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDecimalFieldUpdateOperationsInput> = z.strictObject({
  set: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  increment: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  decrement: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  multiply: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  divide: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
});

export const DepositUpdateOneWithoutArticlesNestedInputSchema: z.ZodType<Prisma.DepositUpdateOneWithoutArticlesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutArticlesInputSchema), z.lazy(() => DepositUncheckedCreateWithoutArticlesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => DepositCreateOrConnectWithoutArticlesInputSchema).optional(),
  upsert: z.lazy(() => DepositUpsertWithoutArticlesInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => DepositWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => DepositWhereInputSchema) ]).optional(),
  connect: z.lazy(() => DepositWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => DepositUpdateToOneWithWhereWithoutArticlesInputSchema), z.lazy(() => DepositUpdateWithoutArticlesInputSchema), z.lazy(() => DepositUncheckedUpdateWithoutArticlesInputSchema) ]).optional(),
});

export const SaleUpdateOneWithoutArticlesNestedInputSchema: z.ZodType<Prisma.SaleUpdateOneWithoutArticlesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutArticlesInputSchema), z.lazy(() => SaleUncheckedCreateWithoutArticlesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SaleCreateOrConnectWithoutArticlesInputSchema).optional(),
  upsert: z.lazy(() => SaleUpsertWithoutArticlesInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => SaleWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => SaleWhereInputSchema) ]).optional(),
  connect: z.lazy(() => SaleWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => SaleUpdateToOneWithWhereWithoutArticlesInputSchema), z.lazy(() => SaleUpdateWithoutArticlesInputSchema), z.lazy(() => SaleUncheckedUpdateWithoutArticlesInputSchema) ]).optional(),
});

export const NestedUuidFilterSchema: z.ZodType<Prisma.NestedUuidFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedUuidFilterSchema) ]).optional(),
});

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
});

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const NestedDateTimeNullableFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export const NestedDateTimeFilterSchema: z.ZodType<Prisma.NestedDateTimeFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
});

export const NestedUuidWithAggregatesFilterSchema: z.ZodType<Prisma.NestedUuidWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedUuidWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const NestedIntWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional(),
});

export const NestedFloatFilterSchema: z.ZodType<Prisma.NestedFloatFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatFilterSchema) ]).optional(),
});

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
});

export const NestedDateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
});

export const NestedDateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
});

export const NestedDecimalFilterSchema: z.ZodType<Prisma.NestedDecimalFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  lt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalFilterSchema) ]).optional(),
});

export const NestedDecimalWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDecimalWithAggregatesFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  lt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _sum: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _min: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _max: z.lazy(() => NestedDecimalFilterSchema).optional(),
});

export const NestedEnumContributionStatusFilterSchema: z.ZodType<Prisma.NestedEnumContributionStatusFilter> = z.strictObject({
  equals: z.lazy(() => ContributionStatusSchema).optional(),
  in: z.lazy(() => ContributionStatusSchema).array().optional(),
  notIn: z.lazy(() => ContributionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => NestedEnumContributionStatusFilterSchema) ]).optional(),
});

export const NestedEnumDepotStatusFilterSchema: z.ZodType<Prisma.NestedEnumDepotStatusFilter> = z.strictObject({
  equals: z.lazy(() => DepotStatusSchema).optional(),
  in: z.lazy(() => DepotStatusSchema).array().optional(),
  notIn: z.lazy(() => DepotStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => NestedEnumDepotStatusFilterSchema) ]).optional(),
});

export const NestedEnumContributionStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumContributionStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => ContributionStatusSchema).optional(),
  in: z.lazy(() => ContributionStatusSchema).array().optional(),
  notIn: z.lazy(() => ContributionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => NestedEnumContributionStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumContributionStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumContributionStatusFilterSchema).optional(),
});

export const NestedEnumDepotStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumDepotStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => DepotStatusSchema).optional(),
  in: z.lazy(() => DepotStatusSchema).array().optional(),
  notIn: z.lazy(() => DepotStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => NestedEnumDepotStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumDepotStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumDepotStatusFilterSchema).optional(),
});

export const NestedDecimalNullableFilterSchema: z.ZodType<Prisma.NestedDecimalNullableFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  lt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalNullableFilterSchema) ]).optional().nullable(),
});

export const NestedUuidNullableFilterSchema: z.ZodType<Prisma.NestedUuidNullableFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedUuidNullableFilterSchema) ]).optional().nullable(),
});

export const NestedDecimalNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDecimalNullableWithAggregatesFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  lt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
});

export const NestedUuidNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedUuidNullableWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedUuidNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const SaleCreateWithoutEventInputSchema: z.ZodType<Prisma.SaleCreateWithoutEventInput> = z.strictObject({
  id: z.uuid().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  user: z.lazy(() => UserCreateNestedOneWithoutSalesInputSchema),
  workstation: z.lazy(() => WorkstationCreateNestedOneWithoutSalesInputSchema),
  checkout: z.lazy(() => CheckoutCreateNestedOneWithoutSalesInputSchema),
  articles: z.lazy(() => ArticleCreateNestedManyWithoutSaleInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionCreateNestedManyWithoutSaleInputSchema).optional(),
});

export const SaleUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.SaleUncheckedCreateWithoutEventInput> = z.strictObject({
  id: z.uuid().optional(),
  userId: z.string(),
  workstationId: z.string(),
  checkoutId: z.string(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedCreateNestedManyWithoutSaleInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionUncheckedCreateNestedManyWithoutSaleInputSchema).optional(),
});

export const SaleCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.SaleCreateOrConnectWithoutEventInput> = z.strictObject({
  where: z.lazy(() => SaleWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SaleCreateWithoutEventInputSchema), z.lazy(() => SaleUncheckedCreateWithoutEventInputSchema) ]),
});

export const SaleCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.SaleCreateManyEventInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => SaleCreateManyEventInputSchema), z.lazy(() => SaleCreateManyEventInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const DepositCreateWithoutEventInputSchema: z.ZodType<Prisma.DepositCreateWithoutEventInput> = z.strictObject({
  id: z.uuid().optional(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  status: z.lazy(() => DepotStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  user: z.lazy(() => UserCreateNestedOneWithoutDepotsInputSchema),
  workstation: z.lazy(() => WorkstationCreateNestedOneWithoutDepositsInputSchema),
  articles: z.lazy(() => ArticleCreateNestedManyWithoutDepositInputSchema).optional(),
});

export const DepositUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.DepositUncheckedCreateWithoutEventInput> = z.strictObject({
  id: z.uuid().optional(),
  userId: z.string(),
  workstationId: z.string(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  status: z.lazy(() => DepotStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedCreateNestedManyWithoutDepositInputSchema).optional(),
});

export const DepositCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.DepositCreateOrConnectWithoutEventInput> = z.strictObject({
  where: z.lazy(() => DepositWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => DepositCreateWithoutEventInputSchema), z.lazy(() => DepositUncheckedCreateWithoutEventInputSchema) ]),
});

export const DepositCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.DepositCreateManyEventInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => DepositCreateManyEventInputSchema), z.lazy(() => DepositCreateManyEventInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const WorkstationCreateWithoutEventInputSchema: z.ZodType<Prisma.WorkstationCreateWithoutEventInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  increment_start: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleCreateNestedManyWithoutWorkstationInputSchema).optional(),
  deposits: z.lazy(() => DepositCreateNestedManyWithoutWorkstationInputSchema).optional(),
});

export const WorkstationUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.WorkstationUncheckedCreateWithoutEventInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  increment_start: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleUncheckedCreateNestedManyWithoutWorkstationInputSchema).optional(),
  deposits: z.lazy(() => DepositUncheckedCreateNestedManyWithoutWorkstationInputSchema).optional(),
});

export const WorkstationCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.WorkstationCreateOrConnectWithoutEventInput> = z.strictObject({
  where: z.lazy(() => WorkstationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => WorkstationCreateWithoutEventInputSchema), z.lazy(() => WorkstationUncheckedCreateWithoutEventInputSchema) ]),
});

export const WorkstationCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.WorkstationCreateManyEventInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => WorkstationCreateManyEventInputSchema), z.lazy(() => WorkstationCreateManyEventInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const CheckoutCreateWithoutEventInputSchema: z.ZodType<Prisma.CheckoutCreateWithoutEventInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  initialCash: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  currentCash: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleCreateNestedManyWithoutCheckoutInputSchema).optional(),
});

export const CheckoutUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.CheckoutUncheckedCreateWithoutEventInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  initialCash: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  currentCash: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleUncheckedCreateNestedManyWithoutCheckoutInputSchema).optional(),
});

export const CheckoutCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.CheckoutCreateOrConnectWithoutEventInput> = z.strictObject({
  where: z.lazy(() => CheckoutWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CheckoutCreateWithoutEventInputSchema), z.lazy(() => CheckoutUncheckedCreateWithoutEventInputSchema) ]),
});

export const CheckoutCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.CheckoutCreateManyEventInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => CheckoutCreateManyEventInputSchema), z.lazy(() => CheckoutCreateManyEventInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const SaleUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.SaleUpsertWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => SaleWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SaleUpdateWithoutEventInputSchema), z.lazy(() => SaleUncheckedUpdateWithoutEventInputSchema) ]),
  create: z.union([ z.lazy(() => SaleCreateWithoutEventInputSchema), z.lazy(() => SaleUncheckedCreateWithoutEventInputSchema) ]),
});

export const SaleUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.SaleUpdateWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => SaleWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SaleUpdateWithoutEventInputSchema), z.lazy(() => SaleUncheckedUpdateWithoutEventInputSchema) ]),
});

export const SaleUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.SaleUpdateManyWithWhereWithoutEventInput> = z.strictObject({
  where: z.lazy(() => SaleScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SaleUpdateManyMutationInputSchema), z.lazy(() => SaleUncheckedUpdateManyWithoutEventInputSchema) ]),
});

export const SaleScalarWhereInputSchema: z.ZodType<Prisma.SaleScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SaleScalarWhereInputSchema), z.lazy(() => SaleScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SaleScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SaleScalarWhereInputSchema), z.lazy(() => SaleScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  workstationId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  checkoutId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  cardAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  cashAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  checkAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  totalAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  postalCode: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  saleAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const DepositUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.DepositUpsertWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => DepositWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => DepositUpdateWithoutEventInputSchema), z.lazy(() => DepositUncheckedUpdateWithoutEventInputSchema) ]),
  create: z.union([ z.lazy(() => DepositCreateWithoutEventInputSchema), z.lazy(() => DepositUncheckedCreateWithoutEventInputSchema) ]),
});

export const DepositUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.DepositUpdateWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => DepositWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => DepositUpdateWithoutEventInputSchema), z.lazy(() => DepositUncheckedUpdateWithoutEventInputSchema) ]),
});

export const DepositUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.DepositUpdateManyWithWhereWithoutEventInput> = z.strictObject({
  where: z.lazy(() => DepositScalarWhereInputSchema),
  data: z.union([ z.lazy(() => DepositUpdateManyMutationInputSchema), z.lazy(() => DepositUncheckedUpdateManyWithoutEventInputSchema) ]),
});

export const DepositScalarWhereInputSchema: z.ZodType<Prisma.DepositScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => DepositScalarWhereInputSchema), z.lazy(() => DepositScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => DepositScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DepositScalarWhereInputSchema), z.lazy(() => DepositScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  workstationId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  contributionStatus: z.union([ z.lazy(() => EnumContributionStatusFilterSchema), z.lazy(() => ContributionStatusSchema) ]).optional(),
  status: z.union([ z.lazy(() => EnumDepotStatusFilterSchema), z.lazy(() => DepotStatusSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const WorkstationUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.WorkstationUpsertWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => WorkstationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => WorkstationUpdateWithoutEventInputSchema), z.lazy(() => WorkstationUncheckedUpdateWithoutEventInputSchema) ]),
  create: z.union([ z.lazy(() => WorkstationCreateWithoutEventInputSchema), z.lazy(() => WorkstationUncheckedCreateWithoutEventInputSchema) ]),
});

export const WorkstationUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.WorkstationUpdateWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => WorkstationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => WorkstationUpdateWithoutEventInputSchema), z.lazy(() => WorkstationUncheckedUpdateWithoutEventInputSchema) ]),
});

export const WorkstationUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.WorkstationUpdateManyWithWhereWithoutEventInput> = z.strictObject({
  where: z.lazy(() => WorkstationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => WorkstationUpdateManyMutationInputSchema), z.lazy(() => WorkstationUncheckedUpdateManyWithoutEventInputSchema) ]),
});

export const WorkstationScalarWhereInputSchema: z.ZodType<Prisma.WorkstationScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => WorkstationScalarWhereInputSchema), z.lazy(() => WorkstationScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => WorkstationScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WorkstationScalarWhereInputSchema), z.lazy(() => WorkstationScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  increment_start: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const CheckoutUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.CheckoutUpsertWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => CheckoutWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CheckoutUpdateWithoutEventInputSchema), z.lazy(() => CheckoutUncheckedUpdateWithoutEventInputSchema) ]),
  create: z.union([ z.lazy(() => CheckoutCreateWithoutEventInputSchema), z.lazy(() => CheckoutUncheckedCreateWithoutEventInputSchema) ]),
});

export const CheckoutUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.CheckoutUpdateWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => CheckoutWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CheckoutUpdateWithoutEventInputSchema), z.lazy(() => CheckoutUncheckedUpdateWithoutEventInputSchema) ]),
});

export const CheckoutUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.CheckoutUpdateManyWithWhereWithoutEventInput> = z.strictObject({
  where: z.lazy(() => CheckoutScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CheckoutUpdateManyMutationInputSchema), z.lazy(() => CheckoutUncheckedUpdateManyWithoutEventInputSchema) ]),
});

export const CheckoutScalarWhereInputSchema: z.ZodType<Prisma.CheckoutScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => CheckoutScalarWhereInputSchema), z.lazy(() => CheckoutScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CheckoutScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CheckoutScalarWhereInputSchema), z.lazy(() => CheckoutScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  initialCash: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  currentCash: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  eventId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const EventCreateWithoutCheckoutsInputSchema: z.ZodType<Prisma.EventCreateWithoutCheckoutsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  year: z.number().int(),
  description: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleCreateNestedManyWithoutEventInputSchema).optional(),
  deposits: z.lazy(() => DepositCreateNestedManyWithoutEventInputSchema).optional(),
  workstations: z.lazy(() => WorkstationCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUncheckedCreateWithoutCheckoutsInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutCheckoutsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  year: z.number().int(),
  description: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  deposits: z.lazy(() => DepositUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  workstations: z.lazy(() => WorkstationUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventCreateOrConnectWithoutCheckoutsInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutCheckoutsInput> = z.strictObject({
  where: z.lazy(() => EventWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => EventCreateWithoutCheckoutsInputSchema), z.lazy(() => EventUncheckedCreateWithoutCheckoutsInputSchema) ]),
});

export const SaleCreateWithoutCheckoutInputSchema: z.ZodType<Prisma.SaleCreateWithoutCheckoutInput> = z.strictObject({
  id: z.uuid().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  event: z.lazy(() => EventCreateNestedOneWithoutSalesInputSchema),
  user: z.lazy(() => UserCreateNestedOneWithoutSalesInputSchema),
  workstation: z.lazy(() => WorkstationCreateNestedOneWithoutSalesInputSchema),
  articles: z.lazy(() => ArticleCreateNestedManyWithoutSaleInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionCreateNestedManyWithoutSaleInputSchema).optional(),
});

export const SaleUncheckedCreateWithoutCheckoutInputSchema: z.ZodType<Prisma.SaleUncheckedCreateWithoutCheckoutInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  userId: z.string(),
  workstationId: z.string(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedCreateNestedManyWithoutSaleInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionUncheckedCreateNestedManyWithoutSaleInputSchema).optional(),
});

export const SaleCreateOrConnectWithoutCheckoutInputSchema: z.ZodType<Prisma.SaleCreateOrConnectWithoutCheckoutInput> = z.strictObject({
  where: z.lazy(() => SaleWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SaleCreateWithoutCheckoutInputSchema), z.lazy(() => SaleUncheckedCreateWithoutCheckoutInputSchema) ]),
});

export const SaleCreateManyCheckoutInputEnvelopeSchema: z.ZodType<Prisma.SaleCreateManyCheckoutInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => SaleCreateManyCheckoutInputSchema), z.lazy(() => SaleCreateManyCheckoutInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const EventUpsertWithoutCheckoutsInputSchema: z.ZodType<Prisma.EventUpsertWithoutCheckoutsInput> = z.strictObject({
  update: z.union([ z.lazy(() => EventUpdateWithoutCheckoutsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutCheckoutsInputSchema) ]),
  create: z.union([ z.lazy(() => EventCreateWithoutCheckoutsInputSchema), z.lazy(() => EventUncheckedCreateWithoutCheckoutsInputSchema) ]),
  where: z.lazy(() => EventWhereInputSchema).optional(),
});

export const EventUpdateToOneWithWhereWithoutCheckoutsInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutCheckoutsInput> = z.strictObject({
  where: z.lazy(() => EventWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => EventUpdateWithoutCheckoutsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutCheckoutsInputSchema) ]),
});

export const EventUpdateWithoutCheckoutsInputSchema: z.ZodType<Prisma.EventUpdateWithoutCheckoutsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUpdateManyWithoutEventNestedInputSchema).optional(),
  deposits: z.lazy(() => DepositUpdateManyWithoutEventNestedInputSchema).optional(),
  workstations: z.lazy(() => WorkstationUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventUncheckedUpdateWithoutCheckoutsInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutCheckoutsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  deposits: z.lazy(() => DepositUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  workstations: z.lazy(() => WorkstationUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const SaleUpsertWithWhereUniqueWithoutCheckoutInputSchema: z.ZodType<Prisma.SaleUpsertWithWhereUniqueWithoutCheckoutInput> = z.strictObject({
  where: z.lazy(() => SaleWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SaleUpdateWithoutCheckoutInputSchema), z.lazy(() => SaleUncheckedUpdateWithoutCheckoutInputSchema) ]),
  create: z.union([ z.lazy(() => SaleCreateWithoutCheckoutInputSchema), z.lazy(() => SaleUncheckedCreateWithoutCheckoutInputSchema) ]),
});

export const SaleUpdateWithWhereUniqueWithoutCheckoutInputSchema: z.ZodType<Prisma.SaleUpdateWithWhereUniqueWithoutCheckoutInput> = z.strictObject({
  where: z.lazy(() => SaleWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SaleUpdateWithoutCheckoutInputSchema), z.lazy(() => SaleUncheckedUpdateWithoutCheckoutInputSchema) ]),
});

export const SaleUpdateManyWithWhereWithoutCheckoutInputSchema: z.ZodType<Prisma.SaleUpdateManyWithWhereWithoutCheckoutInput> = z.strictObject({
  where: z.lazy(() => SaleScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SaleUpdateManyMutationInputSchema), z.lazy(() => SaleUncheckedUpdateManyWithoutCheckoutInputSchema) ]),
});

export const EventCreateWithoutWorkstationsInputSchema: z.ZodType<Prisma.EventCreateWithoutWorkstationsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  year: z.number().int(),
  description: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleCreateNestedManyWithoutEventInputSchema).optional(),
  deposits: z.lazy(() => DepositCreateNestedManyWithoutEventInputSchema).optional(),
  checkouts: z.lazy(() => CheckoutCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUncheckedCreateWithoutWorkstationsInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutWorkstationsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  year: z.number().int(),
  description: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  deposits: z.lazy(() => DepositUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  checkouts: z.lazy(() => CheckoutUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventCreateOrConnectWithoutWorkstationsInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutWorkstationsInput> = z.strictObject({
  where: z.lazy(() => EventWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => EventCreateWithoutWorkstationsInputSchema), z.lazy(() => EventUncheckedCreateWithoutWorkstationsInputSchema) ]),
});

export const SaleCreateWithoutWorkstationInputSchema: z.ZodType<Prisma.SaleCreateWithoutWorkstationInput> = z.strictObject({
  id: z.uuid().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  event: z.lazy(() => EventCreateNestedOneWithoutSalesInputSchema),
  user: z.lazy(() => UserCreateNestedOneWithoutSalesInputSchema),
  checkout: z.lazy(() => CheckoutCreateNestedOneWithoutSalesInputSchema),
  articles: z.lazy(() => ArticleCreateNestedManyWithoutSaleInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionCreateNestedManyWithoutSaleInputSchema).optional(),
});

export const SaleUncheckedCreateWithoutWorkstationInputSchema: z.ZodType<Prisma.SaleUncheckedCreateWithoutWorkstationInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  userId: z.string(),
  checkoutId: z.string(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedCreateNestedManyWithoutSaleInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionUncheckedCreateNestedManyWithoutSaleInputSchema).optional(),
});

export const SaleCreateOrConnectWithoutWorkstationInputSchema: z.ZodType<Prisma.SaleCreateOrConnectWithoutWorkstationInput> = z.strictObject({
  where: z.lazy(() => SaleWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SaleCreateWithoutWorkstationInputSchema), z.lazy(() => SaleUncheckedCreateWithoutWorkstationInputSchema) ]),
});

export const SaleCreateManyWorkstationInputEnvelopeSchema: z.ZodType<Prisma.SaleCreateManyWorkstationInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => SaleCreateManyWorkstationInputSchema), z.lazy(() => SaleCreateManyWorkstationInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const DepositCreateWithoutWorkstationInputSchema: z.ZodType<Prisma.DepositCreateWithoutWorkstationInput> = z.strictObject({
  id: z.uuid().optional(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  status: z.lazy(() => DepotStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  event: z.lazy(() => EventCreateNestedOneWithoutDepositsInputSchema),
  user: z.lazy(() => UserCreateNestedOneWithoutDepotsInputSchema),
  articles: z.lazy(() => ArticleCreateNestedManyWithoutDepositInputSchema).optional(),
});

export const DepositUncheckedCreateWithoutWorkstationInputSchema: z.ZodType<Prisma.DepositUncheckedCreateWithoutWorkstationInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  userId: z.string(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  status: z.lazy(() => DepotStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedCreateNestedManyWithoutDepositInputSchema).optional(),
});

export const DepositCreateOrConnectWithoutWorkstationInputSchema: z.ZodType<Prisma.DepositCreateOrConnectWithoutWorkstationInput> = z.strictObject({
  where: z.lazy(() => DepositWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => DepositCreateWithoutWorkstationInputSchema), z.lazy(() => DepositUncheckedCreateWithoutWorkstationInputSchema) ]),
});

export const DepositCreateManyWorkstationInputEnvelopeSchema: z.ZodType<Prisma.DepositCreateManyWorkstationInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => DepositCreateManyWorkstationInputSchema), z.lazy(() => DepositCreateManyWorkstationInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const EventUpsertWithoutWorkstationsInputSchema: z.ZodType<Prisma.EventUpsertWithoutWorkstationsInput> = z.strictObject({
  update: z.union([ z.lazy(() => EventUpdateWithoutWorkstationsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutWorkstationsInputSchema) ]),
  create: z.union([ z.lazy(() => EventCreateWithoutWorkstationsInputSchema), z.lazy(() => EventUncheckedCreateWithoutWorkstationsInputSchema) ]),
  where: z.lazy(() => EventWhereInputSchema).optional(),
});

export const EventUpdateToOneWithWhereWithoutWorkstationsInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutWorkstationsInput> = z.strictObject({
  where: z.lazy(() => EventWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => EventUpdateWithoutWorkstationsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutWorkstationsInputSchema) ]),
});

export const EventUpdateWithoutWorkstationsInputSchema: z.ZodType<Prisma.EventUpdateWithoutWorkstationsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUpdateManyWithoutEventNestedInputSchema).optional(),
  deposits: z.lazy(() => DepositUpdateManyWithoutEventNestedInputSchema).optional(),
  checkouts: z.lazy(() => CheckoutUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventUncheckedUpdateWithoutWorkstationsInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutWorkstationsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  deposits: z.lazy(() => DepositUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  checkouts: z.lazy(() => CheckoutUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const SaleUpsertWithWhereUniqueWithoutWorkstationInputSchema: z.ZodType<Prisma.SaleUpsertWithWhereUniqueWithoutWorkstationInput> = z.strictObject({
  where: z.lazy(() => SaleWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SaleUpdateWithoutWorkstationInputSchema), z.lazy(() => SaleUncheckedUpdateWithoutWorkstationInputSchema) ]),
  create: z.union([ z.lazy(() => SaleCreateWithoutWorkstationInputSchema), z.lazy(() => SaleUncheckedCreateWithoutWorkstationInputSchema) ]),
});

export const SaleUpdateWithWhereUniqueWithoutWorkstationInputSchema: z.ZodType<Prisma.SaleUpdateWithWhereUniqueWithoutWorkstationInput> = z.strictObject({
  where: z.lazy(() => SaleWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SaleUpdateWithoutWorkstationInputSchema), z.lazy(() => SaleUncheckedUpdateWithoutWorkstationInputSchema) ]),
});

export const SaleUpdateManyWithWhereWithoutWorkstationInputSchema: z.ZodType<Prisma.SaleUpdateManyWithWhereWithoutWorkstationInput> = z.strictObject({
  where: z.lazy(() => SaleScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SaleUpdateManyMutationInputSchema), z.lazy(() => SaleUncheckedUpdateManyWithoutWorkstationInputSchema) ]),
});

export const DepositUpsertWithWhereUniqueWithoutWorkstationInputSchema: z.ZodType<Prisma.DepositUpsertWithWhereUniqueWithoutWorkstationInput> = z.strictObject({
  where: z.lazy(() => DepositWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => DepositUpdateWithoutWorkstationInputSchema), z.lazy(() => DepositUncheckedUpdateWithoutWorkstationInputSchema) ]),
  create: z.union([ z.lazy(() => DepositCreateWithoutWorkstationInputSchema), z.lazy(() => DepositUncheckedCreateWithoutWorkstationInputSchema) ]),
});

export const DepositUpdateWithWhereUniqueWithoutWorkstationInputSchema: z.ZodType<Prisma.DepositUpdateWithWhereUniqueWithoutWorkstationInput> = z.strictObject({
  where: z.lazy(() => DepositWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => DepositUpdateWithoutWorkstationInputSchema), z.lazy(() => DepositUncheckedUpdateWithoutWorkstationInputSchema) ]),
});

export const DepositUpdateManyWithWhereWithoutWorkstationInputSchema: z.ZodType<Prisma.DepositUpdateManyWithWhereWithoutWorkstationInput> = z.strictObject({
  where: z.lazy(() => DepositScalarWhereInputSchema),
  data: z.union([ z.lazy(() => DepositUpdateManyMutationInputSchema), z.lazy(() => DepositUncheckedUpdateManyWithoutWorkstationInputSchema) ]),
});

export const SaleCreateWithoutUserInputSchema: z.ZodType<Prisma.SaleCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  event: z.lazy(() => EventCreateNestedOneWithoutSalesInputSchema),
  workstation: z.lazy(() => WorkstationCreateNestedOneWithoutSalesInputSchema),
  checkout: z.lazy(() => CheckoutCreateNestedOneWithoutSalesInputSchema),
  articles: z.lazy(() => ArticleCreateNestedManyWithoutSaleInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionCreateNestedManyWithoutSaleInputSchema).optional(),
});

export const SaleUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.SaleUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  workstationId: z.string(),
  checkoutId: z.string(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedCreateNestedManyWithoutSaleInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionUncheckedCreateNestedManyWithoutSaleInputSchema).optional(),
});

export const SaleCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.SaleCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SaleWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SaleCreateWithoutUserInputSchema), z.lazy(() => SaleUncheckedCreateWithoutUserInputSchema) ]),
});

export const SaleCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.SaleCreateManyUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => SaleCreateManyUserInputSchema), z.lazy(() => SaleCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const DepositCreateWithoutUserInputSchema: z.ZodType<Prisma.DepositCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  status: z.lazy(() => DepotStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  event: z.lazy(() => EventCreateNestedOneWithoutDepositsInputSchema),
  workstation: z.lazy(() => WorkstationCreateNestedOneWithoutDepositsInputSchema),
  articles: z.lazy(() => ArticleCreateNestedManyWithoutDepositInputSchema).optional(),
});

export const DepositUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.DepositUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  workstationId: z.string(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  status: z.lazy(() => DepotStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedCreateNestedManyWithoutDepositInputSchema).optional(),
});

export const DepositCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.DepositCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => DepositWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => DepositCreateWithoutUserInputSchema), z.lazy(() => DepositUncheckedCreateWithoutUserInputSchema) ]),
});

export const DepositCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.DepositCreateManyUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => DepositCreateManyUserInputSchema), z.lazy(() => DepositCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const SaleUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SaleUpsertWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SaleWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SaleUpdateWithoutUserInputSchema), z.lazy(() => SaleUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => SaleCreateWithoutUserInputSchema), z.lazy(() => SaleUncheckedCreateWithoutUserInputSchema) ]),
});

export const SaleUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SaleUpdateWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SaleWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SaleUpdateWithoutUserInputSchema), z.lazy(() => SaleUncheckedUpdateWithoutUserInputSchema) ]),
});

export const SaleUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.SaleUpdateManyWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SaleScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SaleUpdateManyMutationInputSchema), z.lazy(() => SaleUncheckedUpdateManyWithoutUserInputSchema) ]),
});

export const DepositUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.DepositUpsertWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => DepositWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => DepositUpdateWithoutUserInputSchema), z.lazy(() => DepositUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => DepositCreateWithoutUserInputSchema), z.lazy(() => DepositUncheckedCreateWithoutUserInputSchema) ]),
});

export const DepositUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.DepositUpdateWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => DepositWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => DepositUpdateWithoutUserInputSchema), z.lazy(() => DepositUncheckedUpdateWithoutUserInputSchema) ]),
});

export const DepositUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.DepositUpdateManyWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => DepositScalarWhereInputSchema),
  data: z.union([ z.lazy(() => DepositUpdateManyMutationInputSchema), z.lazy(() => DepositUncheckedUpdateManyWithoutUserInputSchema) ]),
});

export const EventCreateWithoutDepositsInputSchema: z.ZodType<Prisma.EventCreateWithoutDepositsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  year: z.number().int(),
  description: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleCreateNestedManyWithoutEventInputSchema).optional(),
  workstations: z.lazy(() => WorkstationCreateNestedManyWithoutEventInputSchema).optional(),
  checkouts: z.lazy(() => CheckoutCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUncheckedCreateWithoutDepositsInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutDepositsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  year: z.number().int(),
  description: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  workstations: z.lazy(() => WorkstationUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  checkouts: z.lazy(() => CheckoutUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventCreateOrConnectWithoutDepositsInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutDepositsInput> = z.strictObject({
  where: z.lazy(() => EventWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => EventCreateWithoutDepositsInputSchema), z.lazy(() => EventUncheckedCreateWithoutDepositsInputSchema) ]),
});

export const UserCreateWithoutDepotsInputSchema: z.ZodType<Prisma.UserCreateWithoutDepotsInput> = z.strictObject({
  id: z.uuid().optional(),
  lastName: z.string(),
  firstName: z.string(),
  phoneNumber: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutDepotsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutDepotsInput> = z.strictObject({
  id: z.uuid().optional(),
  lastName: z.string(),
  firstName: z.string(),
  phoneNumber: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutDepotsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutDepotsInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutDepotsInputSchema), z.lazy(() => UserUncheckedCreateWithoutDepotsInputSchema) ]),
});

export const WorkstationCreateWithoutDepositsInputSchema: z.ZodType<Prisma.WorkstationCreateWithoutDepositsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  increment_start: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  event: z.lazy(() => EventCreateNestedOneWithoutWorkstationsInputSchema),
  sales: z.lazy(() => SaleCreateNestedManyWithoutWorkstationInputSchema).optional(),
});

export const WorkstationUncheckedCreateWithoutDepositsInputSchema: z.ZodType<Prisma.WorkstationUncheckedCreateWithoutDepositsInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  name: z.string(),
  increment_start: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleUncheckedCreateNestedManyWithoutWorkstationInputSchema).optional(),
});

export const WorkstationCreateOrConnectWithoutDepositsInputSchema: z.ZodType<Prisma.WorkstationCreateOrConnectWithoutDepositsInput> = z.strictObject({
  where: z.lazy(() => WorkstationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => WorkstationCreateWithoutDepositsInputSchema), z.lazy(() => WorkstationUncheckedCreateWithoutDepositsInputSchema) ]),
});

export const ArticleCreateWithoutDepositInputSchema: z.ZodType<Prisma.ArticleCreateWithoutDepositInput> = z.strictObject({
  id: z.uuid().optional(),
  discipline: z.string().optional().nullable(),
  categorie: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  code: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sale: z.lazy(() => SaleCreateNestedOneWithoutArticlesInputSchema).optional(),
});

export const ArticleUncheckedCreateWithoutDepositInputSchema: z.ZodType<Prisma.ArticleUncheckedCreateWithoutDepositInput> = z.strictObject({
  id: z.uuid().optional(),
  discipline: z.string().optional().nullable(),
  categorie: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  code: z.string().optional().nullable(),
  saleId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const ArticleCreateOrConnectWithoutDepositInputSchema: z.ZodType<Prisma.ArticleCreateOrConnectWithoutDepositInput> = z.strictObject({
  where: z.lazy(() => ArticleWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ArticleCreateWithoutDepositInputSchema), z.lazy(() => ArticleUncheckedCreateWithoutDepositInputSchema) ]),
});

export const ArticleCreateManyDepositInputEnvelopeSchema: z.ZodType<Prisma.ArticleCreateManyDepositInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ArticleCreateManyDepositInputSchema), z.lazy(() => ArticleCreateManyDepositInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const EventUpsertWithoutDepositsInputSchema: z.ZodType<Prisma.EventUpsertWithoutDepositsInput> = z.strictObject({
  update: z.union([ z.lazy(() => EventUpdateWithoutDepositsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutDepositsInputSchema) ]),
  create: z.union([ z.lazy(() => EventCreateWithoutDepositsInputSchema), z.lazy(() => EventUncheckedCreateWithoutDepositsInputSchema) ]),
  where: z.lazy(() => EventWhereInputSchema).optional(),
});

export const EventUpdateToOneWithWhereWithoutDepositsInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutDepositsInput> = z.strictObject({
  where: z.lazy(() => EventWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => EventUpdateWithoutDepositsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutDepositsInputSchema) ]),
});

export const EventUpdateWithoutDepositsInputSchema: z.ZodType<Prisma.EventUpdateWithoutDepositsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUpdateManyWithoutEventNestedInputSchema).optional(),
  workstations: z.lazy(() => WorkstationUpdateManyWithoutEventNestedInputSchema).optional(),
  checkouts: z.lazy(() => CheckoutUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventUncheckedUpdateWithoutDepositsInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutDepositsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  workstations: z.lazy(() => WorkstationUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  checkouts: z.lazy(() => CheckoutUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const UserUpsertWithoutDepotsInputSchema: z.ZodType<Prisma.UserUpsertWithoutDepotsInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutDepotsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutDepotsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutDepotsInputSchema), z.lazy(() => UserUncheckedCreateWithoutDepotsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutDepotsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutDepotsInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutDepotsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutDepotsInputSchema) ]),
});

export const UserUpdateWithoutDepotsInputSchema: z.ZodType<Prisma.UserUpdateWithoutDepotsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  city: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutDepotsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutDepotsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  city: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const WorkstationUpsertWithoutDepositsInputSchema: z.ZodType<Prisma.WorkstationUpsertWithoutDepositsInput> = z.strictObject({
  update: z.union([ z.lazy(() => WorkstationUpdateWithoutDepositsInputSchema), z.lazy(() => WorkstationUncheckedUpdateWithoutDepositsInputSchema) ]),
  create: z.union([ z.lazy(() => WorkstationCreateWithoutDepositsInputSchema), z.lazy(() => WorkstationUncheckedCreateWithoutDepositsInputSchema) ]),
  where: z.lazy(() => WorkstationWhereInputSchema).optional(),
});

export const WorkstationUpdateToOneWithWhereWithoutDepositsInputSchema: z.ZodType<Prisma.WorkstationUpdateToOneWithWhereWithoutDepositsInput> = z.strictObject({
  where: z.lazy(() => WorkstationWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => WorkstationUpdateWithoutDepositsInputSchema), z.lazy(() => WorkstationUncheckedUpdateWithoutDepositsInputSchema) ]),
});

export const WorkstationUpdateWithoutDepositsInputSchema: z.ZodType<Prisma.WorkstationUpdateWithoutDepositsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  increment_start: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutWorkstationsNestedInputSchema).optional(),
  sales: z.lazy(() => SaleUpdateManyWithoutWorkstationNestedInputSchema).optional(),
});

export const WorkstationUncheckedUpdateWithoutDepositsInputSchema: z.ZodType<Prisma.WorkstationUncheckedUpdateWithoutDepositsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  increment_start: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUncheckedUpdateManyWithoutWorkstationNestedInputSchema).optional(),
});

export const ArticleUpsertWithWhereUniqueWithoutDepositInputSchema: z.ZodType<Prisma.ArticleUpsertWithWhereUniqueWithoutDepositInput> = z.strictObject({
  where: z.lazy(() => ArticleWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ArticleUpdateWithoutDepositInputSchema), z.lazy(() => ArticleUncheckedUpdateWithoutDepositInputSchema) ]),
  create: z.union([ z.lazy(() => ArticleCreateWithoutDepositInputSchema), z.lazy(() => ArticleUncheckedCreateWithoutDepositInputSchema) ]),
});

export const ArticleUpdateWithWhereUniqueWithoutDepositInputSchema: z.ZodType<Prisma.ArticleUpdateWithWhereUniqueWithoutDepositInput> = z.strictObject({
  where: z.lazy(() => ArticleWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ArticleUpdateWithoutDepositInputSchema), z.lazy(() => ArticleUncheckedUpdateWithoutDepositInputSchema) ]),
});

export const ArticleUpdateManyWithWhereWithoutDepositInputSchema: z.ZodType<Prisma.ArticleUpdateManyWithWhereWithoutDepositInput> = z.strictObject({
  where: z.lazy(() => ArticleScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ArticleUpdateManyMutationInputSchema), z.lazy(() => ArticleUncheckedUpdateManyWithoutDepositInputSchema) ]),
});

export const ArticleScalarWhereInputSchema: z.ZodType<Prisma.ArticleScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ArticleScalarWhereInputSchema), z.lazy(() => ArticleScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ArticleScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ArticleScalarWhereInputSchema), z.lazy(() => ArticleScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  discipline: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  categorie: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  brand: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  color: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  size: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  price: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  code: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  depositId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  saleId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const EventCreateWithoutSalesInputSchema: z.ZodType<Prisma.EventCreateWithoutSalesInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  year: z.number().int(),
  description: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  deposits: z.lazy(() => DepositCreateNestedManyWithoutEventInputSchema).optional(),
  workstations: z.lazy(() => WorkstationCreateNestedManyWithoutEventInputSchema).optional(),
  checkouts: z.lazy(() => CheckoutCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUncheckedCreateWithoutSalesInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutSalesInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  year: z.number().int(),
  description: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  deposits: z.lazy(() => DepositUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  workstations: z.lazy(() => WorkstationUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  checkouts: z.lazy(() => CheckoutUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventCreateOrConnectWithoutSalesInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutSalesInput> = z.strictObject({
  where: z.lazy(() => EventWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => EventCreateWithoutSalesInputSchema), z.lazy(() => EventUncheckedCreateWithoutSalesInputSchema) ]),
});

export const UserCreateWithoutSalesInputSchema: z.ZodType<Prisma.UserCreateWithoutSalesInput> = z.strictObject({
  id: z.uuid().optional(),
  lastName: z.string(),
  firstName: z.string(),
  phoneNumber: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  depots: z.lazy(() => DepositCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutSalesInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutSalesInput> = z.strictObject({
  id: z.uuid().optional(),
  lastName: z.string(),
  firstName: z.string(),
  phoneNumber: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  depots: z.lazy(() => DepositUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutSalesInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutSalesInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutSalesInputSchema), z.lazy(() => UserUncheckedCreateWithoutSalesInputSchema) ]),
});

export const WorkstationCreateWithoutSalesInputSchema: z.ZodType<Prisma.WorkstationCreateWithoutSalesInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  increment_start: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  event: z.lazy(() => EventCreateNestedOneWithoutWorkstationsInputSchema),
  deposits: z.lazy(() => DepositCreateNestedManyWithoutWorkstationInputSchema).optional(),
});

export const WorkstationUncheckedCreateWithoutSalesInputSchema: z.ZodType<Prisma.WorkstationUncheckedCreateWithoutSalesInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  name: z.string(),
  increment_start: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  deposits: z.lazy(() => DepositUncheckedCreateNestedManyWithoutWorkstationInputSchema).optional(),
});

export const WorkstationCreateOrConnectWithoutSalesInputSchema: z.ZodType<Prisma.WorkstationCreateOrConnectWithoutSalesInput> = z.strictObject({
  where: z.lazy(() => WorkstationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => WorkstationCreateWithoutSalesInputSchema), z.lazy(() => WorkstationUncheckedCreateWithoutSalesInputSchema) ]),
});

export const CheckoutCreateWithoutSalesInputSchema: z.ZodType<Prisma.CheckoutCreateWithoutSalesInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  initialCash: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  currentCash: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  event: z.lazy(() => EventCreateNestedOneWithoutCheckoutsInputSchema),
});

export const CheckoutUncheckedCreateWithoutSalesInputSchema: z.ZodType<Prisma.CheckoutUncheckedCreateWithoutSalesInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  initialCash: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  currentCash: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  eventId: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const CheckoutCreateOrConnectWithoutSalesInputSchema: z.ZodType<Prisma.CheckoutCreateOrConnectWithoutSalesInput> = z.strictObject({
  where: z.lazy(() => CheckoutWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CheckoutCreateWithoutSalesInputSchema), z.lazy(() => CheckoutUncheckedCreateWithoutSalesInputSchema) ]),
});

export const ArticleCreateWithoutSaleInputSchema: z.ZodType<Prisma.ArticleCreateWithoutSaleInput> = z.strictObject({
  id: z.uuid().optional(),
  discipline: z.string().optional().nullable(),
  categorie: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  code: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  deposit: z.lazy(() => DepositCreateNestedOneWithoutArticlesInputSchema).optional(),
});

export const ArticleUncheckedCreateWithoutSaleInputSchema: z.ZodType<Prisma.ArticleUncheckedCreateWithoutSaleInput> = z.strictObject({
  id: z.uuid().optional(),
  discipline: z.string().optional().nullable(),
  categorie: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  code: z.string().optional().nullable(),
  depositId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const ArticleCreateOrConnectWithoutSaleInputSchema: z.ZodType<Prisma.ArticleCreateOrConnectWithoutSaleInput> = z.strictObject({
  where: z.lazy(() => ArticleWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ArticleCreateWithoutSaleInputSchema), z.lazy(() => ArticleUncheckedCreateWithoutSaleInputSchema) ]),
});

export const ArticleCreateManySaleInputEnvelopeSchema: z.ZodType<Prisma.ArticleCreateManySaleInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ArticleCreateManySaleInputSchema), z.lazy(() => ArticleCreateManySaleInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const CashTransactionCreateWithoutSaleInputSchema: z.ZodType<Prisma.CashTransactionCreateWithoutSaleInput> = z.strictObject({
  id: z.uuid().optional(),
  cashReceived: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  cashGiven: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const CashTransactionUncheckedCreateWithoutSaleInputSchema: z.ZodType<Prisma.CashTransactionUncheckedCreateWithoutSaleInput> = z.strictObject({
  id: z.uuid().optional(),
  cashReceived: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  cashGiven: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const CashTransactionCreateOrConnectWithoutSaleInputSchema: z.ZodType<Prisma.CashTransactionCreateOrConnectWithoutSaleInput> = z.strictObject({
  where: z.lazy(() => CashTransactionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CashTransactionCreateWithoutSaleInputSchema), z.lazy(() => CashTransactionUncheckedCreateWithoutSaleInputSchema) ]),
});

export const CashTransactionCreateManySaleInputEnvelopeSchema: z.ZodType<Prisma.CashTransactionCreateManySaleInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => CashTransactionCreateManySaleInputSchema), z.lazy(() => CashTransactionCreateManySaleInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const EventUpsertWithoutSalesInputSchema: z.ZodType<Prisma.EventUpsertWithoutSalesInput> = z.strictObject({
  update: z.union([ z.lazy(() => EventUpdateWithoutSalesInputSchema), z.lazy(() => EventUncheckedUpdateWithoutSalesInputSchema) ]),
  create: z.union([ z.lazy(() => EventCreateWithoutSalesInputSchema), z.lazy(() => EventUncheckedCreateWithoutSalesInputSchema) ]),
  where: z.lazy(() => EventWhereInputSchema).optional(),
});

export const EventUpdateToOneWithWhereWithoutSalesInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutSalesInput> = z.strictObject({
  where: z.lazy(() => EventWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => EventUpdateWithoutSalesInputSchema), z.lazy(() => EventUncheckedUpdateWithoutSalesInputSchema) ]),
});

export const EventUpdateWithoutSalesInputSchema: z.ZodType<Prisma.EventUpdateWithoutSalesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deposits: z.lazy(() => DepositUpdateManyWithoutEventNestedInputSchema).optional(),
  workstations: z.lazy(() => WorkstationUpdateManyWithoutEventNestedInputSchema).optional(),
  checkouts: z.lazy(() => CheckoutUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventUncheckedUpdateWithoutSalesInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutSalesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deposits: z.lazy(() => DepositUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  workstations: z.lazy(() => WorkstationUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  checkouts: z.lazy(() => CheckoutUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const UserUpsertWithoutSalesInputSchema: z.ZodType<Prisma.UserUpsertWithoutSalesInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutSalesInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSalesInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutSalesInputSchema), z.lazy(() => UserUncheckedCreateWithoutSalesInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutSalesInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutSalesInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutSalesInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSalesInputSchema) ]),
});

export const UserUpdateWithoutSalesInputSchema: z.ZodType<Prisma.UserUpdateWithoutSalesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  city: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  depots: z.lazy(() => DepositUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutSalesInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutSalesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  city: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  depots: z.lazy(() => DepositUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const WorkstationUpsertWithoutSalesInputSchema: z.ZodType<Prisma.WorkstationUpsertWithoutSalesInput> = z.strictObject({
  update: z.union([ z.lazy(() => WorkstationUpdateWithoutSalesInputSchema), z.lazy(() => WorkstationUncheckedUpdateWithoutSalesInputSchema) ]),
  create: z.union([ z.lazy(() => WorkstationCreateWithoutSalesInputSchema), z.lazy(() => WorkstationUncheckedCreateWithoutSalesInputSchema) ]),
  where: z.lazy(() => WorkstationWhereInputSchema).optional(),
});

export const WorkstationUpdateToOneWithWhereWithoutSalesInputSchema: z.ZodType<Prisma.WorkstationUpdateToOneWithWhereWithoutSalesInput> = z.strictObject({
  where: z.lazy(() => WorkstationWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => WorkstationUpdateWithoutSalesInputSchema), z.lazy(() => WorkstationUncheckedUpdateWithoutSalesInputSchema) ]),
});

export const WorkstationUpdateWithoutSalesInputSchema: z.ZodType<Prisma.WorkstationUpdateWithoutSalesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  increment_start: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutWorkstationsNestedInputSchema).optional(),
  deposits: z.lazy(() => DepositUpdateManyWithoutWorkstationNestedInputSchema).optional(),
});

export const WorkstationUncheckedUpdateWithoutSalesInputSchema: z.ZodType<Prisma.WorkstationUncheckedUpdateWithoutSalesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  increment_start: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deposits: z.lazy(() => DepositUncheckedUpdateManyWithoutWorkstationNestedInputSchema).optional(),
});

export const CheckoutUpsertWithoutSalesInputSchema: z.ZodType<Prisma.CheckoutUpsertWithoutSalesInput> = z.strictObject({
  update: z.union([ z.lazy(() => CheckoutUpdateWithoutSalesInputSchema), z.lazy(() => CheckoutUncheckedUpdateWithoutSalesInputSchema) ]),
  create: z.union([ z.lazy(() => CheckoutCreateWithoutSalesInputSchema), z.lazy(() => CheckoutUncheckedCreateWithoutSalesInputSchema) ]),
  where: z.lazy(() => CheckoutWhereInputSchema).optional(),
});

export const CheckoutUpdateToOneWithWhereWithoutSalesInputSchema: z.ZodType<Prisma.CheckoutUpdateToOneWithWhereWithoutSalesInput> = z.strictObject({
  where: z.lazy(() => CheckoutWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => CheckoutUpdateWithoutSalesInputSchema), z.lazy(() => CheckoutUncheckedUpdateWithoutSalesInputSchema) ]),
});

export const CheckoutUpdateWithoutSalesInputSchema: z.ZodType<Prisma.CheckoutUpdateWithoutSalesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  initialCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currentCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutCheckoutsNestedInputSchema).optional(),
});

export const CheckoutUncheckedUpdateWithoutSalesInputSchema: z.ZodType<Prisma.CheckoutUncheckedUpdateWithoutSalesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  initialCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currentCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ArticleUpsertWithWhereUniqueWithoutSaleInputSchema: z.ZodType<Prisma.ArticleUpsertWithWhereUniqueWithoutSaleInput> = z.strictObject({
  where: z.lazy(() => ArticleWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ArticleUpdateWithoutSaleInputSchema), z.lazy(() => ArticleUncheckedUpdateWithoutSaleInputSchema) ]),
  create: z.union([ z.lazy(() => ArticleCreateWithoutSaleInputSchema), z.lazy(() => ArticleUncheckedCreateWithoutSaleInputSchema) ]),
});

export const ArticleUpdateWithWhereUniqueWithoutSaleInputSchema: z.ZodType<Prisma.ArticleUpdateWithWhereUniqueWithoutSaleInput> = z.strictObject({
  where: z.lazy(() => ArticleWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ArticleUpdateWithoutSaleInputSchema), z.lazy(() => ArticleUncheckedUpdateWithoutSaleInputSchema) ]),
});

export const ArticleUpdateManyWithWhereWithoutSaleInputSchema: z.ZodType<Prisma.ArticleUpdateManyWithWhereWithoutSaleInput> = z.strictObject({
  where: z.lazy(() => ArticleScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ArticleUpdateManyMutationInputSchema), z.lazy(() => ArticleUncheckedUpdateManyWithoutSaleInputSchema) ]),
});

export const CashTransactionUpsertWithWhereUniqueWithoutSaleInputSchema: z.ZodType<Prisma.CashTransactionUpsertWithWhereUniqueWithoutSaleInput> = z.strictObject({
  where: z.lazy(() => CashTransactionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CashTransactionUpdateWithoutSaleInputSchema), z.lazy(() => CashTransactionUncheckedUpdateWithoutSaleInputSchema) ]),
  create: z.union([ z.lazy(() => CashTransactionCreateWithoutSaleInputSchema), z.lazy(() => CashTransactionUncheckedCreateWithoutSaleInputSchema) ]),
});

export const CashTransactionUpdateWithWhereUniqueWithoutSaleInputSchema: z.ZodType<Prisma.CashTransactionUpdateWithWhereUniqueWithoutSaleInput> = z.strictObject({
  where: z.lazy(() => CashTransactionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CashTransactionUpdateWithoutSaleInputSchema), z.lazy(() => CashTransactionUncheckedUpdateWithoutSaleInputSchema) ]),
});

export const CashTransactionUpdateManyWithWhereWithoutSaleInputSchema: z.ZodType<Prisma.CashTransactionUpdateManyWithWhereWithoutSaleInput> = z.strictObject({
  where: z.lazy(() => CashTransactionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CashTransactionUpdateManyMutationInputSchema), z.lazy(() => CashTransactionUncheckedUpdateManyWithoutSaleInputSchema) ]),
});

export const CashTransactionScalarWhereInputSchema: z.ZodType<Prisma.CashTransactionScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => CashTransactionScalarWhereInputSchema), z.lazy(() => CashTransactionScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CashTransactionScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CashTransactionScalarWhereInputSchema), z.lazy(() => CashTransactionScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  saleId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  cashReceived: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  cashGiven: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const SaleCreateWithoutCashTransactionsInputSchema: z.ZodType<Prisma.SaleCreateWithoutCashTransactionsInput> = z.strictObject({
  id: z.uuid().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  event: z.lazy(() => EventCreateNestedOneWithoutSalesInputSchema),
  user: z.lazy(() => UserCreateNestedOneWithoutSalesInputSchema),
  workstation: z.lazy(() => WorkstationCreateNestedOneWithoutSalesInputSchema),
  checkout: z.lazy(() => CheckoutCreateNestedOneWithoutSalesInputSchema),
  articles: z.lazy(() => ArticleCreateNestedManyWithoutSaleInputSchema).optional(),
});

export const SaleUncheckedCreateWithoutCashTransactionsInputSchema: z.ZodType<Prisma.SaleUncheckedCreateWithoutCashTransactionsInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  userId: z.string(),
  workstationId: z.string(),
  checkoutId: z.string(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedCreateNestedManyWithoutSaleInputSchema).optional(),
});

export const SaleCreateOrConnectWithoutCashTransactionsInputSchema: z.ZodType<Prisma.SaleCreateOrConnectWithoutCashTransactionsInput> = z.strictObject({
  where: z.lazy(() => SaleWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SaleCreateWithoutCashTransactionsInputSchema), z.lazy(() => SaleUncheckedCreateWithoutCashTransactionsInputSchema) ]),
});

export const SaleUpsertWithoutCashTransactionsInputSchema: z.ZodType<Prisma.SaleUpsertWithoutCashTransactionsInput> = z.strictObject({
  update: z.union([ z.lazy(() => SaleUpdateWithoutCashTransactionsInputSchema), z.lazy(() => SaleUncheckedUpdateWithoutCashTransactionsInputSchema) ]),
  create: z.union([ z.lazy(() => SaleCreateWithoutCashTransactionsInputSchema), z.lazy(() => SaleUncheckedCreateWithoutCashTransactionsInputSchema) ]),
  where: z.lazy(() => SaleWhereInputSchema).optional(),
});

export const SaleUpdateToOneWithWhereWithoutCashTransactionsInputSchema: z.ZodType<Prisma.SaleUpdateToOneWithWhereWithoutCashTransactionsInput> = z.strictObject({
  where: z.lazy(() => SaleWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => SaleUpdateWithoutCashTransactionsInputSchema), z.lazy(() => SaleUncheckedUpdateWithoutCashTransactionsInputSchema) ]),
});

export const SaleUpdateWithoutCashTransactionsInputSchema: z.ZodType<Prisma.SaleUpdateWithoutCashTransactionsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  workstation: z.lazy(() => WorkstationUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  checkout: z.lazy(() => CheckoutUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  articles: z.lazy(() => ArticleUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const SaleUncheckedUpdateWithoutCashTransactionsInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateWithoutCashTransactionsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  workstationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  checkoutId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const DepositCreateWithoutArticlesInputSchema: z.ZodType<Prisma.DepositCreateWithoutArticlesInput> = z.strictObject({
  id: z.uuid().optional(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  status: z.lazy(() => DepotStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  event: z.lazy(() => EventCreateNestedOneWithoutDepositsInputSchema),
  user: z.lazy(() => UserCreateNestedOneWithoutDepotsInputSchema),
  workstation: z.lazy(() => WorkstationCreateNestedOneWithoutDepositsInputSchema),
});

export const DepositUncheckedCreateWithoutArticlesInputSchema: z.ZodType<Prisma.DepositUncheckedCreateWithoutArticlesInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  userId: z.string(),
  workstationId: z.string(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  status: z.lazy(() => DepotStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const DepositCreateOrConnectWithoutArticlesInputSchema: z.ZodType<Prisma.DepositCreateOrConnectWithoutArticlesInput> = z.strictObject({
  where: z.lazy(() => DepositWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => DepositCreateWithoutArticlesInputSchema), z.lazy(() => DepositUncheckedCreateWithoutArticlesInputSchema) ]),
});

export const SaleCreateWithoutArticlesInputSchema: z.ZodType<Prisma.SaleCreateWithoutArticlesInput> = z.strictObject({
  id: z.uuid().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  event: z.lazy(() => EventCreateNestedOneWithoutSalesInputSchema),
  user: z.lazy(() => UserCreateNestedOneWithoutSalesInputSchema),
  workstation: z.lazy(() => WorkstationCreateNestedOneWithoutSalesInputSchema),
  checkout: z.lazy(() => CheckoutCreateNestedOneWithoutSalesInputSchema),
  cashTransactions: z.lazy(() => CashTransactionCreateNestedManyWithoutSaleInputSchema).optional(),
});

export const SaleUncheckedCreateWithoutArticlesInputSchema: z.ZodType<Prisma.SaleUncheckedCreateWithoutArticlesInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  userId: z.string(),
  workstationId: z.string(),
  checkoutId: z.string(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  cashTransactions: z.lazy(() => CashTransactionUncheckedCreateNestedManyWithoutSaleInputSchema).optional(),
});

export const SaleCreateOrConnectWithoutArticlesInputSchema: z.ZodType<Prisma.SaleCreateOrConnectWithoutArticlesInput> = z.strictObject({
  where: z.lazy(() => SaleWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SaleCreateWithoutArticlesInputSchema), z.lazy(() => SaleUncheckedCreateWithoutArticlesInputSchema) ]),
});

export const DepositUpsertWithoutArticlesInputSchema: z.ZodType<Prisma.DepositUpsertWithoutArticlesInput> = z.strictObject({
  update: z.union([ z.lazy(() => DepositUpdateWithoutArticlesInputSchema), z.lazy(() => DepositUncheckedUpdateWithoutArticlesInputSchema) ]),
  create: z.union([ z.lazy(() => DepositCreateWithoutArticlesInputSchema), z.lazy(() => DepositUncheckedCreateWithoutArticlesInputSchema) ]),
  where: z.lazy(() => DepositWhereInputSchema).optional(),
});

export const DepositUpdateToOneWithWhereWithoutArticlesInputSchema: z.ZodType<Prisma.DepositUpdateToOneWithWhereWithoutArticlesInput> = z.strictObject({
  where: z.lazy(() => DepositWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => DepositUpdateWithoutArticlesInputSchema), z.lazy(() => DepositUncheckedUpdateWithoutArticlesInputSchema) ]),
});

export const DepositUpdateWithoutArticlesInputSchema: z.ZodType<Prisma.DepositUpdateWithoutArticlesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => EnumDepotStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutDepositsNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutDepotsNestedInputSchema).optional(),
  workstation: z.lazy(() => WorkstationUpdateOneRequiredWithoutDepositsNestedInputSchema).optional(),
});

export const DepositUncheckedUpdateWithoutArticlesInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateWithoutArticlesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  workstationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => EnumDepotStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SaleUpsertWithoutArticlesInputSchema: z.ZodType<Prisma.SaleUpsertWithoutArticlesInput> = z.strictObject({
  update: z.union([ z.lazy(() => SaleUpdateWithoutArticlesInputSchema), z.lazy(() => SaleUncheckedUpdateWithoutArticlesInputSchema) ]),
  create: z.union([ z.lazy(() => SaleCreateWithoutArticlesInputSchema), z.lazy(() => SaleUncheckedCreateWithoutArticlesInputSchema) ]),
  where: z.lazy(() => SaleWhereInputSchema).optional(),
});

export const SaleUpdateToOneWithWhereWithoutArticlesInputSchema: z.ZodType<Prisma.SaleUpdateToOneWithWhereWithoutArticlesInput> = z.strictObject({
  where: z.lazy(() => SaleWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => SaleUpdateWithoutArticlesInputSchema), z.lazy(() => SaleUncheckedUpdateWithoutArticlesInputSchema) ]),
});

export const SaleUpdateWithoutArticlesInputSchema: z.ZodType<Prisma.SaleUpdateWithoutArticlesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  workstation: z.lazy(() => WorkstationUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  checkout: z.lazy(() => CheckoutUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const SaleUncheckedUpdateWithoutArticlesInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateWithoutArticlesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  workstationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  checkoutId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cashTransactions: z.lazy(() => CashTransactionUncheckedUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const SaleCreateManyEventInputSchema: z.ZodType<Prisma.SaleCreateManyEventInput> = z.strictObject({
  id: z.uuid().optional(),
  userId: z.string(),
  workstationId: z.string(),
  checkoutId: z.string(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const DepositCreateManyEventInputSchema: z.ZodType<Prisma.DepositCreateManyEventInput> = z.strictObject({
  id: z.uuid().optional(),
  userId: z.string(),
  workstationId: z.string(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  status: z.lazy(() => DepotStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const WorkstationCreateManyEventInputSchema: z.ZodType<Prisma.WorkstationCreateManyEventInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  increment_start: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const CheckoutCreateManyEventInputSchema: z.ZodType<Prisma.CheckoutCreateManyEventInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  initialCash: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  currentCash: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const SaleUpdateWithoutEventInputSchema: z.ZodType<Prisma.SaleUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  workstation: z.lazy(() => WorkstationUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  checkout: z.lazy(() => CheckoutUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  articles: z.lazy(() => ArticleUpdateManyWithoutSaleNestedInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const SaleUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  workstationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  checkoutId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedUpdateManyWithoutSaleNestedInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionUncheckedUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const SaleUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateManyWithoutEventInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  workstationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  checkoutId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const DepositUpdateWithoutEventInputSchema: z.ZodType<Prisma.DepositUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => EnumDepotStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutDepotsNestedInputSchema).optional(),
  workstation: z.lazy(() => WorkstationUpdateOneRequiredWithoutDepositsNestedInputSchema).optional(),
  articles: z.lazy(() => ArticleUpdateManyWithoutDepositNestedInputSchema).optional(),
});

export const DepositUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  workstationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => EnumDepotStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedUpdateManyWithoutDepositNestedInputSchema).optional(),
});

export const DepositUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateManyWithoutEventInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  workstationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => EnumDepotStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const WorkstationUpdateWithoutEventInputSchema: z.ZodType<Prisma.WorkstationUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  increment_start: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUpdateManyWithoutWorkstationNestedInputSchema).optional(),
  deposits: z.lazy(() => DepositUpdateManyWithoutWorkstationNestedInputSchema).optional(),
});

export const WorkstationUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.WorkstationUncheckedUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  increment_start: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUncheckedUpdateManyWithoutWorkstationNestedInputSchema).optional(),
  deposits: z.lazy(() => DepositUncheckedUpdateManyWithoutWorkstationNestedInputSchema).optional(),
});

export const WorkstationUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.WorkstationUncheckedUpdateManyWithoutEventInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  increment_start: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const CheckoutUpdateWithoutEventInputSchema: z.ZodType<Prisma.CheckoutUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  initialCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currentCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUpdateManyWithoutCheckoutNestedInputSchema).optional(),
});

export const CheckoutUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.CheckoutUncheckedUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  initialCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currentCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUncheckedUpdateManyWithoutCheckoutNestedInputSchema).optional(),
});

export const CheckoutUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.CheckoutUncheckedUpdateManyWithoutEventInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  initialCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currentCash: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SaleCreateManyCheckoutInputSchema: z.ZodType<Prisma.SaleCreateManyCheckoutInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  userId: z.string(),
  workstationId: z.string(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const SaleUpdateWithoutCheckoutInputSchema: z.ZodType<Prisma.SaleUpdateWithoutCheckoutInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  workstation: z.lazy(() => WorkstationUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  articles: z.lazy(() => ArticleUpdateManyWithoutSaleNestedInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const SaleUncheckedUpdateWithoutCheckoutInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateWithoutCheckoutInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  workstationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedUpdateManyWithoutSaleNestedInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionUncheckedUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const SaleUncheckedUpdateManyWithoutCheckoutInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateManyWithoutCheckoutInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  workstationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SaleCreateManyWorkstationInputSchema: z.ZodType<Prisma.SaleCreateManyWorkstationInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  userId: z.string(),
  checkoutId: z.string(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const DepositCreateManyWorkstationInputSchema: z.ZodType<Prisma.DepositCreateManyWorkstationInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  userId: z.string(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  status: z.lazy(() => DepotStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const SaleUpdateWithoutWorkstationInputSchema: z.ZodType<Prisma.SaleUpdateWithoutWorkstationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  checkout: z.lazy(() => CheckoutUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  articles: z.lazy(() => ArticleUpdateManyWithoutSaleNestedInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const SaleUncheckedUpdateWithoutWorkstationInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateWithoutWorkstationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  checkoutId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedUpdateManyWithoutSaleNestedInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionUncheckedUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const SaleUncheckedUpdateManyWithoutWorkstationInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateManyWithoutWorkstationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  checkoutId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const DepositUpdateWithoutWorkstationInputSchema: z.ZodType<Prisma.DepositUpdateWithoutWorkstationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => EnumDepotStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutDepositsNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutDepotsNestedInputSchema).optional(),
  articles: z.lazy(() => ArticleUpdateManyWithoutDepositNestedInputSchema).optional(),
});

export const DepositUncheckedUpdateWithoutWorkstationInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateWithoutWorkstationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => EnumDepotStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedUpdateManyWithoutDepositNestedInputSchema).optional(),
});

export const DepositUncheckedUpdateManyWithoutWorkstationInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateManyWithoutWorkstationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => EnumDepotStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SaleCreateManyUserInputSchema: z.ZodType<Prisma.SaleCreateManyUserInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  workstationId: z.string(),
  checkoutId: z.string(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  totalAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  postalCode: z.string().optional().nullable(),
  saleAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const DepositCreateManyUserInputSchema: z.ZodType<Prisma.DepositCreateManyUserInput> = z.strictObject({
  id: z.uuid().optional(),
  eventId: z.string(),
  workstationId: z.string(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  status: z.lazy(() => DepotStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const SaleUpdateWithoutUserInputSchema: z.ZodType<Prisma.SaleUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  workstation: z.lazy(() => WorkstationUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  checkout: z.lazy(() => CheckoutUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  articles: z.lazy(() => ArticleUpdateManyWithoutSaleNestedInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const SaleUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  workstationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  checkoutId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedUpdateManyWithoutSaleNestedInputSchema).optional(),
  cashTransactions: z.lazy(() => CashTransactionUncheckedUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const SaleUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  workstationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  checkoutId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const DepositUpdateWithoutUserInputSchema: z.ZodType<Prisma.DepositUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => EnumDepotStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutDepositsNestedInputSchema).optional(),
  workstation: z.lazy(() => WorkstationUpdateOneRequiredWithoutDepositsNestedInputSchema).optional(),
  articles: z.lazy(() => ArticleUpdateManyWithoutDepositNestedInputSchema).optional(),
});

export const DepositUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  workstationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => EnumDepotStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedUpdateManyWithoutDepositNestedInputSchema).optional(),
});

export const DepositUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  workstationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => DepotStatusSchema), z.lazy(() => EnumDepotStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ArticleCreateManyDepositInputSchema: z.ZodType<Prisma.ArticleCreateManyDepositInput> = z.strictObject({
  id: z.uuid().optional(),
  discipline: z.string().optional().nullable(),
  categorie: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  code: z.string().optional().nullable(),
  saleId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const ArticleUpdateWithoutDepositInputSchema: z.ZodType<Prisma.ArticleUpdateWithoutDepositInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categorie: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  brand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  size: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  code: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sale: z.lazy(() => SaleUpdateOneWithoutArticlesNestedInputSchema).optional(),
});

export const ArticleUncheckedUpdateWithoutDepositInputSchema: z.ZodType<Prisma.ArticleUncheckedUpdateWithoutDepositInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categorie: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  brand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  size: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  code: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ArticleUncheckedUpdateManyWithoutDepositInputSchema: z.ZodType<Prisma.ArticleUncheckedUpdateManyWithoutDepositInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categorie: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  brand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  size: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  code: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ArticleCreateManySaleInputSchema: z.ZodType<Prisma.ArticleCreateManySaleInput> = z.strictObject({
  id: z.uuid().optional(),
  discipline: z.string().optional().nullable(),
  categorie: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  code: z.string().optional().nullable(),
  depositId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const CashTransactionCreateManySaleInputSchema: z.ZodType<Prisma.CashTransactionCreateManySaleInput> = z.strictObject({
  id: z.uuid().optional(),
  cashReceived: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  cashGiven: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const ArticleUpdateWithoutSaleInputSchema: z.ZodType<Prisma.ArticleUpdateWithoutSaleInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categorie: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  brand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  size: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  code: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deposit: z.lazy(() => DepositUpdateOneWithoutArticlesNestedInputSchema).optional(),
});

export const ArticleUncheckedUpdateWithoutSaleInputSchema: z.ZodType<Prisma.ArticleUncheckedUpdateWithoutSaleInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categorie: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  brand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  size: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  code: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  depositId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ArticleUncheckedUpdateManyWithoutSaleInputSchema: z.ZodType<Prisma.ArticleUncheckedUpdateManyWithoutSaleInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categorie: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  brand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  size: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  code: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  depositId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const CashTransactionUpdateWithoutSaleInputSchema: z.ZodType<Prisma.CashTransactionUpdateWithoutSaleInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cashReceived: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashGiven: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const CashTransactionUncheckedUpdateWithoutSaleInputSchema: z.ZodType<Prisma.CashTransactionUncheckedUpdateWithoutSaleInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cashReceived: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashGiven: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const CashTransactionUncheckedUpdateManyWithoutSaleInputSchema: z.ZodType<Prisma.CashTransactionUncheckedUpdateManyWithoutSaleInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  cashReceived: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashGiven: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const EventFindFirstArgsSchema: z.ZodType<Prisma.EventFindFirstArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereInputSchema.optional(), 
  orderBy: z.union([ EventOrderByWithRelationInputSchema.array(), EventOrderByWithRelationInputSchema ]).optional(),
  cursor: EventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EventScalarFieldEnumSchema, EventScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EventFindFirstOrThrowArgsSchema: z.ZodType<Prisma.EventFindFirstOrThrowArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereInputSchema.optional(), 
  orderBy: z.union([ EventOrderByWithRelationInputSchema.array(), EventOrderByWithRelationInputSchema ]).optional(),
  cursor: EventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EventScalarFieldEnumSchema, EventScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EventFindManyArgsSchema: z.ZodType<Prisma.EventFindManyArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereInputSchema.optional(), 
  orderBy: z.union([ EventOrderByWithRelationInputSchema.array(), EventOrderByWithRelationInputSchema ]).optional(),
  cursor: EventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EventScalarFieldEnumSchema, EventScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EventAggregateArgsSchema: z.ZodType<Prisma.EventAggregateArgs> = z.object({
  where: EventWhereInputSchema.optional(), 
  orderBy: z.union([ EventOrderByWithRelationInputSchema.array(), EventOrderByWithRelationInputSchema ]).optional(),
  cursor: EventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const EventGroupByArgsSchema: z.ZodType<Prisma.EventGroupByArgs> = z.object({
  where: EventWhereInputSchema.optional(), 
  orderBy: z.union([ EventOrderByWithAggregationInputSchema.array(), EventOrderByWithAggregationInputSchema ]).optional(),
  by: EventScalarFieldEnumSchema.array(), 
  having: EventScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const EventFindUniqueArgsSchema: z.ZodType<Prisma.EventFindUniqueArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereUniqueInputSchema, 
}).strict();

export const EventFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.EventFindUniqueOrThrowArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereUniqueInputSchema, 
}).strict();

export const CheckoutFindFirstArgsSchema: z.ZodType<Prisma.CheckoutFindFirstArgs> = z.object({
  select: CheckoutSelectSchema.optional(),
  include: CheckoutIncludeSchema.optional(),
  where: CheckoutWhereInputSchema.optional(), 
  orderBy: z.union([ CheckoutOrderByWithRelationInputSchema.array(), CheckoutOrderByWithRelationInputSchema ]).optional(),
  cursor: CheckoutWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CheckoutScalarFieldEnumSchema, CheckoutScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const CheckoutFindFirstOrThrowArgsSchema: z.ZodType<Prisma.CheckoutFindFirstOrThrowArgs> = z.object({
  select: CheckoutSelectSchema.optional(),
  include: CheckoutIncludeSchema.optional(),
  where: CheckoutWhereInputSchema.optional(), 
  orderBy: z.union([ CheckoutOrderByWithRelationInputSchema.array(), CheckoutOrderByWithRelationInputSchema ]).optional(),
  cursor: CheckoutWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CheckoutScalarFieldEnumSchema, CheckoutScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const CheckoutFindManyArgsSchema: z.ZodType<Prisma.CheckoutFindManyArgs> = z.object({
  select: CheckoutSelectSchema.optional(),
  include: CheckoutIncludeSchema.optional(),
  where: CheckoutWhereInputSchema.optional(), 
  orderBy: z.union([ CheckoutOrderByWithRelationInputSchema.array(), CheckoutOrderByWithRelationInputSchema ]).optional(),
  cursor: CheckoutWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CheckoutScalarFieldEnumSchema, CheckoutScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const CheckoutAggregateArgsSchema: z.ZodType<Prisma.CheckoutAggregateArgs> = z.object({
  where: CheckoutWhereInputSchema.optional(), 
  orderBy: z.union([ CheckoutOrderByWithRelationInputSchema.array(), CheckoutOrderByWithRelationInputSchema ]).optional(),
  cursor: CheckoutWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const CheckoutGroupByArgsSchema: z.ZodType<Prisma.CheckoutGroupByArgs> = z.object({
  where: CheckoutWhereInputSchema.optional(), 
  orderBy: z.union([ CheckoutOrderByWithAggregationInputSchema.array(), CheckoutOrderByWithAggregationInputSchema ]).optional(),
  by: CheckoutScalarFieldEnumSchema.array(), 
  having: CheckoutScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const CheckoutFindUniqueArgsSchema: z.ZodType<Prisma.CheckoutFindUniqueArgs> = z.object({
  select: CheckoutSelectSchema.optional(),
  include: CheckoutIncludeSchema.optional(),
  where: CheckoutWhereUniqueInputSchema, 
}).strict();

export const CheckoutFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.CheckoutFindUniqueOrThrowArgs> = z.object({
  select: CheckoutSelectSchema.optional(),
  include: CheckoutIncludeSchema.optional(),
  where: CheckoutWhereUniqueInputSchema, 
}).strict();

export const WorkstationFindFirstArgsSchema: z.ZodType<Prisma.WorkstationFindFirstArgs> = z.object({
  select: WorkstationSelectSchema.optional(),
  include: WorkstationIncludeSchema.optional(),
  where: WorkstationWhereInputSchema.optional(), 
  orderBy: z.union([ WorkstationOrderByWithRelationInputSchema.array(), WorkstationOrderByWithRelationInputSchema ]).optional(),
  cursor: WorkstationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WorkstationScalarFieldEnumSchema, WorkstationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const WorkstationFindFirstOrThrowArgsSchema: z.ZodType<Prisma.WorkstationFindFirstOrThrowArgs> = z.object({
  select: WorkstationSelectSchema.optional(),
  include: WorkstationIncludeSchema.optional(),
  where: WorkstationWhereInputSchema.optional(), 
  orderBy: z.union([ WorkstationOrderByWithRelationInputSchema.array(), WorkstationOrderByWithRelationInputSchema ]).optional(),
  cursor: WorkstationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WorkstationScalarFieldEnumSchema, WorkstationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const WorkstationFindManyArgsSchema: z.ZodType<Prisma.WorkstationFindManyArgs> = z.object({
  select: WorkstationSelectSchema.optional(),
  include: WorkstationIncludeSchema.optional(),
  where: WorkstationWhereInputSchema.optional(), 
  orderBy: z.union([ WorkstationOrderByWithRelationInputSchema.array(), WorkstationOrderByWithRelationInputSchema ]).optional(),
  cursor: WorkstationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WorkstationScalarFieldEnumSchema, WorkstationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const WorkstationAggregateArgsSchema: z.ZodType<Prisma.WorkstationAggregateArgs> = z.object({
  where: WorkstationWhereInputSchema.optional(), 
  orderBy: z.union([ WorkstationOrderByWithRelationInputSchema.array(), WorkstationOrderByWithRelationInputSchema ]).optional(),
  cursor: WorkstationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const WorkstationGroupByArgsSchema: z.ZodType<Prisma.WorkstationGroupByArgs> = z.object({
  where: WorkstationWhereInputSchema.optional(), 
  orderBy: z.union([ WorkstationOrderByWithAggregationInputSchema.array(), WorkstationOrderByWithAggregationInputSchema ]).optional(),
  by: WorkstationScalarFieldEnumSchema.array(), 
  having: WorkstationScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const WorkstationFindUniqueArgsSchema: z.ZodType<Prisma.WorkstationFindUniqueArgs> = z.object({
  select: WorkstationSelectSchema.optional(),
  include: WorkstationIncludeSchema.optional(),
  where: WorkstationWhereUniqueInputSchema, 
}).strict();

export const WorkstationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.WorkstationFindUniqueOrThrowArgs> = z.object({
  select: WorkstationSelectSchema.optional(),
  include: WorkstationIncludeSchema.optional(),
  where: WorkstationWhereUniqueInputSchema, 
}).strict();

export const UserFindFirstArgsSchema: z.ZodType<Prisma.UserFindFirstArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserFindFirstOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserFindManyArgsSchema: z.ZodType<Prisma.UserFindManyArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserAggregateArgsSchema: z.ZodType<Prisma.UserAggregateArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserGroupByArgsSchema: z.ZodType<Prisma.UserGroupByArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithAggregationInputSchema.array(), UserOrderByWithAggregationInputSchema ]).optional(),
  by: UserScalarFieldEnumSchema.array(), 
  having: UserScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserFindUniqueArgsSchema: z.ZodType<Prisma.UserFindUniqueArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserFindUniqueOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const DepositFindFirstArgsSchema: z.ZodType<Prisma.DepositFindFirstArgs> = z.object({
  select: DepositSelectSchema.optional(),
  include: DepositIncludeSchema.optional(),
  where: DepositWhereInputSchema.optional(), 
  orderBy: z.union([ DepositOrderByWithRelationInputSchema.array(), DepositOrderByWithRelationInputSchema ]).optional(),
  cursor: DepositWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DepositScalarFieldEnumSchema, DepositScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const DepositFindFirstOrThrowArgsSchema: z.ZodType<Prisma.DepositFindFirstOrThrowArgs> = z.object({
  select: DepositSelectSchema.optional(),
  include: DepositIncludeSchema.optional(),
  where: DepositWhereInputSchema.optional(), 
  orderBy: z.union([ DepositOrderByWithRelationInputSchema.array(), DepositOrderByWithRelationInputSchema ]).optional(),
  cursor: DepositWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DepositScalarFieldEnumSchema, DepositScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const DepositFindManyArgsSchema: z.ZodType<Prisma.DepositFindManyArgs> = z.object({
  select: DepositSelectSchema.optional(),
  include: DepositIncludeSchema.optional(),
  where: DepositWhereInputSchema.optional(), 
  orderBy: z.union([ DepositOrderByWithRelationInputSchema.array(), DepositOrderByWithRelationInputSchema ]).optional(),
  cursor: DepositWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DepositScalarFieldEnumSchema, DepositScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const DepositAggregateArgsSchema: z.ZodType<Prisma.DepositAggregateArgs> = z.object({
  where: DepositWhereInputSchema.optional(), 
  orderBy: z.union([ DepositOrderByWithRelationInputSchema.array(), DepositOrderByWithRelationInputSchema ]).optional(),
  cursor: DepositWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const DepositGroupByArgsSchema: z.ZodType<Prisma.DepositGroupByArgs> = z.object({
  where: DepositWhereInputSchema.optional(), 
  orderBy: z.union([ DepositOrderByWithAggregationInputSchema.array(), DepositOrderByWithAggregationInputSchema ]).optional(),
  by: DepositScalarFieldEnumSchema.array(), 
  having: DepositScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const DepositFindUniqueArgsSchema: z.ZodType<Prisma.DepositFindUniqueArgs> = z.object({
  select: DepositSelectSchema.optional(),
  include: DepositIncludeSchema.optional(),
  where: DepositWhereUniqueInputSchema, 
}).strict();

export const DepositFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.DepositFindUniqueOrThrowArgs> = z.object({
  select: DepositSelectSchema.optional(),
  include: DepositIncludeSchema.optional(),
  where: DepositWhereUniqueInputSchema, 
}).strict();

export const SaleFindFirstArgsSchema: z.ZodType<Prisma.SaleFindFirstArgs> = z.object({
  select: SaleSelectSchema.optional(),
  include: SaleIncludeSchema.optional(),
  where: SaleWhereInputSchema.optional(), 
  orderBy: z.union([ SaleOrderByWithRelationInputSchema.array(), SaleOrderByWithRelationInputSchema ]).optional(),
  cursor: SaleWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SaleScalarFieldEnumSchema, SaleScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SaleFindFirstOrThrowArgsSchema: z.ZodType<Prisma.SaleFindFirstOrThrowArgs> = z.object({
  select: SaleSelectSchema.optional(),
  include: SaleIncludeSchema.optional(),
  where: SaleWhereInputSchema.optional(), 
  orderBy: z.union([ SaleOrderByWithRelationInputSchema.array(), SaleOrderByWithRelationInputSchema ]).optional(),
  cursor: SaleWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SaleScalarFieldEnumSchema, SaleScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SaleFindManyArgsSchema: z.ZodType<Prisma.SaleFindManyArgs> = z.object({
  select: SaleSelectSchema.optional(),
  include: SaleIncludeSchema.optional(),
  where: SaleWhereInputSchema.optional(), 
  orderBy: z.union([ SaleOrderByWithRelationInputSchema.array(), SaleOrderByWithRelationInputSchema ]).optional(),
  cursor: SaleWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SaleScalarFieldEnumSchema, SaleScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SaleAggregateArgsSchema: z.ZodType<Prisma.SaleAggregateArgs> = z.object({
  where: SaleWhereInputSchema.optional(), 
  orderBy: z.union([ SaleOrderByWithRelationInputSchema.array(), SaleOrderByWithRelationInputSchema ]).optional(),
  cursor: SaleWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SaleGroupByArgsSchema: z.ZodType<Prisma.SaleGroupByArgs> = z.object({
  where: SaleWhereInputSchema.optional(), 
  orderBy: z.union([ SaleOrderByWithAggregationInputSchema.array(), SaleOrderByWithAggregationInputSchema ]).optional(),
  by: SaleScalarFieldEnumSchema.array(), 
  having: SaleScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SaleFindUniqueArgsSchema: z.ZodType<Prisma.SaleFindUniqueArgs> = z.object({
  select: SaleSelectSchema.optional(),
  include: SaleIncludeSchema.optional(),
  where: SaleWhereUniqueInputSchema, 
}).strict();

export const SaleFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.SaleFindUniqueOrThrowArgs> = z.object({
  select: SaleSelectSchema.optional(),
  include: SaleIncludeSchema.optional(),
  where: SaleWhereUniqueInputSchema, 
}).strict();

export const CashTransactionFindFirstArgsSchema: z.ZodType<Prisma.CashTransactionFindFirstArgs> = z.object({
  select: CashTransactionSelectSchema.optional(),
  include: CashTransactionIncludeSchema.optional(),
  where: CashTransactionWhereInputSchema.optional(), 
  orderBy: z.union([ CashTransactionOrderByWithRelationInputSchema.array(), CashTransactionOrderByWithRelationInputSchema ]).optional(),
  cursor: CashTransactionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CashTransactionScalarFieldEnumSchema, CashTransactionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const CashTransactionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.CashTransactionFindFirstOrThrowArgs> = z.object({
  select: CashTransactionSelectSchema.optional(),
  include: CashTransactionIncludeSchema.optional(),
  where: CashTransactionWhereInputSchema.optional(), 
  orderBy: z.union([ CashTransactionOrderByWithRelationInputSchema.array(), CashTransactionOrderByWithRelationInputSchema ]).optional(),
  cursor: CashTransactionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CashTransactionScalarFieldEnumSchema, CashTransactionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const CashTransactionFindManyArgsSchema: z.ZodType<Prisma.CashTransactionFindManyArgs> = z.object({
  select: CashTransactionSelectSchema.optional(),
  include: CashTransactionIncludeSchema.optional(),
  where: CashTransactionWhereInputSchema.optional(), 
  orderBy: z.union([ CashTransactionOrderByWithRelationInputSchema.array(), CashTransactionOrderByWithRelationInputSchema ]).optional(),
  cursor: CashTransactionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CashTransactionScalarFieldEnumSchema, CashTransactionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const CashTransactionAggregateArgsSchema: z.ZodType<Prisma.CashTransactionAggregateArgs> = z.object({
  where: CashTransactionWhereInputSchema.optional(), 
  orderBy: z.union([ CashTransactionOrderByWithRelationInputSchema.array(), CashTransactionOrderByWithRelationInputSchema ]).optional(),
  cursor: CashTransactionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const CashTransactionGroupByArgsSchema: z.ZodType<Prisma.CashTransactionGroupByArgs> = z.object({
  where: CashTransactionWhereInputSchema.optional(), 
  orderBy: z.union([ CashTransactionOrderByWithAggregationInputSchema.array(), CashTransactionOrderByWithAggregationInputSchema ]).optional(),
  by: CashTransactionScalarFieldEnumSchema.array(), 
  having: CashTransactionScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const CashTransactionFindUniqueArgsSchema: z.ZodType<Prisma.CashTransactionFindUniqueArgs> = z.object({
  select: CashTransactionSelectSchema.optional(),
  include: CashTransactionIncludeSchema.optional(),
  where: CashTransactionWhereUniqueInputSchema, 
}).strict();

export const CashTransactionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.CashTransactionFindUniqueOrThrowArgs> = z.object({
  select: CashTransactionSelectSchema.optional(),
  include: CashTransactionIncludeSchema.optional(),
  where: CashTransactionWhereUniqueInputSchema, 
}).strict();

export const ArticleFindFirstArgsSchema: z.ZodType<Prisma.ArticleFindFirstArgs> = z.object({
  select: ArticleSelectSchema.optional(),
  include: ArticleIncludeSchema.optional(),
  where: ArticleWhereInputSchema.optional(), 
  orderBy: z.union([ ArticleOrderByWithRelationInputSchema.array(), ArticleOrderByWithRelationInputSchema ]).optional(),
  cursor: ArticleWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ArticleScalarFieldEnumSchema, ArticleScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ArticleFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ArticleFindFirstOrThrowArgs> = z.object({
  select: ArticleSelectSchema.optional(),
  include: ArticleIncludeSchema.optional(),
  where: ArticleWhereInputSchema.optional(), 
  orderBy: z.union([ ArticleOrderByWithRelationInputSchema.array(), ArticleOrderByWithRelationInputSchema ]).optional(),
  cursor: ArticleWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ArticleScalarFieldEnumSchema, ArticleScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ArticleFindManyArgsSchema: z.ZodType<Prisma.ArticleFindManyArgs> = z.object({
  select: ArticleSelectSchema.optional(),
  include: ArticleIncludeSchema.optional(),
  where: ArticleWhereInputSchema.optional(), 
  orderBy: z.union([ ArticleOrderByWithRelationInputSchema.array(), ArticleOrderByWithRelationInputSchema ]).optional(),
  cursor: ArticleWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ArticleScalarFieldEnumSchema, ArticleScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ArticleAggregateArgsSchema: z.ZodType<Prisma.ArticleAggregateArgs> = z.object({
  where: ArticleWhereInputSchema.optional(), 
  orderBy: z.union([ ArticleOrderByWithRelationInputSchema.array(), ArticleOrderByWithRelationInputSchema ]).optional(),
  cursor: ArticleWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ArticleGroupByArgsSchema: z.ZodType<Prisma.ArticleGroupByArgs> = z.object({
  where: ArticleWhereInputSchema.optional(), 
  orderBy: z.union([ ArticleOrderByWithAggregationInputSchema.array(), ArticleOrderByWithAggregationInputSchema ]).optional(),
  by: ArticleScalarFieldEnumSchema.array(), 
  having: ArticleScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ArticleFindUniqueArgsSchema: z.ZodType<Prisma.ArticleFindUniqueArgs> = z.object({
  select: ArticleSelectSchema.optional(),
  include: ArticleIncludeSchema.optional(),
  where: ArticleWhereUniqueInputSchema, 
}).strict();

export const ArticleFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ArticleFindUniqueOrThrowArgs> = z.object({
  select: ArticleSelectSchema.optional(),
  include: ArticleIncludeSchema.optional(),
  where: ArticleWhereUniqueInputSchema, 
}).strict();

export const EventCreateArgsSchema: z.ZodType<Prisma.EventCreateArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  data: z.union([ EventCreateInputSchema, EventUncheckedCreateInputSchema ]),
}).strict();

export const EventUpsertArgsSchema: z.ZodType<Prisma.EventUpsertArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereUniqueInputSchema, 
  create: z.union([ EventCreateInputSchema, EventUncheckedCreateInputSchema ]),
  update: z.union([ EventUpdateInputSchema, EventUncheckedUpdateInputSchema ]),
}).strict();

export const EventCreateManyArgsSchema: z.ZodType<Prisma.EventCreateManyArgs> = z.object({
  data: z.union([ EventCreateManyInputSchema, EventCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const EventCreateManyAndReturnArgsSchema: z.ZodType<Prisma.EventCreateManyAndReturnArgs> = z.object({
  data: z.union([ EventCreateManyInputSchema, EventCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const EventDeleteArgsSchema: z.ZodType<Prisma.EventDeleteArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereUniqueInputSchema, 
}).strict();

export const EventUpdateArgsSchema: z.ZodType<Prisma.EventUpdateArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  data: z.union([ EventUpdateInputSchema, EventUncheckedUpdateInputSchema ]),
  where: EventWhereUniqueInputSchema, 
}).strict();

export const EventUpdateManyArgsSchema: z.ZodType<Prisma.EventUpdateManyArgs> = z.object({
  data: z.union([ EventUpdateManyMutationInputSchema, EventUncheckedUpdateManyInputSchema ]),
  where: EventWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const EventUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.EventUpdateManyAndReturnArgs> = z.object({
  data: z.union([ EventUpdateManyMutationInputSchema, EventUncheckedUpdateManyInputSchema ]),
  where: EventWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const EventDeleteManyArgsSchema: z.ZodType<Prisma.EventDeleteManyArgs> = z.object({
  where: EventWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const CheckoutCreateArgsSchema: z.ZodType<Prisma.CheckoutCreateArgs> = z.object({
  select: CheckoutSelectSchema.optional(),
  include: CheckoutIncludeSchema.optional(),
  data: z.union([ CheckoutCreateInputSchema, CheckoutUncheckedCreateInputSchema ]),
}).strict();

export const CheckoutUpsertArgsSchema: z.ZodType<Prisma.CheckoutUpsertArgs> = z.object({
  select: CheckoutSelectSchema.optional(),
  include: CheckoutIncludeSchema.optional(),
  where: CheckoutWhereUniqueInputSchema, 
  create: z.union([ CheckoutCreateInputSchema, CheckoutUncheckedCreateInputSchema ]),
  update: z.union([ CheckoutUpdateInputSchema, CheckoutUncheckedUpdateInputSchema ]),
}).strict();

export const CheckoutCreateManyArgsSchema: z.ZodType<Prisma.CheckoutCreateManyArgs> = z.object({
  data: z.union([ CheckoutCreateManyInputSchema, CheckoutCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const CheckoutCreateManyAndReturnArgsSchema: z.ZodType<Prisma.CheckoutCreateManyAndReturnArgs> = z.object({
  data: z.union([ CheckoutCreateManyInputSchema, CheckoutCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const CheckoutDeleteArgsSchema: z.ZodType<Prisma.CheckoutDeleteArgs> = z.object({
  select: CheckoutSelectSchema.optional(),
  include: CheckoutIncludeSchema.optional(),
  where: CheckoutWhereUniqueInputSchema, 
}).strict();

export const CheckoutUpdateArgsSchema: z.ZodType<Prisma.CheckoutUpdateArgs> = z.object({
  select: CheckoutSelectSchema.optional(),
  include: CheckoutIncludeSchema.optional(),
  data: z.union([ CheckoutUpdateInputSchema, CheckoutUncheckedUpdateInputSchema ]),
  where: CheckoutWhereUniqueInputSchema, 
}).strict();

export const CheckoutUpdateManyArgsSchema: z.ZodType<Prisma.CheckoutUpdateManyArgs> = z.object({
  data: z.union([ CheckoutUpdateManyMutationInputSchema, CheckoutUncheckedUpdateManyInputSchema ]),
  where: CheckoutWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const CheckoutUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.CheckoutUpdateManyAndReturnArgs> = z.object({
  data: z.union([ CheckoutUpdateManyMutationInputSchema, CheckoutUncheckedUpdateManyInputSchema ]),
  where: CheckoutWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const CheckoutDeleteManyArgsSchema: z.ZodType<Prisma.CheckoutDeleteManyArgs> = z.object({
  where: CheckoutWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const WorkstationCreateArgsSchema: z.ZodType<Prisma.WorkstationCreateArgs> = z.object({
  select: WorkstationSelectSchema.optional(),
  include: WorkstationIncludeSchema.optional(),
  data: z.union([ WorkstationCreateInputSchema, WorkstationUncheckedCreateInputSchema ]),
}).strict();

export const WorkstationUpsertArgsSchema: z.ZodType<Prisma.WorkstationUpsertArgs> = z.object({
  select: WorkstationSelectSchema.optional(),
  include: WorkstationIncludeSchema.optional(),
  where: WorkstationWhereUniqueInputSchema, 
  create: z.union([ WorkstationCreateInputSchema, WorkstationUncheckedCreateInputSchema ]),
  update: z.union([ WorkstationUpdateInputSchema, WorkstationUncheckedUpdateInputSchema ]),
}).strict();

export const WorkstationCreateManyArgsSchema: z.ZodType<Prisma.WorkstationCreateManyArgs> = z.object({
  data: z.union([ WorkstationCreateManyInputSchema, WorkstationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const WorkstationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.WorkstationCreateManyAndReturnArgs> = z.object({
  data: z.union([ WorkstationCreateManyInputSchema, WorkstationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const WorkstationDeleteArgsSchema: z.ZodType<Prisma.WorkstationDeleteArgs> = z.object({
  select: WorkstationSelectSchema.optional(),
  include: WorkstationIncludeSchema.optional(),
  where: WorkstationWhereUniqueInputSchema, 
}).strict();

export const WorkstationUpdateArgsSchema: z.ZodType<Prisma.WorkstationUpdateArgs> = z.object({
  select: WorkstationSelectSchema.optional(),
  include: WorkstationIncludeSchema.optional(),
  data: z.union([ WorkstationUpdateInputSchema, WorkstationUncheckedUpdateInputSchema ]),
  where: WorkstationWhereUniqueInputSchema, 
}).strict();

export const WorkstationUpdateManyArgsSchema: z.ZodType<Prisma.WorkstationUpdateManyArgs> = z.object({
  data: z.union([ WorkstationUpdateManyMutationInputSchema, WorkstationUncheckedUpdateManyInputSchema ]),
  where: WorkstationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const WorkstationUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.WorkstationUpdateManyAndReturnArgs> = z.object({
  data: z.union([ WorkstationUpdateManyMutationInputSchema, WorkstationUncheckedUpdateManyInputSchema ]),
  where: WorkstationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const WorkstationDeleteManyArgsSchema: z.ZodType<Prisma.WorkstationDeleteManyArgs> = z.object({
  where: WorkstationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserCreateArgsSchema: z.ZodType<Prisma.UserCreateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserCreateInputSchema, UserUncheckedCreateInputSchema ]),
}).strict();

export const UserUpsertArgsSchema: z.ZodType<Prisma.UserUpsertArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
  create: z.union([ UserCreateInputSchema, UserUncheckedCreateInputSchema ]),
  update: z.union([ UserUpdateInputSchema, UserUncheckedUpdateInputSchema ]),
}).strict();

export const UserCreateManyArgsSchema: z.ZodType<Prisma.UserCreateManyArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema, UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserCreateManyAndReturnArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema, UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserDeleteArgsSchema: z.ZodType<Prisma.UserDeleteArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserUpdateArgsSchema: z.ZodType<Prisma.UserUpdateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserUpdateInputSchema, UserUncheckedUpdateInputSchema ]),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserUpdateManyArgsSchema: z.ZodType<Prisma.UserUpdateManyArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema, UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.UserUpdateManyAndReturnArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema, UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserDeleteManyArgsSchema: z.ZodType<Prisma.UserDeleteManyArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const DepositCreateArgsSchema: z.ZodType<Prisma.DepositCreateArgs> = z.object({
  select: DepositSelectSchema.optional(),
  include: DepositIncludeSchema.optional(),
  data: z.union([ DepositCreateInputSchema, DepositUncheckedCreateInputSchema ]),
}).strict();

export const DepositUpsertArgsSchema: z.ZodType<Prisma.DepositUpsertArgs> = z.object({
  select: DepositSelectSchema.optional(),
  include: DepositIncludeSchema.optional(),
  where: DepositWhereUniqueInputSchema, 
  create: z.union([ DepositCreateInputSchema, DepositUncheckedCreateInputSchema ]),
  update: z.union([ DepositUpdateInputSchema, DepositUncheckedUpdateInputSchema ]),
}).strict();

export const DepositCreateManyArgsSchema: z.ZodType<Prisma.DepositCreateManyArgs> = z.object({
  data: z.union([ DepositCreateManyInputSchema, DepositCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const DepositCreateManyAndReturnArgsSchema: z.ZodType<Prisma.DepositCreateManyAndReturnArgs> = z.object({
  data: z.union([ DepositCreateManyInputSchema, DepositCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const DepositDeleteArgsSchema: z.ZodType<Prisma.DepositDeleteArgs> = z.object({
  select: DepositSelectSchema.optional(),
  include: DepositIncludeSchema.optional(),
  where: DepositWhereUniqueInputSchema, 
}).strict();

export const DepositUpdateArgsSchema: z.ZodType<Prisma.DepositUpdateArgs> = z.object({
  select: DepositSelectSchema.optional(),
  include: DepositIncludeSchema.optional(),
  data: z.union([ DepositUpdateInputSchema, DepositUncheckedUpdateInputSchema ]),
  where: DepositWhereUniqueInputSchema, 
}).strict();

export const DepositUpdateManyArgsSchema: z.ZodType<Prisma.DepositUpdateManyArgs> = z.object({
  data: z.union([ DepositUpdateManyMutationInputSchema, DepositUncheckedUpdateManyInputSchema ]),
  where: DepositWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const DepositUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.DepositUpdateManyAndReturnArgs> = z.object({
  data: z.union([ DepositUpdateManyMutationInputSchema, DepositUncheckedUpdateManyInputSchema ]),
  where: DepositWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const DepositDeleteManyArgsSchema: z.ZodType<Prisma.DepositDeleteManyArgs> = z.object({
  where: DepositWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SaleCreateArgsSchema: z.ZodType<Prisma.SaleCreateArgs> = z.object({
  select: SaleSelectSchema.optional(),
  include: SaleIncludeSchema.optional(),
  data: z.union([ SaleCreateInputSchema, SaleUncheckedCreateInputSchema ]),
}).strict();

export const SaleUpsertArgsSchema: z.ZodType<Prisma.SaleUpsertArgs> = z.object({
  select: SaleSelectSchema.optional(),
  include: SaleIncludeSchema.optional(),
  where: SaleWhereUniqueInputSchema, 
  create: z.union([ SaleCreateInputSchema, SaleUncheckedCreateInputSchema ]),
  update: z.union([ SaleUpdateInputSchema, SaleUncheckedUpdateInputSchema ]),
}).strict();

export const SaleCreateManyArgsSchema: z.ZodType<Prisma.SaleCreateManyArgs> = z.object({
  data: z.union([ SaleCreateManyInputSchema, SaleCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SaleCreateManyAndReturnArgsSchema: z.ZodType<Prisma.SaleCreateManyAndReturnArgs> = z.object({
  data: z.union([ SaleCreateManyInputSchema, SaleCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SaleDeleteArgsSchema: z.ZodType<Prisma.SaleDeleteArgs> = z.object({
  select: SaleSelectSchema.optional(),
  include: SaleIncludeSchema.optional(),
  where: SaleWhereUniqueInputSchema, 
}).strict();

export const SaleUpdateArgsSchema: z.ZodType<Prisma.SaleUpdateArgs> = z.object({
  select: SaleSelectSchema.optional(),
  include: SaleIncludeSchema.optional(),
  data: z.union([ SaleUpdateInputSchema, SaleUncheckedUpdateInputSchema ]),
  where: SaleWhereUniqueInputSchema, 
}).strict();

export const SaleUpdateManyArgsSchema: z.ZodType<Prisma.SaleUpdateManyArgs> = z.object({
  data: z.union([ SaleUpdateManyMutationInputSchema, SaleUncheckedUpdateManyInputSchema ]),
  where: SaleWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SaleUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.SaleUpdateManyAndReturnArgs> = z.object({
  data: z.union([ SaleUpdateManyMutationInputSchema, SaleUncheckedUpdateManyInputSchema ]),
  where: SaleWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SaleDeleteManyArgsSchema: z.ZodType<Prisma.SaleDeleteManyArgs> = z.object({
  where: SaleWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const CashTransactionCreateArgsSchema: z.ZodType<Prisma.CashTransactionCreateArgs> = z.object({
  select: CashTransactionSelectSchema.optional(),
  include: CashTransactionIncludeSchema.optional(),
  data: z.union([ CashTransactionCreateInputSchema, CashTransactionUncheckedCreateInputSchema ]),
}).strict();

export const CashTransactionUpsertArgsSchema: z.ZodType<Prisma.CashTransactionUpsertArgs> = z.object({
  select: CashTransactionSelectSchema.optional(),
  include: CashTransactionIncludeSchema.optional(),
  where: CashTransactionWhereUniqueInputSchema, 
  create: z.union([ CashTransactionCreateInputSchema, CashTransactionUncheckedCreateInputSchema ]),
  update: z.union([ CashTransactionUpdateInputSchema, CashTransactionUncheckedUpdateInputSchema ]),
}).strict();

export const CashTransactionCreateManyArgsSchema: z.ZodType<Prisma.CashTransactionCreateManyArgs> = z.object({
  data: z.union([ CashTransactionCreateManyInputSchema, CashTransactionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const CashTransactionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.CashTransactionCreateManyAndReturnArgs> = z.object({
  data: z.union([ CashTransactionCreateManyInputSchema, CashTransactionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const CashTransactionDeleteArgsSchema: z.ZodType<Prisma.CashTransactionDeleteArgs> = z.object({
  select: CashTransactionSelectSchema.optional(),
  include: CashTransactionIncludeSchema.optional(),
  where: CashTransactionWhereUniqueInputSchema, 
}).strict();

export const CashTransactionUpdateArgsSchema: z.ZodType<Prisma.CashTransactionUpdateArgs> = z.object({
  select: CashTransactionSelectSchema.optional(),
  include: CashTransactionIncludeSchema.optional(),
  data: z.union([ CashTransactionUpdateInputSchema, CashTransactionUncheckedUpdateInputSchema ]),
  where: CashTransactionWhereUniqueInputSchema, 
}).strict();

export const CashTransactionUpdateManyArgsSchema: z.ZodType<Prisma.CashTransactionUpdateManyArgs> = z.object({
  data: z.union([ CashTransactionUpdateManyMutationInputSchema, CashTransactionUncheckedUpdateManyInputSchema ]),
  where: CashTransactionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const CashTransactionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.CashTransactionUpdateManyAndReturnArgs> = z.object({
  data: z.union([ CashTransactionUpdateManyMutationInputSchema, CashTransactionUncheckedUpdateManyInputSchema ]),
  where: CashTransactionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const CashTransactionDeleteManyArgsSchema: z.ZodType<Prisma.CashTransactionDeleteManyArgs> = z.object({
  where: CashTransactionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ArticleCreateArgsSchema: z.ZodType<Prisma.ArticleCreateArgs> = z.object({
  select: ArticleSelectSchema.optional(),
  include: ArticleIncludeSchema.optional(),
  data: z.union([ ArticleCreateInputSchema, ArticleUncheckedCreateInputSchema ]),
}).strict();

export const ArticleUpsertArgsSchema: z.ZodType<Prisma.ArticleUpsertArgs> = z.object({
  select: ArticleSelectSchema.optional(),
  include: ArticleIncludeSchema.optional(),
  where: ArticleWhereUniqueInputSchema, 
  create: z.union([ ArticleCreateInputSchema, ArticleUncheckedCreateInputSchema ]),
  update: z.union([ ArticleUpdateInputSchema, ArticleUncheckedUpdateInputSchema ]),
}).strict();

export const ArticleCreateManyArgsSchema: z.ZodType<Prisma.ArticleCreateManyArgs> = z.object({
  data: z.union([ ArticleCreateManyInputSchema, ArticleCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ArticleCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ArticleCreateManyAndReturnArgs> = z.object({
  data: z.union([ ArticleCreateManyInputSchema, ArticleCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ArticleDeleteArgsSchema: z.ZodType<Prisma.ArticleDeleteArgs> = z.object({
  select: ArticleSelectSchema.optional(),
  include: ArticleIncludeSchema.optional(),
  where: ArticleWhereUniqueInputSchema, 
}).strict();

export const ArticleUpdateArgsSchema: z.ZodType<Prisma.ArticleUpdateArgs> = z.object({
  select: ArticleSelectSchema.optional(),
  include: ArticleIncludeSchema.optional(),
  data: z.union([ ArticleUpdateInputSchema, ArticleUncheckedUpdateInputSchema ]),
  where: ArticleWhereUniqueInputSchema, 
}).strict();

export const ArticleUpdateManyArgsSchema: z.ZodType<Prisma.ArticleUpdateManyArgs> = z.object({
  data: z.union([ ArticleUpdateManyMutationInputSchema, ArticleUncheckedUpdateManyInputSchema ]),
  where: ArticleWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ArticleUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ArticleUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ArticleUpdateManyMutationInputSchema, ArticleUncheckedUpdateManyInputSchema ]),
  where: ArticleWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ArticleDeleteManyArgsSchema: z.ZodType<Prisma.ArticleDeleteManyArgs> = z.object({
  where: ArticleWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();