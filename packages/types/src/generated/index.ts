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

export const UserScalarFieldEnumSchema = z.enum(['id','email','password','role','createdAt','updatedAt','deletedAt']);

export const ContactScalarFieldEnumSchema = z.enum(['id','lastName','firstName','phoneNumber','city','postalCode','createdAt','updatedAt','deletedAt']);

export const DepositScalarFieldEnumSchema = z.enum(['id','sellerId','contributionStatus','contributionAmount','depositIndex','incrementStart','dropWorkstationId','type','collectWorkstationId','collectedAt','paymentAmount','chequeNumber','signature','createdAt','updatedAt','deletedAt','userId']);

export const SaleScalarFieldEnumSchema = z.enum(['id','buyerId','saleIndex','incrementStart','cardAmount','cashAmount','checkAmount','refundCardAmount','refundCashAmount','refundComment','createdAt','updatedAt','deletedAt','userId']);

export const ArticleScalarFieldEnumSchema = z.enum(['id','price','category','discipline','brand','model','size','color','code','year','depositIndex','identificationLetter','articleIndex','status','depositId','saleId','createdAt','updatedAt','deletedAt']);

export const PredepositScalarFieldEnumSchema = z.enum(['id','predepositIndex','sellerLastName','sellerFirstName','sellerPhoneNumber','sellerCity','depositId','createdAt','updatedAt','deletedAt']);

export const PredepositArticleScalarFieldEnumSchema = z.enum(['id','price','category','discipline','brand','model','size','color','year','identificationLetter','articleIndex','predepositId','createdAt','updatedAt','deletedAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const UserRoleSchema = z.enum(['ADMIN','BENEVOLE']);

export type UserRoleType = `${z.infer<typeof UserRoleSchema>}`

export const ContributionStatusSchema = z.enum(['PAYEE','A_PAYER','GRATUIT','PRO']);

export type ContributionStatusType = `${z.infer<typeof ContributionStatusSchema>}`

export const DepositTypeSchema = z.enum(['PRO','PARTICULIER']);

export type DepositTypeType = `${z.infer<typeof DepositTypeSchema>}`

export const ArticleStatusSchema = z.enum(['RECEPTION_PENDING','RECEPTION_OK','REFUSED']);

export type ArticleStatusType = `${z.infer<typeof ArticleStatusSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  role: UserRoleSchema,
  id: z.uuid(),
  email: z.string(),
  password: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// CONTACT SCHEMA
/////////////////////////////////////////

export const ContactSchema = z.object({
  id: z.uuid(),
  lastName: z.string(),
  firstName: z.string(),
  phoneNumber: z.string(),
  city: z.string().nullable(),
  postalCode: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

export type Contact = z.infer<typeof ContactSchema>

/////////////////////////////////////////
// DEPOSIT SCHEMA
/////////////////////////////////////////

export const DepositSchema = z.object({
  contributionStatus: ContributionStatusSchema,
  type: DepositTypeSchema,
  id: z.uuid(),
  sellerId: z.string(),
  contributionAmount: z.instanceof(Prisma.Decimal, { message: "Field 'contributionAmount' must be a Decimal. Location: ['Models', 'Deposit']"}),
  depositIndex: z.number().int(),
  incrementStart: z.number().int(),
  dropWorkstationId: z.number().int(),
  collectWorkstationId: z.number().int().nullable(),
  collectedAt: z.coerce.date().nullable(),
  paymentAmount: z.instanceof(Prisma.Decimal, { message: "Field 'paymentAmount' must be a Decimal. Location: ['Models', 'Deposit']"}).nullable(),
  chequeNumber: z.string().nullable(),
  signature: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  userId: z.string().nullable(),
})

export type Deposit = z.infer<typeof DepositSchema>

/////////////////////////////////////////
// SALE SCHEMA
/////////////////////////////////////////

export const SaleSchema = z.object({
  id: z.uuid(),
  buyerId: z.string(),
  saleIndex: z.number().int(),
  incrementStart: z.number().int(),
  cardAmount: z.instanceof(Prisma.Decimal, { message: "Field 'cardAmount' must be a Decimal. Location: ['Models', 'Sale']"}),
  cashAmount: z.instanceof(Prisma.Decimal, { message: "Field 'cashAmount' must be a Decimal. Location: ['Models', 'Sale']"}),
  checkAmount: z.instanceof(Prisma.Decimal, { message: "Field 'checkAmount' must be a Decimal. Location: ['Models', 'Sale']"}),
  refundCardAmount: z.instanceof(Prisma.Decimal, { message: "Field 'refundCardAmount' must be a Decimal. Location: ['Models', 'Sale']"}),
  refundCashAmount: z.instanceof(Prisma.Decimal, { message: "Field 'refundCashAmount' must be a Decimal. Location: ['Models', 'Sale']"}),
  refundComment: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  userId: z.string().nullable(),
})

export type Sale = z.infer<typeof SaleSchema>

/////////////////////////////////////////
// ARTICLE SCHEMA
/////////////////////////////////////////

export const ArticleSchema = z.object({
  status: ArticleStatusSchema,
  id: z.uuid(),
  price: z.instanceof(Prisma.Decimal, { message: "Field 'price' must be a Decimal. Location: ['Models', 'Article']"}).nullable(),
  category: z.string(),
  discipline: z.string(),
  brand: z.string(),
  model: z.string(),
  size: z.string(),
  color: z.string(),
  code: z.string(),
  year: z.number().int(),
  depositIndex: z.number().int(),
  identificationLetter: z.string(),
  articleIndex: z.number().int(),
  depositId: z.string().nullable(),
  saleId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

export type Article = z.infer<typeof ArticleSchema>

/////////////////////////////////////////
// PREDEPOSIT SCHEMA
/////////////////////////////////////////

export const PredepositSchema = z.object({
  id: z.uuid(),
  predepositIndex: z.number().int(),
  sellerLastName: z.string(),
  sellerFirstName: z.string(),
  sellerPhoneNumber: z.string(),
  sellerCity: z.string(),
  depositId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

export type Predeposit = z.infer<typeof PredepositSchema>

/////////////////////////////////////////
// PREDEPOSIT ARTICLE SCHEMA
/////////////////////////////////////////

export const PredepositArticleSchema = z.object({
  id: z.uuid(),
  price: z.instanceof(Prisma.Decimal, { message: "Field 'price' must be a Decimal. Location: ['Models', 'PredepositArticle']"}).nullable(),
  category: z.string(),
  discipline: z.string(),
  brand: z.string(),
  model: z.string(),
  size: z.string(),
  color: z.string(),
  year: z.number().int(),
  identificationLetter: z.string(),
  articleIndex: z.number().int(),
  predepositId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

export type PredepositArticle = z.infer<typeof PredepositArticleSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

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
  email: z.boolean().optional(),
  password: z.boolean().optional(),
  role: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  sales: z.union([z.boolean(),z.lazy(() => SaleFindManyArgsSchema)]).optional(),
  depots: z.union([z.boolean(),z.lazy(() => DepositFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

// CONTACT
//------------------------------------------------------

export const ContactIncludeSchema: z.ZodType<Prisma.ContactInclude> = z.object({
  sales: z.union([z.boolean(),z.lazy(() => SaleFindManyArgsSchema)]).optional(),
  depots: z.union([z.boolean(),z.lazy(() => DepositFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ContactCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const ContactArgsSchema: z.ZodType<Prisma.ContactDefaultArgs> = z.object({
  select: z.lazy(() => ContactSelectSchema).optional(),
  include: z.lazy(() => ContactIncludeSchema).optional(),
}).strict();

export const ContactCountOutputTypeArgsSchema: z.ZodType<Prisma.ContactCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => ContactCountOutputTypeSelectSchema).nullish(),
}).strict();

export const ContactCountOutputTypeSelectSchema: z.ZodType<Prisma.ContactCountOutputTypeSelect> = z.object({
  sales: z.boolean().optional(),
  depots: z.boolean().optional(),
}).strict();

export const ContactSelectSchema: z.ZodType<Prisma.ContactSelect> = z.object({
  id: z.boolean().optional(),
  lastName: z.boolean().optional(),
  firstName: z.boolean().optional(),
  phoneNumber: z.boolean().optional(),
  city: z.boolean().optional(),
  postalCode: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  sales: z.union([z.boolean(),z.lazy(() => SaleFindManyArgsSchema)]).optional(),
  depots: z.union([z.boolean(),z.lazy(() => DepositFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ContactCountOutputTypeArgsSchema)]).optional(),
}).strict()

// DEPOSIT
//------------------------------------------------------

export const DepositIncludeSchema: z.ZodType<Prisma.DepositInclude> = z.object({
  seller: z.union([z.boolean(),z.lazy(() => ContactArgsSchema)]).optional(),
  articles: z.union([z.boolean(),z.lazy(() => ArticleFindManyArgsSchema)]).optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  predeposits: z.union([z.boolean(),z.lazy(() => PredepositFindManyArgsSchema)]).optional(),
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
  predeposits: z.boolean().optional(),
}).strict();

export const DepositSelectSchema: z.ZodType<Prisma.DepositSelect> = z.object({
  id: z.boolean().optional(),
  sellerId: z.boolean().optional(),
  contributionStatus: z.boolean().optional(),
  contributionAmount: z.boolean().optional(),
  depositIndex: z.boolean().optional(),
  incrementStart: z.boolean().optional(),
  dropWorkstationId: z.boolean().optional(),
  type: z.boolean().optional(),
  collectWorkstationId: z.boolean().optional(),
  collectedAt: z.boolean().optional(),
  paymentAmount: z.boolean().optional(),
  chequeNumber: z.boolean().optional(),
  signature: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  userId: z.boolean().optional(),
  seller: z.union([z.boolean(),z.lazy(() => ContactArgsSchema)]).optional(),
  articles: z.union([z.boolean(),z.lazy(() => ArticleFindManyArgsSchema)]).optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  predeposits: z.union([z.boolean(),z.lazy(() => PredepositFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => DepositCountOutputTypeArgsSchema)]).optional(),
}).strict()

// SALE
//------------------------------------------------------

export const SaleIncludeSchema: z.ZodType<Prisma.SaleInclude> = z.object({
  buyer: z.union([z.boolean(),z.lazy(() => ContactArgsSchema)]).optional(),
  articles: z.union([z.boolean(),z.lazy(() => ArticleFindManyArgsSchema)]).optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
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
}).strict();

export const SaleSelectSchema: z.ZodType<Prisma.SaleSelect> = z.object({
  id: z.boolean().optional(),
  buyerId: z.boolean().optional(),
  saleIndex: z.boolean().optional(),
  incrementStart: z.boolean().optional(),
  cardAmount: z.boolean().optional(),
  cashAmount: z.boolean().optional(),
  checkAmount: z.boolean().optional(),
  refundCardAmount: z.boolean().optional(),
  refundCashAmount: z.boolean().optional(),
  refundComment: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  userId: z.boolean().optional(),
  buyer: z.union([z.boolean(),z.lazy(() => ContactArgsSchema)]).optional(),
  articles: z.union([z.boolean(),z.lazy(() => ArticleFindManyArgsSchema)]).optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => SaleCountOutputTypeArgsSchema)]).optional(),
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
  price: z.boolean().optional(),
  category: z.boolean().optional(),
  discipline: z.boolean().optional(),
  brand: z.boolean().optional(),
  model: z.boolean().optional(),
  size: z.boolean().optional(),
  color: z.boolean().optional(),
  code: z.boolean().optional(),
  year: z.boolean().optional(),
  depositIndex: z.boolean().optional(),
  identificationLetter: z.boolean().optional(),
  articleIndex: z.boolean().optional(),
  status: z.boolean().optional(),
  depositId: z.boolean().optional(),
  saleId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  deposit: z.union([z.boolean(),z.lazy(() => DepositArgsSchema)]).optional(),
  sale: z.union([z.boolean(),z.lazy(() => SaleArgsSchema)]).optional(),
}).strict()

// PREDEPOSIT
//------------------------------------------------------

export const PredepositIncludeSchema: z.ZodType<Prisma.PredepositInclude> = z.object({
  articles: z.union([z.boolean(),z.lazy(() => PredepositArticleFindManyArgsSchema)]).optional(),
  deposit: z.union([z.boolean(),z.lazy(() => DepositArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PredepositCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const PredepositArgsSchema: z.ZodType<Prisma.PredepositDefaultArgs> = z.object({
  select: z.lazy(() => PredepositSelectSchema).optional(),
  include: z.lazy(() => PredepositIncludeSchema).optional(),
}).strict();

export const PredepositCountOutputTypeArgsSchema: z.ZodType<Prisma.PredepositCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => PredepositCountOutputTypeSelectSchema).nullish(),
}).strict();

export const PredepositCountOutputTypeSelectSchema: z.ZodType<Prisma.PredepositCountOutputTypeSelect> = z.object({
  articles: z.boolean().optional(),
}).strict();

export const PredepositSelectSchema: z.ZodType<Prisma.PredepositSelect> = z.object({
  id: z.boolean().optional(),
  predepositIndex: z.boolean().optional(),
  sellerLastName: z.boolean().optional(),
  sellerFirstName: z.boolean().optional(),
  sellerPhoneNumber: z.boolean().optional(),
  sellerCity: z.boolean().optional(),
  depositId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  articles: z.union([z.boolean(),z.lazy(() => PredepositArticleFindManyArgsSchema)]).optional(),
  deposit: z.union([z.boolean(),z.lazy(() => DepositArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PredepositCountOutputTypeArgsSchema)]).optional(),
}).strict()

// PREDEPOSIT ARTICLE
//------------------------------------------------------

export const PredepositArticleIncludeSchema: z.ZodType<Prisma.PredepositArticleInclude> = z.object({
  predeposit: z.union([z.boolean(),z.lazy(() => PredepositArgsSchema)]).optional(),
}).strict();

export const PredepositArticleArgsSchema: z.ZodType<Prisma.PredepositArticleDefaultArgs> = z.object({
  select: z.lazy(() => PredepositArticleSelectSchema).optional(),
  include: z.lazy(() => PredepositArticleIncludeSchema).optional(),
}).strict();

export const PredepositArticleSelectSchema: z.ZodType<Prisma.PredepositArticleSelect> = z.object({
  id: z.boolean().optional(),
  price: z.boolean().optional(),
  category: z.boolean().optional(),
  discipline: z.boolean().optional(),
  brand: z.boolean().optional(),
  model: z.boolean().optional(),
  size: z.boolean().optional(),
  color: z.boolean().optional(),
  year: z.boolean().optional(),
  identificationLetter: z.boolean().optional(),
  articleIndex: z.boolean().optional(),
  predepositId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  predeposit: z.union([z.boolean(),z.lazy(() => PredepositArgsSchema)]).optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const UserWhereInputSchema: z.ZodType<Prisma.UserWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  password: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  role: z.union([ z.lazy(() => EnumUserRoleFilterSchema), z.lazy(() => UserRoleSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  sales: z.lazy(() => SaleListRelationFilterSchema).optional(),
  depots: z.lazy(() => DepositListRelationFilterSchema).optional(),
});

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
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
  email: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  password: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  role: z.union([ z.lazy(() => EnumUserRoleFilterSchema), z.lazy(() => UserRoleSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  sales: z.lazy(() => SaleListRelationFilterSchema).optional(),
  depots: z.lazy(() => DepositListRelationFilterSchema).optional(),
}));

export const UserOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
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
  email: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  password: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  role: z.union([ z.lazy(() => EnumUserRoleWithAggregatesFilterSchema), z.lazy(() => UserRoleSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const ContactWhereInputSchema: z.ZodType<Prisma.ContactWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ContactWhereInputSchema), z.lazy(() => ContactWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ContactWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ContactWhereInputSchema), z.lazy(() => ContactWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  lastName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  firstName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  phoneNumber: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  city: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  postalCode: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  sales: z.lazy(() => SaleListRelationFilterSchema).optional(),
  depots: z.lazy(() => DepositListRelationFilterSchema).optional(),
});

export const ContactOrderByWithRelationInputSchema: z.ZodType<Prisma.ContactOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.lazy(() => SortOrderSchema).optional(),
  city: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  postalCode: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  sales: z.lazy(() => SaleOrderByRelationAggregateInputSchema).optional(),
  depots: z.lazy(() => DepositOrderByRelationAggregateInputSchema).optional(),
});

export const ContactWhereUniqueInputSchema: z.ZodType<Prisma.ContactWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => ContactWhereInputSchema), z.lazy(() => ContactWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ContactWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ContactWhereInputSchema), z.lazy(() => ContactWhereInputSchema).array() ]).optional(),
  lastName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  firstName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  phoneNumber: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  city: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  postalCode: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  sales: z.lazy(() => SaleListRelationFilterSchema).optional(),
  depots: z.lazy(() => DepositListRelationFilterSchema).optional(),
}));

export const ContactOrderByWithAggregationInputSchema: z.ZodType<Prisma.ContactOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.lazy(() => SortOrderSchema).optional(),
  city: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  postalCode: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => ContactCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ContactMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ContactMinOrderByAggregateInputSchema).optional(),
});

export const ContactScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ContactScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ContactScalarWhereWithAggregatesInputSchema), z.lazy(() => ContactScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ContactScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ContactScalarWhereWithAggregatesInputSchema), z.lazy(() => ContactScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  lastName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  firstName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  phoneNumber: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
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
  sellerId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  contributionStatus: z.union([ z.lazy(() => EnumContributionStatusFilterSchema), z.lazy(() => ContributionStatusSchema) ]).optional(),
  contributionAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  depositIndex: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  incrementStart: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  dropWorkstationId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  type: z.union([ z.lazy(() => EnumDepositTypeFilterSchema), z.lazy(() => DepositTypeSchema) ]).optional(),
  collectWorkstationId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  collectedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  paymentAmount: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  chequeNumber: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  signature: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  seller: z.union([ z.lazy(() => ContactScalarRelationFilterSchema), z.lazy(() => ContactWhereInputSchema) ]).optional(),
  articles: z.lazy(() => ArticleListRelationFilterSchema).optional(),
  user: z.union([ z.lazy(() => UserNullableScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional().nullable(),
  predeposits: z.lazy(() => PredepositListRelationFilterSchema).optional(),
});

export const DepositOrderByWithRelationInputSchema: z.ZodType<Prisma.DepositOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  sellerId: z.lazy(() => SortOrderSchema).optional(),
  contributionStatus: z.lazy(() => SortOrderSchema).optional(),
  contributionAmount: z.lazy(() => SortOrderSchema).optional(),
  depositIndex: z.lazy(() => SortOrderSchema).optional(),
  incrementStart: z.lazy(() => SortOrderSchema).optional(),
  dropWorkstationId: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  collectWorkstationId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  collectedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  paymentAmount: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  chequeNumber: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  signature: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  userId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  seller: z.lazy(() => ContactOrderByWithRelationInputSchema).optional(),
  articles: z.lazy(() => ArticleOrderByRelationAggregateInputSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  predeposits: z.lazy(() => PredepositOrderByRelationAggregateInputSchema).optional(),
});

export const DepositWhereUniqueInputSchema: z.ZodType<Prisma.DepositWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => DepositWhereInputSchema), z.lazy(() => DepositWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => DepositWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DepositWhereInputSchema), z.lazy(() => DepositWhereInputSchema).array() ]).optional(),
  sellerId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  contributionStatus: z.union([ z.lazy(() => EnumContributionStatusFilterSchema), z.lazy(() => ContributionStatusSchema) ]).optional(),
  contributionAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  depositIndex: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  incrementStart: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  dropWorkstationId: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  type: z.union([ z.lazy(() => EnumDepositTypeFilterSchema), z.lazy(() => DepositTypeSchema) ]).optional(),
  collectWorkstationId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  collectedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  paymentAmount: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  chequeNumber: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  signature: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  seller: z.union([ z.lazy(() => ContactScalarRelationFilterSchema), z.lazy(() => ContactWhereInputSchema) ]).optional(),
  articles: z.lazy(() => ArticleListRelationFilterSchema).optional(),
  user: z.union([ z.lazy(() => UserNullableScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional().nullable(),
  predeposits: z.lazy(() => PredepositListRelationFilterSchema).optional(),
}));

export const DepositOrderByWithAggregationInputSchema: z.ZodType<Prisma.DepositOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  sellerId: z.lazy(() => SortOrderSchema).optional(),
  contributionStatus: z.lazy(() => SortOrderSchema).optional(),
  contributionAmount: z.lazy(() => SortOrderSchema).optional(),
  depositIndex: z.lazy(() => SortOrderSchema).optional(),
  incrementStart: z.lazy(() => SortOrderSchema).optional(),
  dropWorkstationId: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  collectWorkstationId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  collectedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  paymentAmount: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  chequeNumber: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  signature: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  userId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => DepositCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => DepositAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => DepositMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => DepositMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => DepositSumOrderByAggregateInputSchema).optional(),
});

export const DepositScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.DepositScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => DepositScalarWhereWithAggregatesInputSchema), z.lazy(() => DepositScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => DepositScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DepositScalarWhereWithAggregatesInputSchema), z.lazy(() => DepositScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  sellerId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  contributionStatus: z.union([ z.lazy(() => EnumContributionStatusWithAggregatesFilterSchema), z.lazy(() => ContributionStatusSchema) ]).optional(),
  contributionAmount: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  depositIndex: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  incrementStart: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  dropWorkstationId: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  type: z.union([ z.lazy(() => EnumDepositTypeWithAggregatesFilterSchema), z.lazy(() => DepositTypeSchema) ]).optional(),
  collectWorkstationId: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  collectedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  paymentAmount: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  chequeNumber: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  signature: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => UuidNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
});

export const SaleWhereInputSchema: z.ZodType<Prisma.SaleWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SaleWhereInputSchema), z.lazy(() => SaleWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SaleWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SaleWhereInputSchema), z.lazy(() => SaleWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  buyerId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  saleIndex: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  incrementStart: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  cardAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  cashAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  checkAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  refundCardAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  refundCashAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  refundComment: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  buyer: z.union([ z.lazy(() => ContactScalarRelationFilterSchema), z.lazy(() => ContactWhereInputSchema) ]).optional(),
  articles: z.lazy(() => ArticleListRelationFilterSchema).optional(),
  user: z.union([ z.lazy(() => UserNullableScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional().nullable(),
});

export const SaleOrderByWithRelationInputSchema: z.ZodType<Prisma.SaleOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  buyerId: z.lazy(() => SortOrderSchema).optional(),
  saleIndex: z.lazy(() => SortOrderSchema).optional(),
  incrementStart: z.lazy(() => SortOrderSchema).optional(),
  cardAmount: z.lazy(() => SortOrderSchema).optional(),
  cashAmount: z.lazy(() => SortOrderSchema).optional(),
  checkAmount: z.lazy(() => SortOrderSchema).optional(),
  refundCardAmount: z.lazy(() => SortOrderSchema).optional(),
  refundCashAmount: z.lazy(() => SortOrderSchema).optional(),
  refundComment: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  userId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  buyer: z.lazy(() => ContactOrderByWithRelationInputSchema).optional(),
  articles: z.lazy(() => ArticleOrderByRelationAggregateInputSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
});

export const SaleWhereUniqueInputSchema: z.ZodType<Prisma.SaleWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => SaleWhereInputSchema), z.lazy(() => SaleWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SaleWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SaleWhereInputSchema), z.lazy(() => SaleWhereInputSchema).array() ]).optional(),
  buyerId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  saleIndex: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  incrementStart: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  cardAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  cashAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  checkAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  refundCardAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  refundCashAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  refundComment: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  buyer: z.union([ z.lazy(() => ContactScalarRelationFilterSchema), z.lazy(() => ContactWhereInputSchema) ]).optional(),
  articles: z.lazy(() => ArticleListRelationFilterSchema).optional(),
  user: z.union([ z.lazy(() => UserNullableScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional().nullable(),
}));

export const SaleOrderByWithAggregationInputSchema: z.ZodType<Prisma.SaleOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  buyerId: z.lazy(() => SortOrderSchema).optional(),
  saleIndex: z.lazy(() => SortOrderSchema).optional(),
  incrementStart: z.lazy(() => SortOrderSchema).optional(),
  cardAmount: z.lazy(() => SortOrderSchema).optional(),
  cashAmount: z.lazy(() => SortOrderSchema).optional(),
  checkAmount: z.lazy(() => SortOrderSchema).optional(),
  refundCardAmount: z.lazy(() => SortOrderSchema).optional(),
  refundCashAmount: z.lazy(() => SortOrderSchema).optional(),
  refundComment: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  userId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
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
  buyerId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  saleIndex: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  incrementStart: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  cardAmount: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  cashAmount: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  checkAmount: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  refundCardAmount: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  refundCashAmount: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  refundComment: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => UuidNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
});

export const ArticleWhereInputSchema: z.ZodType<Prisma.ArticleWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ArticleWhereInputSchema), z.lazy(() => ArticleWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ArticleWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ArticleWhereInputSchema), z.lazy(() => ArticleWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  price: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  discipline: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  brand: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  model: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  size: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  color: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  code: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  year: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  depositIndex: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  identificationLetter: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  articleIndex: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  status: z.union([ z.lazy(() => EnumArticleStatusFilterSchema), z.lazy(() => ArticleStatusSchema) ]).optional(),
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
  price: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  discipline: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  color: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  depositIndex: z.lazy(() => SortOrderSchema).optional(),
  identificationLetter: z.lazy(() => SortOrderSchema).optional(),
  articleIndex: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
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
  price: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  discipline: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  brand: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  model: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  size: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  color: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  year: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  depositIndex: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  identificationLetter: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  articleIndex: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  status: z.union([ z.lazy(() => EnumArticleStatusFilterSchema), z.lazy(() => ArticleStatusSchema) ]).optional(),
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
  price: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  discipline: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  color: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  depositIndex: z.lazy(() => SortOrderSchema).optional(),
  identificationLetter: z.lazy(() => SortOrderSchema).optional(),
  articleIndex: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
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
  price: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  discipline: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  brand: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  model: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  size: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  color: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  code: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  year: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  depositIndex: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  identificationLetter: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  articleIndex: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  status: z.union([ z.lazy(() => EnumArticleStatusWithAggregatesFilterSchema), z.lazy(() => ArticleStatusSchema) ]).optional(),
  depositId: z.union([ z.lazy(() => UuidNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  saleId: z.union([ z.lazy(() => UuidNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const PredepositWhereInputSchema: z.ZodType<Prisma.PredepositWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PredepositWhereInputSchema), z.lazy(() => PredepositWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PredepositWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PredepositWhereInputSchema), z.lazy(() => PredepositWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  predepositIndex: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  sellerLastName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sellerFirstName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sellerPhoneNumber: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sellerCity: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  depositId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  articles: z.lazy(() => PredepositArticleListRelationFilterSchema).optional(),
  deposit: z.union([ z.lazy(() => DepositNullableScalarRelationFilterSchema), z.lazy(() => DepositWhereInputSchema) ]).optional().nullable(),
});

export const PredepositOrderByWithRelationInputSchema: z.ZodType<Prisma.PredepositOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  predepositIndex: z.lazy(() => SortOrderSchema).optional(),
  sellerLastName: z.lazy(() => SortOrderSchema).optional(),
  sellerFirstName: z.lazy(() => SortOrderSchema).optional(),
  sellerPhoneNumber: z.lazy(() => SortOrderSchema).optional(),
  sellerCity: z.lazy(() => SortOrderSchema).optional(),
  depositId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  articles: z.lazy(() => PredepositArticleOrderByRelationAggregateInputSchema).optional(),
  deposit: z.lazy(() => DepositOrderByWithRelationInputSchema).optional(),
});

export const PredepositWhereUniqueInputSchema: z.ZodType<Prisma.PredepositWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => PredepositWhereInputSchema), z.lazy(() => PredepositWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PredepositWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PredepositWhereInputSchema), z.lazy(() => PredepositWhereInputSchema).array() ]).optional(),
  predepositIndex: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  sellerLastName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sellerFirstName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sellerPhoneNumber: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sellerCity: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  depositId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  articles: z.lazy(() => PredepositArticleListRelationFilterSchema).optional(),
  deposit: z.union([ z.lazy(() => DepositNullableScalarRelationFilterSchema), z.lazy(() => DepositWhereInputSchema) ]).optional().nullable(),
}));

export const PredepositOrderByWithAggregationInputSchema: z.ZodType<Prisma.PredepositOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  predepositIndex: z.lazy(() => SortOrderSchema).optional(),
  sellerLastName: z.lazy(() => SortOrderSchema).optional(),
  sellerFirstName: z.lazy(() => SortOrderSchema).optional(),
  sellerPhoneNumber: z.lazy(() => SortOrderSchema).optional(),
  sellerCity: z.lazy(() => SortOrderSchema).optional(),
  depositId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => PredepositCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => PredepositAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PredepositMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PredepositMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => PredepositSumOrderByAggregateInputSchema).optional(),
});

export const PredepositScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PredepositScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PredepositScalarWhereWithAggregatesInputSchema), z.lazy(() => PredepositScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PredepositScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PredepositScalarWhereWithAggregatesInputSchema), z.lazy(() => PredepositScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  predepositIndex: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  sellerLastName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  sellerFirstName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  sellerPhoneNumber: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  sellerCity: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  depositId: z.union([ z.lazy(() => UuidNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const PredepositArticleWhereInputSchema: z.ZodType<Prisma.PredepositArticleWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PredepositArticleWhereInputSchema), z.lazy(() => PredepositArticleWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PredepositArticleWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PredepositArticleWhereInputSchema), z.lazy(() => PredepositArticleWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  price: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  discipline: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  brand: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  model: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  size: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  color: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  year: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  identificationLetter: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  articleIndex: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  predepositId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  predeposit: z.union([ z.lazy(() => PredepositNullableScalarRelationFilterSchema), z.lazy(() => PredepositWhereInputSchema) ]).optional().nullable(),
});

export const PredepositArticleOrderByWithRelationInputSchema: z.ZodType<Prisma.PredepositArticleOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  price: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  discipline: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  color: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  identificationLetter: z.lazy(() => SortOrderSchema).optional(),
  articleIndex: z.lazy(() => SortOrderSchema).optional(),
  predepositId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  predeposit: z.lazy(() => PredepositOrderByWithRelationInputSchema).optional(),
});

export const PredepositArticleWhereUniqueInputSchema: z.ZodType<Prisma.PredepositArticleWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => PredepositArticleWhereInputSchema), z.lazy(() => PredepositArticleWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PredepositArticleWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PredepositArticleWhereInputSchema), z.lazy(() => PredepositArticleWhereInputSchema).array() ]).optional(),
  price: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  discipline: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  brand: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  model: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  size: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  color: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  year: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  identificationLetter: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  articleIndex: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  predepositId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  predeposit: z.union([ z.lazy(() => PredepositNullableScalarRelationFilterSchema), z.lazy(() => PredepositWhereInputSchema) ]).optional().nullable(),
}));

export const PredepositArticleOrderByWithAggregationInputSchema: z.ZodType<Prisma.PredepositArticleOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  price: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  discipline: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  color: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  identificationLetter: z.lazy(() => SortOrderSchema).optional(),
  articleIndex: z.lazy(() => SortOrderSchema).optional(),
  predepositId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => PredepositArticleCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => PredepositArticleAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PredepositArticleMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PredepositArticleMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => PredepositArticleSumOrderByAggregateInputSchema).optional(),
});

export const PredepositArticleScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PredepositArticleScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PredepositArticleScalarWhereWithAggregatesInputSchema), z.lazy(() => PredepositArticleScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PredepositArticleScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PredepositArticleScalarWhereWithAggregatesInputSchema), z.lazy(() => PredepositArticleScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema), z.string() ]).optional(),
  price: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  discipline: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  brand: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  model: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  size: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  color: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  year: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  identificationLetter: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  articleIndex: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  predepositId: z.union([ z.lazy(() => UuidNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  email: z.string(),
  password: z.string(),
  role: z.lazy(() => UserRoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleCreateNestedManyWithoutUserInputSchema).optional(),
  depots: z.lazy(() => DepositCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateInputSchema: z.ZodType<Prisma.UserUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  email: z.string(),
  password: z.string(),
  role: z.lazy(() => UserRoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  depots: z.lazy(() => DepositUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUpdateInputSchema: z.ZodType<Prisma.UserUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => UserRoleSchema), z.lazy(() => EnumUserRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUpdateManyWithoutUserNestedInputSchema).optional(),
  depots: z.lazy(() => DepositUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => UserRoleSchema), z.lazy(() => EnumUserRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  depots: z.lazy(() => DepositUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  email: z.string(),
  password: z.string(),
  role: z.lazy(() => UserRoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const UserUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => UserRoleSchema), z.lazy(() => EnumUserRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const UserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => UserRoleSchema), z.lazy(() => EnumUserRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ContactCreateInputSchema: z.ZodType<Prisma.ContactCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  lastName: z.string(),
  firstName: z.string(),
  phoneNumber: z.string(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleCreateNestedManyWithoutBuyerInputSchema).optional(),
  depots: z.lazy(() => DepositCreateNestedManyWithoutSellerInputSchema).optional(),
});

export const ContactUncheckedCreateInputSchema: z.ZodType<Prisma.ContactUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  lastName: z.string(),
  firstName: z.string(),
  phoneNumber: z.string(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleUncheckedCreateNestedManyWithoutBuyerInputSchema).optional(),
  depots: z.lazy(() => DepositUncheckedCreateNestedManyWithoutSellerInputSchema).optional(),
});

export const ContactUpdateInputSchema: z.ZodType<Prisma.ContactUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  city: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUpdateManyWithoutBuyerNestedInputSchema).optional(),
  depots: z.lazy(() => DepositUpdateManyWithoutSellerNestedInputSchema).optional(),
});

export const ContactUncheckedUpdateInputSchema: z.ZodType<Prisma.ContactUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  city: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUncheckedUpdateManyWithoutBuyerNestedInputSchema).optional(),
  depots: z.lazy(() => DepositUncheckedUpdateManyWithoutSellerNestedInputSchema).optional(),
});

export const ContactCreateManyInputSchema: z.ZodType<Prisma.ContactCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  lastName: z.string(),
  firstName: z.string(),
  phoneNumber: z.string(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const ContactUpdateManyMutationInputSchema: z.ZodType<Prisma.ContactUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  city: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ContactUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ContactUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  city: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const DepositCreateInputSchema: z.ZodType<Prisma.DepositCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  contributionAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  depositIndex: z.number().int(),
  incrementStart: z.number().int(),
  dropWorkstationId: z.number().int(),
  type: z.lazy(() => DepositTypeSchema).optional(),
  collectWorkstationId: z.number().int().optional().nullable(),
  collectedAt: z.coerce.date().optional().nullable(),
  paymentAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  seller: z.lazy(() => ContactCreateNestedOneWithoutDepotsInputSchema),
  articles: z.lazy(() => ArticleCreateNestedManyWithoutDepositInputSchema).optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutDepotsInputSchema).optional(),
  predeposits: z.lazy(() => PredepositCreateNestedManyWithoutDepositInputSchema).optional(),
});

export const DepositUncheckedCreateInputSchema: z.ZodType<Prisma.DepositUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  sellerId: z.string(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  contributionAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  depositIndex: z.number().int(),
  incrementStart: z.number().int(),
  dropWorkstationId: z.number().int(),
  type: z.lazy(() => DepositTypeSchema).optional(),
  collectWorkstationId: z.number().int().optional().nullable(),
  collectedAt: z.coerce.date().optional().nullable(),
  paymentAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  userId: z.string().optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedCreateNestedManyWithoutDepositInputSchema).optional(),
  predeposits: z.lazy(() => PredepositUncheckedCreateNestedManyWithoutDepositInputSchema).optional(),
});

export const DepositUpdateInputSchema: z.ZodType<Prisma.DepositUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  contributionAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  dropWorkstationId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => EnumDepositTypeFieldUpdateOperationsInputSchema) ]).optional(),
  collectWorkstationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  collectedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  chequeNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  signature: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  seller: z.lazy(() => ContactUpdateOneRequiredWithoutDepotsNestedInputSchema).optional(),
  articles: z.lazy(() => ArticleUpdateManyWithoutDepositNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneWithoutDepotsNestedInputSchema).optional(),
  predeposits: z.lazy(() => PredepositUpdateManyWithoutDepositNestedInputSchema).optional(),
});

export const DepositUncheckedUpdateInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  contributionAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  dropWorkstationId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => EnumDepositTypeFieldUpdateOperationsInputSchema) ]).optional(),
  collectWorkstationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  collectedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  chequeNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  signature: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedUpdateManyWithoutDepositNestedInputSchema).optional(),
  predeposits: z.lazy(() => PredepositUncheckedUpdateManyWithoutDepositNestedInputSchema).optional(),
});

export const DepositCreateManyInputSchema: z.ZodType<Prisma.DepositCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  sellerId: z.string(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  contributionAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  depositIndex: z.number().int(),
  incrementStart: z.number().int(),
  dropWorkstationId: z.number().int(),
  type: z.lazy(() => DepositTypeSchema).optional(),
  collectWorkstationId: z.number().int().optional().nullable(),
  collectedAt: z.coerce.date().optional().nullable(),
  paymentAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  userId: z.string().optional().nullable(),
});

export const DepositUpdateManyMutationInputSchema: z.ZodType<Prisma.DepositUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  contributionAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  dropWorkstationId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => EnumDepositTypeFieldUpdateOperationsInputSchema) ]).optional(),
  collectWorkstationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  collectedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  chequeNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  signature: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const DepositUncheckedUpdateManyInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  contributionAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  dropWorkstationId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => EnumDepositTypeFieldUpdateOperationsInputSchema) ]).optional(),
  collectWorkstationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  collectedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  chequeNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  signature: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SaleCreateInputSchema: z.ZodType<Prisma.SaleCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  saleIndex: z.number().int(),
  incrementStart: z.number().int().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundComment: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  buyer: z.lazy(() => ContactCreateNestedOneWithoutSalesInputSchema),
  articles: z.lazy(() => ArticleCreateNestedManyWithoutSaleInputSchema).optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutSalesInputSchema).optional(),
});

export const SaleUncheckedCreateInputSchema: z.ZodType<Prisma.SaleUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  buyerId: z.string(),
  saleIndex: z.number().int(),
  incrementStart: z.number().int().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundComment: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  userId: z.string().optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedCreateNestedManyWithoutSaleInputSchema).optional(),
});

export const SaleUpdateInputSchema: z.ZodType<Prisma.SaleUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  saleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundComment: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  buyer: z.lazy(() => ContactUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  articles: z.lazy(() => ArticleUpdateManyWithoutSaleNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneWithoutSalesNestedInputSchema).optional(),
});

export const SaleUncheckedUpdateInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  buyerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  saleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundComment: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const SaleCreateManyInputSchema: z.ZodType<Prisma.SaleCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  buyerId: z.string(),
  saleIndex: z.number().int(),
  incrementStart: z.number().int().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundComment: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  userId: z.string().optional().nullable(),
});

export const SaleUpdateManyMutationInputSchema: z.ZodType<Prisma.SaleUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  saleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundComment: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SaleUncheckedUpdateManyInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  buyerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  saleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundComment: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ArticleCreateInputSchema: z.ZodType<Prisma.ArticleCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  category: z.string(),
  discipline: z.string(),
  brand: z.string(),
  model: z.string(),
  size: z.string(),
  color: z.string(),
  code: z.string(),
  year: z.number().int(),
  depositIndex: z.number().int(),
  identificationLetter: z.string(),
  articleIndex: z.number().int(),
  status: z.lazy(() => ArticleStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  deposit: z.lazy(() => DepositCreateNestedOneWithoutArticlesInputSchema).optional(),
  sale: z.lazy(() => SaleCreateNestedOneWithoutArticlesInputSchema).optional(),
});

export const ArticleUncheckedCreateInputSchema: z.ZodType<Prisma.ArticleUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  category: z.string(),
  discipline: z.string(),
  brand: z.string(),
  model: z.string(),
  size: z.string(),
  color: z.string(),
  code: z.string(),
  year: z.number().int(),
  depositIndex: z.number().int(),
  identificationLetter: z.string(),
  articleIndex: z.number().int(),
  status: z.lazy(() => ArticleStatusSchema).optional(),
  depositId: z.string().optional().nullable(),
  saleId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const ArticleUpdateInputSchema: z.ZodType<Prisma.ArticleUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  color: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  identificationLetter: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  articleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => ArticleStatusSchema), z.lazy(() => EnumArticleStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deposit: z.lazy(() => DepositUpdateOneWithoutArticlesNestedInputSchema).optional(),
  sale: z.lazy(() => SaleUpdateOneWithoutArticlesNestedInputSchema).optional(),
});

export const ArticleUncheckedUpdateInputSchema: z.ZodType<Prisma.ArticleUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  color: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  identificationLetter: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  articleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => ArticleStatusSchema), z.lazy(() => EnumArticleStatusFieldUpdateOperationsInputSchema) ]).optional(),
  depositId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ArticleCreateManyInputSchema: z.ZodType<Prisma.ArticleCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  category: z.string(),
  discipline: z.string(),
  brand: z.string(),
  model: z.string(),
  size: z.string(),
  color: z.string(),
  code: z.string(),
  year: z.number().int(),
  depositIndex: z.number().int(),
  identificationLetter: z.string(),
  articleIndex: z.number().int(),
  status: z.lazy(() => ArticleStatusSchema).optional(),
  depositId: z.string().optional().nullable(),
  saleId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const ArticleUpdateManyMutationInputSchema: z.ZodType<Prisma.ArticleUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  color: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  identificationLetter: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  articleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => ArticleStatusSchema), z.lazy(() => EnumArticleStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ArticleUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ArticleUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  color: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  identificationLetter: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  articleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => ArticleStatusSchema), z.lazy(() => EnumArticleStatusFieldUpdateOperationsInputSchema) ]).optional(),
  depositId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PredepositCreateInputSchema: z.ZodType<Prisma.PredepositCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  predepositIndex: z.number().int(),
  sellerLastName: z.string(),
  sellerFirstName: z.string(),
  sellerPhoneNumber: z.string(),
  sellerCity: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => PredepositArticleCreateNestedManyWithoutPredepositInputSchema).optional(),
  deposit: z.lazy(() => DepositCreateNestedOneWithoutPredepositsInputSchema).optional(),
});

export const PredepositUncheckedCreateInputSchema: z.ZodType<Prisma.PredepositUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  predepositIndex: z.number().int(),
  sellerLastName: z.string(),
  sellerFirstName: z.string(),
  sellerPhoneNumber: z.string(),
  sellerCity: z.string(),
  depositId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => PredepositArticleUncheckedCreateNestedManyWithoutPredepositInputSchema).optional(),
});

export const PredepositUpdateInputSchema: z.ZodType<Prisma.PredepositUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  predepositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sellerLastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerFirstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerPhoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerCity: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => PredepositArticleUpdateManyWithoutPredepositNestedInputSchema).optional(),
  deposit: z.lazy(() => DepositUpdateOneWithoutPredepositsNestedInputSchema).optional(),
});

export const PredepositUncheckedUpdateInputSchema: z.ZodType<Prisma.PredepositUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  predepositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sellerLastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerFirstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerPhoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerCity: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  depositId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => PredepositArticleUncheckedUpdateManyWithoutPredepositNestedInputSchema).optional(),
});

export const PredepositCreateManyInputSchema: z.ZodType<Prisma.PredepositCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  predepositIndex: z.number().int(),
  sellerLastName: z.string(),
  sellerFirstName: z.string(),
  sellerPhoneNumber: z.string(),
  sellerCity: z.string(),
  depositId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const PredepositUpdateManyMutationInputSchema: z.ZodType<Prisma.PredepositUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  predepositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sellerLastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerFirstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerPhoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerCity: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PredepositUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PredepositUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  predepositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sellerLastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerFirstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerPhoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerCity: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  depositId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PredepositArticleCreateInputSchema: z.ZodType<Prisma.PredepositArticleCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  category: z.string(),
  discipline: z.string(),
  brand: z.string(),
  model: z.string(),
  size: z.string(),
  color: z.string(),
  year: z.number().int(),
  identificationLetter: z.string(),
  articleIndex: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  predeposit: z.lazy(() => PredepositCreateNestedOneWithoutArticlesInputSchema).optional(),
});

export const PredepositArticleUncheckedCreateInputSchema: z.ZodType<Prisma.PredepositArticleUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  category: z.string(),
  discipline: z.string(),
  brand: z.string(),
  model: z.string(),
  size: z.string(),
  color: z.string(),
  year: z.number().int(),
  identificationLetter: z.string(),
  articleIndex: z.number().int(),
  predepositId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const PredepositArticleUpdateInputSchema: z.ZodType<Prisma.PredepositArticleUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  color: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  identificationLetter: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  articleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  predeposit: z.lazy(() => PredepositUpdateOneWithoutArticlesNestedInputSchema).optional(),
});

export const PredepositArticleUncheckedUpdateInputSchema: z.ZodType<Prisma.PredepositArticleUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  color: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  identificationLetter: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  articleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  predepositId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PredepositArticleCreateManyInputSchema: z.ZodType<Prisma.PredepositArticleCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  category: z.string(),
  discipline: z.string(),
  brand: z.string(),
  model: z.string(),
  size: z.string(),
  color: z.string(),
  year: z.number().int(),
  identificationLetter: z.string(),
  articleIndex: z.number().int(),
  predepositId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const PredepositArticleUpdateManyMutationInputSchema: z.ZodType<Prisma.PredepositArticleUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  color: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  identificationLetter: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  articleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PredepositArticleUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PredepositArticleUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  color: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  identificationLetter: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  articleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  predepositId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
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

export const EnumUserRoleFilterSchema: z.ZodType<Prisma.EnumUserRoleFilter> = z.strictObject({
  equals: z.lazy(() => UserRoleSchema).optional(),
  in: z.lazy(() => UserRoleSchema).array().optional(),
  notIn: z.lazy(() => UserRoleSchema).array().optional(),
  not: z.union([ z.lazy(() => UserRoleSchema), z.lazy(() => NestedEnumUserRoleFilterSchema) ]).optional(),
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

export const UserCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const UserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const UserMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
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

export const EnumUserRoleWithAggregatesFilterSchema: z.ZodType<Prisma.EnumUserRoleWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => UserRoleSchema).optional(),
  in: z.lazy(() => UserRoleSchema).array().optional(),
  notIn: z.lazy(() => UserRoleSchema).array().optional(),
  not: z.union([ z.lazy(() => UserRoleSchema), z.lazy(() => NestedEnumUserRoleWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumUserRoleFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumUserRoleFilterSchema).optional(),
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

export const ContactCountOrderByAggregateInputSchema: z.ZodType<Prisma.ContactCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.lazy(() => SortOrderSchema).optional(),
  city: z.lazy(() => SortOrderSchema).optional(),
  postalCode: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ContactMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ContactMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.lazy(() => SortOrderSchema).optional(),
  city: z.lazy(() => SortOrderSchema).optional(),
  postalCode: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ContactMinOrderByAggregateInputSchema: z.ZodType<Prisma.ContactMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.lazy(() => SortOrderSchema).optional(),
  city: z.lazy(() => SortOrderSchema).optional(),
  postalCode: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
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

export const EnumContributionStatusFilterSchema: z.ZodType<Prisma.EnumContributionStatusFilter> = z.strictObject({
  equals: z.lazy(() => ContributionStatusSchema).optional(),
  in: z.lazy(() => ContributionStatusSchema).array().optional(),
  notIn: z.lazy(() => ContributionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => NestedEnumContributionStatusFilterSchema) ]).optional(),
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

export const EnumDepositTypeFilterSchema: z.ZodType<Prisma.EnumDepositTypeFilter> = z.strictObject({
  equals: z.lazy(() => DepositTypeSchema).optional(),
  in: z.lazy(() => DepositTypeSchema).array().optional(),
  notIn: z.lazy(() => DepositTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => NestedEnumDepositTypeFilterSchema) ]).optional(),
});

export const IntNullableFilterSchema: z.ZodType<Prisma.IntNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
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

export const ContactScalarRelationFilterSchema: z.ZodType<Prisma.ContactScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => ContactWhereInputSchema).optional(),
  isNot: z.lazy(() => ContactWhereInputSchema).optional(),
});

export const ArticleListRelationFilterSchema: z.ZodType<Prisma.ArticleListRelationFilter> = z.strictObject({
  every: z.lazy(() => ArticleWhereInputSchema).optional(),
  some: z.lazy(() => ArticleWhereInputSchema).optional(),
  none: z.lazy(() => ArticleWhereInputSchema).optional(),
});

export const UserNullableScalarRelationFilterSchema: z.ZodType<Prisma.UserNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => UserWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => UserWhereInputSchema).optional().nullable(),
});

export const PredepositListRelationFilterSchema: z.ZodType<Prisma.PredepositListRelationFilter> = z.strictObject({
  every: z.lazy(() => PredepositWhereInputSchema).optional(),
  some: z.lazy(() => PredepositWhereInputSchema).optional(),
  none: z.lazy(() => PredepositWhereInputSchema).optional(),
});

export const ArticleOrderByRelationAggregateInputSchema: z.ZodType<Prisma.ArticleOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const PredepositOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PredepositOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const DepositCountOrderByAggregateInputSchema: z.ZodType<Prisma.DepositCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  sellerId: z.lazy(() => SortOrderSchema).optional(),
  contributionStatus: z.lazy(() => SortOrderSchema).optional(),
  contributionAmount: z.lazy(() => SortOrderSchema).optional(),
  depositIndex: z.lazy(() => SortOrderSchema).optional(),
  incrementStart: z.lazy(() => SortOrderSchema).optional(),
  dropWorkstationId: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  collectWorkstationId: z.lazy(() => SortOrderSchema).optional(),
  collectedAt: z.lazy(() => SortOrderSchema).optional(),
  paymentAmount: z.lazy(() => SortOrderSchema).optional(),
  chequeNumber: z.lazy(() => SortOrderSchema).optional(),
  signature: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
});

export const DepositAvgOrderByAggregateInputSchema: z.ZodType<Prisma.DepositAvgOrderByAggregateInput> = z.strictObject({
  contributionAmount: z.lazy(() => SortOrderSchema).optional(),
  depositIndex: z.lazy(() => SortOrderSchema).optional(),
  incrementStart: z.lazy(() => SortOrderSchema).optional(),
  dropWorkstationId: z.lazy(() => SortOrderSchema).optional(),
  collectWorkstationId: z.lazy(() => SortOrderSchema).optional(),
  paymentAmount: z.lazy(() => SortOrderSchema).optional(),
});

export const DepositMaxOrderByAggregateInputSchema: z.ZodType<Prisma.DepositMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  sellerId: z.lazy(() => SortOrderSchema).optional(),
  contributionStatus: z.lazy(() => SortOrderSchema).optional(),
  contributionAmount: z.lazy(() => SortOrderSchema).optional(),
  depositIndex: z.lazy(() => SortOrderSchema).optional(),
  incrementStart: z.lazy(() => SortOrderSchema).optional(),
  dropWorkstationId: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  collectWorkstationId: z.lazy(() => SortOrderSchema).optional(),
  collectedAt: z.lazy(() => SortOrderSchema).optional(),
  paymentAmount: z.lazy(() => SortOrderSchema).optional(),
  chequeNumber: z.lazy(() => SortOrderSchema).optional(),
  signature: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
});

export const DepositMinOrderByAggregateInputSchema: z.ZodType<Prisma.DepositMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  sellerId: z.lazy(() => SortOrderSchema).optional(),
  contributionStatus: z.lazy(() => SortOrderSchema).optional(),
  contributionAmount: z.lazy(() => SortOrderSchema).optional(),
  depositIndex: z.lazy(() => SortOrderSchema).optional(),
  incrementStart: z.lazy(() => SortOrderSchema).optional(),
  dropWorkstationId: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  collectWorkstationId: z.lazy(() => SortOrderSchema).optional(),
  collectedAt: z.lazy(() => SortOrderSchema).optional(),
  paymentAmount: z.lazy(() => SortOrderSchema).optional(),
  chequeNumber: z.lazy(() => SortOrderSchema).optional(),
  signature: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
});

export const DepositSumOrderByAggregateInputSchema: z.ZodType<Prisma.DepositSumOrderByAggregateInput> = z.strictObject({
  contributionAmount: z.lazy(() => SortOrderSchema).optional(),
  depositIndex: z.lazy(() => SortOrderSchema).optional(),
  incrementStart: z.lazy(() => SortOrderSchema).optional(),
  dropWorkstationId: z.lazy(() => SortOrderSchema).optional(),
  collectWorkstationId: z.lazy(() => SortOrderSchema).optional(),
  paymentAmount: z.lazy(() => SortOrderSchema).optional(),
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

export const EnumDepositTypeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumDepositTypeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => DepositTypeSchema).optional(),
  in: z.lazy(() => DepositTypeSchema).array().optional(),
  notIn: z.lazy(() => DepositTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => NestedEnumDepositTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumDepositTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumDepositTypeFilterSchema).optional(),
});

export const IntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.IntNullableWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
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

export const SaleCountOrderByAggregateInputSchema: z.ZodType<Prisma.SaleCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  buyerId: z.lazy(() => SortOrderSchema).optional(),
  saleIndex: z.lazy(() => SortOrderSchema).optional(),
  incrementStart: z.lazy(() => SortOrderSchema).optional(),
  cardAmount: z.lazy(() => SortOrderSchema).optional(),
  cashAmount: z.lazy(() => SortOrderSchema).optional(),
  checkAmount: z.lazy(() => SortOrderSchema).optional(),
  refundCardAmount: z.lazy(() => SortOrderSchema).optional(),
  refundCashAmount: z.lazy(() => SortOrderSchema).optional(),
  refundComment: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
});

export const SaleAvgOrderByAggregateInputSchema: z.ZodType<Prisma.SaleAvgOrderByAggregateInput> = z.strictObject({
  saleIndex: z.lazy(() => SortOrderSchema).optional(),
  incrementStart: z.lazy(() => SortOrderSchema).optional(),
  cardAmount: z.lazy(() => SortOrderSchema).optional(),
  cashAmount: z.lazy(() => SortOrderSchema).optional(),
  checkAmount: z.lazy(() => SortOrderSchema).optional(),
  refundCardAmount: z.lazy(() => SortOrderSchema).optional(),
  refundCashAmount: z.lazy(() => SortOrderSchema).optional(),
});

export const SaleMaxOrderByAggregateInputSchema: z.ZodType<Prisma.SaleMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  buyerId: z.lazy(() => SortOrderSchema).optional(),
  saleIndex: z.lazy(() => SortOrderSchema).optional(),
  incrementStart: z.lazy(() => SortOrderSchema).optional(),
  cardAmount: z.lazy(() => SortOrderSchema).optional(),
  cashAmount: z.lazy(() => SortOrderSchema).optional(),
  checkAmount: z.lazy(() => SortOrderSchema).optional(),
  refundCardAmount: z.lazy(() => SortOrderSchema).optional(),
  refundCashAmount: z.lazy(() => SortOrderSchema).optional(),
  refundComment: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
});

export const SaleMinOrderByAggregateInputSchema: z.ZodType<Prisma.SaleMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  buyerId: z.lazy(() => SortOrderSchema).optional(),
  saleIndex: z.lazy(() => SortOrderSchema).optional(),
  incrementStart: z.lazy(() => SortOrderSchema).optional(),
  cardAmount: z.lazy(() => SortOrderSchema).optional(),
  cashAmount: z.lazy(() => SortOrderSchema).optional(),
  checkAmount: z.lazy(() => SortOrderSchema).optional(),
  refundCardAmount: z.lazy(() => SortOrderSchema).optional(),
  refundCashAmount: z.lazy(() => SortOrderSchema).optional(),
  refundComment: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
});

export const SaleSumOrderByAggregateInputSchema: z.ZodType<Prisma.SaleSumOrderByAggregateInput> = z.strictObject({
  saleIndex: z.lazy(() => SortOrderSchema).optional(),
  incrementStart: z.lazy(() => SortOrderSchema).optional(),
  cardAmount: z.lazy(() => SortOrderSchema).optional(),
  cashAmount: z.lazy(() => SortOrderSchema).optional(),
  checkAmount: z.lazy(() => SortOrderSchema).optional(),
  refundCardAmount: z.lazy(() => SortOrderSchema).optional(),
  refundCashAmount: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumArticleStatusFilterSchema: z.ZodType<Prisma.EnumArticleStatusFilter> = z.strictObject({
  equals: z.lazy(() => ArticleStatusSchema).optional(),
  in: z.lazy(() => ArticleStatusSchema).array().optional(),
  notIn: z.lazy(() => ArticleStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => ArticleStatusSchema), z.lazy(() => NestedEnumArticleStatusFilterSchema) ]).optional(),
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
  price: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  discipline: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  color: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  depositIndex: z.lazy(() => SortOrderSchema).optional(),
  identificationLetter: z.lazy(() => SortOrderSchema).optional(),
  articleIndex: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  depositId: z.lazy(() => SortOrderSchema).optional(),
  saleId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ArticleAvgOrderByAggregateInputSchema: z.ZodType<Prisma.ArticleAvgOrderByAggregateInput> = z.strictObject({
  price: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  depositIndex: z.lazy(() => SortOrderSchema).optional(),
  articleIndex: z.lazy(() => SortOrderSchema).optional(),
});

export const ArticleMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ArticleMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  discipline: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  color: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  depositIndex: z.lazy(() => SortOrderSchema).optional(),
  identificationLetter: z.lazy(() => SortOrderSchema).optional(),
  articleIndex: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  depositId: z.lazy(() => SortOrderSchema).optional(),
  saleId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ArticleMinOrderByAggregateInputSchema: z.ZodType<Prisma.ArticleMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  discipline: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  color: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  depositIndex: z.lazy(() => SortOrderSchema).optional(),
  identificationLetter: z.lazy(() => SortOrderSchema).optional(),
  articleIndex: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  depositId: z.lazy(() => SortOrderSchema).optional(),
  saleId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ArticleSumOrderByAggregateInputSchema: z.ZodType<Prisma.ArticleSumOrderByAggregateInput> = z.strictObject({
  price: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  depositIndex: z.lazy(() => SortOrderSchema).optional(),
  articleIndex: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumArticleStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumArticleStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => ArticleStatusSchema).optional(),
  in: z.lazy(() => ArticleStatusSchema).array().optional(),
  notIn: z.lazy(() => ArticleStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => ArticleStatusSchema), z.lazy(() => NestedEnumArticleStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumArticleStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumArticleStatusFilterSchema).optional(),
});

export const PredepositArticleListRelationFilterSchema: z.ZodType<Prisma.PredepositArticleListRelationFilter> = z.strictObject({
  every: z.lazy(() => PredepositArticleWhereInputSchema).optional(),
  some: z.lazy(() => PredepositArticleWhereInputSchema).optional(),
  none: z.lazy(() => PredepositArticleWhereInputSchema).optional(),
});

export const PredepositArticleOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PredepositArticleOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const PredepositCountOrderByAggregateInputSchema: z.ZodType<Prisma.PredepositCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  predepositIndex: z.lazy(() => SortOrderSchema).optional(),
  sellerLastName: z.lazy(() => SortOrderSchema).optional(),
  sellerFirstName: z.lazy(() => SortOrderSchema).optional(),
  sellerPhoneNumber: z.lazy(() => SortOrderSchema).optional(),
  sellerCity: z.lazy(() => SortOrderSchema).optional(),
  depositId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const PredepositAvgOrderByAggregateInputSchema: z.ZodType<Prisma.PredepositAvgOrderByAggregateInput> = z.strictObject({
  predepositIndex: z.lazy(() => SortOrderSchema).optional(),
});

export const PredepositMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PredepositMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  predepositIndex: z.lazy(() => SortOrderSchema).optional(),
  sellerLastName: z.lazy(() => SortOrderSchema).optional(),
  sellerFirstName: z.lazy(() => SortOrderSchema).optional(),
  sellerPhoneNumber: z.lazy(() => SortOrderSchema).optional(),
  sellerCity: z.lazy(() => SortOrderSchema).optional(),
  depositId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const PredepositMinOrderByAggregateInputSchema: z.ZodType<Prisma.PredepositMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  predepositIndex: z.lazy(() => SortOrderSchema).optional(),
  sellerLastName: z.lazy(() => SortOrderSchema).optional(),
  sellerFirstName: z.lazy(() => SortOrderSchema).optional(),
  sellerPhoneNumber: z.lazy(() => SortOrderSchema).optional(),
  sellerCity: z.lazy(() => SortOrderSchema).optional(),
  depositId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const PredepositSumOrderByAggregateInputSchema: z.ZodType<Prisma.PredepositSumOrderByAggregateInput> = z.strictObject({
  predepositIndex: z.lazy(() => SortOrderSchema).optional(),
});

export const PredepositNullableScalarRelationFilterSchema: z.ZodType<Prisma.PredepositNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => PredepositWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => PredepositWhereInputSchema).optional().nullable(),
});

export const PredepositArticleCountOrderByAggregateInputSchema: z.ZodType<Prisma.PredepositArticleCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  discipline: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  color: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  identificationLetter: z.lazy(() => SortOrderSchema).optional(),
  articleIndex: z.lazy(() => SortOrderSchema).optional(),
  predepositId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const PredepositArticleAvgOrderByAggregateInputSchema: z.ZodType<Prisma.PredepositArticleAvgOrderByAggregateInput> = z.strictObject({
  price: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  articleIndex: z.lazy(() => SortOrderSchema).optional(),
});

export const PredepositArticleMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PredepositArticleMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  discipline: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  color: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  identificationLetter: z.lazy(() => SortOrderSchema).optional(),
  articleIndex: z.lazy(() => SortOrderSchema).optional(),
  predepositId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const PredepositArticleMinOrderByAggregateInputSchema: z.ZodType<Prisma.PredepositArticleMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  discipline: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  color: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  identificationLetter: z.lazy(() => SortOrderSchema).optional(),
  articleIndex: z.lazy(() => SortOrderSchema).optional(),
  predepositId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const PredepositArticleSumOrderByAggregateInputSchema: z.ZodType<Prisma.PredepositArticleSumOrderByAggregateInput> = z.strictObject({
  price: z.lazy(() => SortOrderSchema).optional(),
  year: z.lazy(() => SortOrderSchema).optional(),
  articleIndex: z.lazy(() => SortOrderSchema).optional(),
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

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional(),
});

export const EnumUserRoleFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumUserRoleFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => UserRoleSchema).optional(),
});

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional(),
});

export const NullableDateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional().nullable(),
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

export const SaleCreateNestedManyWithoutBuyerInputSchema: z.ZodType<Prisma.SaleCreateNestedManyWithoutBuyerInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutBuyerInputSchema), z.lazy(() => SaleCreateWithoutBuyerInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutBuyerInputSchema), z.lazy(() => SaleUncheckedCreateWithoutBuyerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutBuyerInputSchema), z.lazy(() => SaleCreateOrConnectWithoutBuyerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyBuyerInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
});

export const DepositCreateNestedManyWithoutSellerInputSchema: z.ZodType<Prisma.DepositCreateNestedManyWithoutSellerInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutSellerInputSchema), z.lazy(() => DepositCreateWithoutSellerInputSchema).array(), z.lazy(() => DepositUncheckedCreateWithoutSellerInputSchema), z.lazy(() => DepositUncheckedCreateWithoutSellerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DepositCreateOrConnectWithoutSellerInputSchema), z.lazy(() => DepositCreateOrConnectWithoutSellerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DepositCreateManySellerInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
});

export const SaleUncheckedCreateNestedManyWithoutBuyerInputSchema: z.ZodType<Prisma.SaleUncheckedCreateNestedManyWithoutBuyerInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutBuyerInputSchema), z.lazy(() => SaleCreateWithoutBuyerInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutBuyerInputSchema), z.lazy(() => SaleUncheckedCreateWithoutBuyerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutBuyerInputSchema), z.lazy(() => SaleCreateOrConnectWithoutBuyerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyBuyerInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
});

export const DepositUncheckedCreateNestedManyWithoutSellerInputSchema: z.ZodType<Prisma.DepositUncheckedCreateNestedManyWithoutSellerInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutSellerInputSchema), z.lazy(() => DepositCreateWithoutSellerInputSchema).array(), z.lazy(() => DepositUncheckedCreateWithoutSellerInputSchema), z.lazy(() => DepositUncheckedCreateWithoutSellerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DepositCreateOrConnectWithoutSellerInputSchema), z.lazy(() => DepositCreateOrConnectWithoutSellerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DepositCreateManySellerInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
});

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional().nullable(),
});

export const SaleUpdateManyWithoutBuyerNestedInputSchema: z.ZodType<Prisma.SaleUpdateManyWithoutBuyerNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutBuyerInputSchema), z.lazy(() => SaleCreateWithoutBuyerInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutBuyerInputSchema), z.lazy(() => SaleUncheckedCreateWithoutBuyerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutBuyerInputSchema), z.lazy(() => SaleCreateOrConnectWithoutBuyerInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SaleUpsertWithWhereUniqueWithoutBuyerInputSchema), z.lazy(() => SaleUpsertWithWhereUniqueWithoutBuyerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyBuyerInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SaleUpdateWithWhereUniqueWithoutBuyerInputSchema), z.lazy(() => SaleUpdateWithWhereUniqueWithoutBuyerInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SaleUpdateManyWithWhereWithoutBuyerInputSchema), z.lazy(() => SaleUpdateManyWithWhereWithoutBuyerInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SaleScalarWhereInputSchema), z.lazy(() => SaleScalarWhereInputSchema).array() ]).optional(),
});

export const DepositUpdateManyWithoutSellerNestedInputSchema: z.ZodType<Prisma.DepositUpdateManyWithoutSellerNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutSellerInputSchema), z.lazy(() => DepositCreateWithoutSellerInputSchema).array(), z.lazy(() => DepositUncheckedCreateWithoutSellerInputSchema), z.lazy(() => DepositUncheckedCreateWithoutSellerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DepositCreateOrConnectWithoutSellerInputSchema), z.lazy(() => DepositCreateOrConnectWithoutSellerInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => DepositUpsertWithWhereUniqueWithoutSellerInputSchema), z.lazy(() => DepositUpsertWithWhereUniqueWithoutSellerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DepositCreateManySellerInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => DepositUpdateWithWhereUniqueWithoutSellerInputSchema), z.lazy(() => DepositUpdateWithWhereUniqueWithoutSellerInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => DepositUpdateManyWithWhereWithoutSellerInputSchema), z.lazy(() => DepositUpdateManyWithWhereWithoutSellerInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => DepositScalarWhereInputSchema), z.lazy(() => DepositScalarWhereInputSchema).array() ]).optional(),
});

export const SaleUncheckedUpdateManyWithoutBuyerNestedInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateManyWithoutBuyerNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SaleCreateWithoutBuyerInputSchema), z.lazy(() => SaleCreateWithoutBuyerInputSchema).array(), z.lazy(() => SaleUncheckedCreateWithoutBuyerInputSchema), z.lazy(() => SaleUncheckedCreateWithoutBuyerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SaleCreateOrConnectWithoutBuyerInputSchema), z.lazy(() => SaleCreateOrConnectWithoutBuyerInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SaleUpsertWithWhereUniqueWithoutBuyerInputSchema), z.lazy(() => SaleUpsertWithWhereUniqueWithoutBuyerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SaleCreateManyBuyerInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SaleWhereUniqueInputSchema), z.lazy(() => SaleWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SaleUpdateWithWhereUniqueWithoutBuyerInputSchema), z.lazy(() => SaleUpdateWithWhereUniqueWithoutBuyerInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SaleUpdateManyWithWhereWithoutBuyerInputSchema), z.lazy(() => SaleUpdateManyWithWhereWithoutBuyerInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SaleScalarWhereInputSchema), z.lazy(() => SaleScalarWhereInputSchema).array() ]).optional(),
});

export const DepositUncheckedUpdateManyWithoutSellerNestedInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateManyWithoutSellerNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutSellerInputSchema), z.lazy(() => DepositCreateWithoutSellerInputSchema).array(), z.lazy(() => DepositUncheckedCreateWithoutSellerInputSchema), z.lazy(() => DepositUncheckedCreateWithoutSellerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DepositCreateOrConnectWithoutSellerInputSchema), z.lazy(() => DepositCreateOrConnectWithoutSellerInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => DepositUpsertWithWhereUniqueWithoutSellerInputSchema), z.lazy(() => DepositUpsertWithWhereUniqueWithoutSellerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DepositCreateManySellerInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => DepositWhereUniqueInputSchema), z.lazy(() => DepositWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => DepositUpdateWithWhereUniqueWithoutSellerInputSchema), z.lazy(() => DepositUpdateWithWhereUniqueWithoutSellerInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => DepositUpdateManyWithWhereWithoutSellerInputSchema), z.lazy(() => DepositUpdateManyWithWhereWithoutSellerInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => DepositScalarWhereInputSchema), z.lazy(() => DepositScalarWhereInputSchema).array() ]).optional(),
});

export const ContactCreateNestedOneWithoutDepotsInputSchema: z.ZodType<Prisma.ContactCreateNestedOneWithoutDepotsInput> = z.strictObject({
  create: z.union([ z.lazy(() => ContactCreateWithoutDepotsInputSchema), z.lazy(() => ContactUncheckedCreateWithoutDepotsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ContactCreateOrConnectWithoutDepotsInputSchema).optional(),
  connect: z.lazy(() => ContactWhereUniqueInputSchema).optional(),
});

export const ArticleCreateNestedManyWithoutDepositInputSchema: z.ZodType<Prisma.ArticleCreateNestedManyWithoutDepositInput> = z.strictObject({
  create: z.union([ z.lazy(() => ArticleCreateWithoutDepositInputSchema), z.lazy(() => ArticleCreateWithoutDepositInputSchema).array(), z.lazy(() => ArticleUncheckedCreateWithoutDepositInputSchema), z.lazy(() => ArticleUncheckedCreateWithoutDepositInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ArticleCreateOrConnectWithoutDepositInputSchema), z.lazy(() => ArticleCreateOrConnectWithoutDepositInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ArticleCreateManyDepositInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
});

export const UserCreateNestedOneWithoutDepotsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutDepotsInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutDepotsInputSchema), z.lazy(() => UserUncheckedCreateWithoutDepotsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutDepotsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const PredepositCreateNestedManyWithoutDepositInputSchema: z.ZodType<Prisma.PredepositCreateNestedManyWithoutDepositInput> = z.strictObject({
  create: z.union([ z.lazy(() => PredepositCreateWithoutDepositInputSchema), z.lazy(() => PredepositCreateWithoutDepositInputSchema).array(), z.lazy(() => PredepositUncheckedCreateWithoutDepositInputSchema), z.lazy(() => PredepositUncheckedCreateWithoutDepositInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PredepositCreateOrConnectWithoutDepositInputSchema), z.lazy(() => PredepositCreateOrConnectWithoutDepositInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PredepositCreateManyDepositInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PredepositWhereUniqueInputSchema), z.lazy(() => PredepositWhereUniqueInputSchema).array() ]).optional(),
});

export const ArticleUncheckedCreateNestedManyWithoutDepositInputSchema: z.ZodType<Prisma.ArticleUncheckedCreateNestedManyWithoutDepositInput> = z.strictObject({
  create: z.union([ z.lazy(() => ArticleCreateWithoutDepositInputSchema), z.lazy(() => ArticleCreateWithoutDepositInputSchema).array(), z.lazy(() => ArticleUncheckedCreateWithoutDepositInputSchema), z.lazy(() => ArticleUncheckedCreateWithoutDepositInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ArticleCreateOrConnectWithoutDepositInputSchema), z.lazy(() => ArticleCreateOrConnectWithoutDepositInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ArticleCreateManyDepositInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
});

export const PredepositUncheckedCreateNestedManyWithoutDepositInputSchema: z.ZodType<Prisma.PredepositUncheckedCreateNestedManyWithoutDepositInput> = z.strictObject({
  create: z.union([ z.lazy(() => PredepositCreateWithoutDepositInputSchema), z.lazy(() => PredepositCreateWithoutDepositInputSchema).array(), z.lazy(() => PredepositUncheckedCreateWithoutDepositInputSchema), z.lazy(() => PredepositUncheckedCreateWithoutDepositInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PredepositCreateOrConnectWithoutDepositInputSchema), z.lazy(() => PredepositCreateOrConnectWithoutDepositInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PredepositCreateManyDepositInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PredepositWhereUniqueInputSchema), z.lazy(() => PredepositWhereUniqueInputSchema).array() ]).optional(),
});

export const EnumContributionStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumContributionStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => ContributionStatusSchema).optional(),
});

export const DecimalFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DecimalFieldUpdateOperationsInput> = z.strictObject({
  set: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  increment: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  decrement: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  multiply: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  divide: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
});

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> = z.strictObject({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional(),
});

export const EnumDepositTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumDepositTypeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => DepositTypeSchema).optional(),
});

export const NullableIntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableIntFieldUpdateOperationsInput> = z.strictObject({
  set: z.number().optional().nullable(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional(),
});

export const NullableDecimalFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDecimalFieldUpdateOperationsInput> = z.strictObject({
  set: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  increment: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  decrement: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  multiply: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  divide: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
});

export const ContactUpdateOneRequiredWithoutDepotsNestedInputSchema: z.ZodType<Prisma.ContactUpdateOneRequiredWithoutDepotsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ContactCreateWithoutDepotsInputSchema), z.lazy(() => ContactUncheckedCreateWithoutDepotsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ContactCreateOrConnectWithoutDepotsInputSchema).optional(),
  upsert: z.lazy(() => ContactUpsertWithoutDepotsInputSchema).optional(),
  connect: z.lazy(() => ContactWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ContactUpdateToOneWithWhereWithoutDepotsInputSchema), z.lazy(() => ContactUpdateWithoutDepotsInputSchema), z.lazy(() => ContactUncheckedUpdateWithoutDepotsInputSchema) ]).optional(),
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

export const UserUpdateOneWithoutDepotsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneWithoutDepotsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutDepotsInputSchema), z.lazy(() => UserUncheckedCreateWithoutDepotsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutDepotsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutDepotsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => UserWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => UserWhereInputSchema) ]).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutDepotsInputSchema), z.lazy(() => UserUpdateWithoutDepotsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutDepotsInputSchema) ]).optional(),
});

export const PredepositUpdateManyWithoutDepositNestedInputSchema: z.ZodType<Prisma.PredepositUpdateManyWithoutDepositNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PredepositCreateWithoutDepositInputSchema), z.lazy(() => PredepositCreateWithoutDepositInputSchema).array(), z.lazy(() => PredepositUncheckedCreateWithoutDepositInputSchema), z.lazy(() => PredepositUncheckedCreateWithoutDepositInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PredepositCreateOrConnectWithoutDepositInputSchema), z.lazy(() => PredepositCreateOrConnectWithoutDepositInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PredepositUpsertWithWhereUniqueWithoutDepositInputSchema), z.lazy(() => PredepositUpsertWithWhereUniqueWithoutDepositInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PredepositCreateManyDepositInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PredepositWhereUniqueInputSchema), z.lazy(() => PredepositWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PredepositWhereUniqueInputSchema), z.lazy(() => PredepositWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PredepositWhereUniqueInputSchema), z.lazy(() => PredepositWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PredepositWhereUniqueInputSchema), z.lazy(() => PredepositWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PredepositUpdateWithWhereUniqueWithoutDepositInputSchema), z.lazy(() => PredepositUpdateWithWhereUniqueWithoutDepositInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PredepositUpdateManyWithWhereWithoutDepositInputSchema), z.lazy(() => PredepositUpdateManyWithWhereWithoutDepositInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PredepositScalarWhereInputSchema), z.lazy(() => PredepositScalarWhereInputSchema).array() ]).optional(),
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

export const PredepositUncheckedUpdateManyWithoutDepositNestedInputSchema: z.ZodType<Prisma.PredepositUncheckedUpdateManyWithoutDepositNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PredepositCreateWithoutDepositInputSchema), z.lazy(() => PredepositCreateWithoutDepositInputSchema).array(), z.lazy(() => PredepositUncheckedCreateWithoutDepositInputSchema), z.lazy(() => PredepositUncheckedCreateWithoutDepositInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PredepositCreateOrConnectWithoutDepositInputSchema), z.lazy(() => PredepositCreateOrConnectWithoutDepositInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PredepositUpsertWithWhereUniqueWithoutDepositInputSchema), z.lazy(() => PredepositUpsertWithWhereUniqueWithoutDepositInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PredepositCreateManyDepositInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PredepositWhereUniqueInputSchema), z.lazy(() => PredepositWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PredepositWhereUniqueInputSchema), z.lazy(() => PredepositWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PredepositWhereUniqueInputSchema), z.lazy(() => PredepositWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PredepositWhereUniqueInputSchema), z.lazy(() => PredepositWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PredepositUpdateWithWhereUniqueWithoutDepositInputSchema), z.lazy(() => PredepositUpdateWithWhereUniqueWithoutDepositInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PredepositUpdateManyWithWhereWithoutDepositInputSchema), z.lazy(() => PredepositUpdateManyWithWhereWithoutDepositInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PredepositScalarWhereInputSchema), z.lazy(() => PredepositScalarWhereInputSchema).array() ]).optional(),
});

export const ContactCreateNestedOneWithoutSalesInputSchema: z.ZodType<Prisma.ContactCreateNestedOneWithoutSalesInput> = z.strictObject({
  create: z.union([ z.lazy(() => ContactCreateWithoutSalesInputSchema), z.lazy(() => ContactUncheckedCreateWithoutSalesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ContactCreateOrConnectWithoutSalesInputSchema).optional(),
  connect: z.lazy(() => ContactWhereUniqueInputSchema).optional(),
});

export const ArticleCreateNestedManyWithoutSaleInputSchema: z.ZodType<Prisma.ArticleCreateNestedManyWithoutSaleInput> = z.strictObject({
  create: z.union([ z.lazy(() => ArticleCreateWithoutSaleInputSchema), z.lazy(() => ArticleCreateWithoutSaleInputSchema).array(), z.lazy(() => ArticleUncheckedCreateWithoutSaleInputSchema), z.lazy(() => ArticleUncheckedCreateWithoutSaleInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ArticleCreateOrConnectWithoutSaleInputSchema), z.lazy(() => ArticleCreateOrConnectWithoutSaleInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ArticleCreateManySaleInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
});

export const UserCreateNestedOneWithoutSalesInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutSalesInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutSalesInputSchema), z.lazy(() => UserUncheckedCreateWithoutSalesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSalesInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const ArticleUncheckedCreateNestedManyWithoutSaleInputSchema: z.ZodType<Prisma.ArticleUncheckedCreateNestedManyWithoutSaleInput> = z.strictObject({
  create: z.union([ z.lazy(() => ArticleCreateWithoutSaleInputSchema), z.lazy(() => ArticleCreateWithoutSaleInputSchema).array(), z.lazy(() => ArticleUncheckedCreateWithoutSaleInputSchema), z.lazy(() => ArticleUncheckedCreateWithoutSaleInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ArticleCreateOrConnectWithoutSaleInputSchema), z.lazy(() => ArticleCreateOrConnectWithoutSaleInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ArticleCreateManySaleInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ArticleWhereUniqueInputSchema), z.lazy(() => ArticleWhereUniqueInputSchema).array() ]).optional(),
});

export const ContactUpdateOneRequiredWithoutSalesNestedInputSchema: z.ZodType<Prisma.ContactUpdateOneRequiredWithoutSalesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ContactCreateWithoutSalesInputSchema), z.lazy(() => ContactUncheckedCreateWithoutSalesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ContactCreateOrConnectWithoutSalesInputSchema).optional(),
  upsert: z.lazy(() => ContactUpsertWithoutSalesInputSchema).optional(),
  connect: z.lazy(() => ContactWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ContactUpdateToOneWithWhereWithoutSalesInputSchema), z.lazy(() => ContactUpdateWithoutSalesInputSchema), z.lazy(() => ContactUncheckedUpdateWithoutSalesInputSchema) ]).optional(),
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

export const UserUpdateOneWithoutSalesNestedInputSchema: z.ZodType<Prisma.UserUpdateOneWithoutSalesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutSalesInputSchema), z.lazy(() => UserUncheckedCreateWithoutSalesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSalesInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutSalesInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => UserWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => UserWhereInputSchema) ]).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutSalesInputSchema), z.lazy(() => UserUpdateWithoutSalesInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSalesInputSchema) ]).optional(),
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

export const EnumArticleStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumArticleStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => ArticleStatusSchema).optional(),
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

export const PredepositArticleCreateNestedManyWithoutPredepositInputSchema: z.ZodType<Prisma.PredepositArticleCreateNestedManyWithoutPredepositInput> = z.strictObject({
  create: z.union([ z.lazy(() => PredepositArticleCreateWithoutPredepositInputSchema), z.lazy(() => PredepositArticleCreateWithoutPredepositInputSchema).array(), z.lazy(() => PredepositArticleUncheckedCreateWithoutPredepositInputSchema), z.lazy(() => PredepositArticleUncheckedCreateWithoutPredepositInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PredepositArticleCreateOrConnectWithoutPredepositInputSchema), z.lazy(() => PredepositArticleCreateOrConnectWithoutPredepositInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PredepositArticleCreateManyPredepositInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PredepositArticleWhereUniqueInputSchema), z.lazy(() => PredepositArticleWhereUniqueInputSchema).array() ]).optional(),
});

export const DepositCreateNestedOneWithoutPredepositsInputSchema: z.ZodType<Prisma.DepositCreateNestedOneWithoutPredepositsInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutPredepositsInputSchema), z.lazy(() => DepositUncheckedCreateWithoutPredepositsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => DepositCreateOrConnectWithoutPredepositsInputSchema).optional(),
  connect: z.lazy(() => DepositWhereUniqueInputSchema).optional(),
});

export const PredepositArticleUncheckedCreateNestedManyWithoutPredepositInputSchema: z.ZodType<Prisma.PredepositArticleUncheckedCreateNestedManyWithoutPredepositInput> = z.strictObject({
  create: z.union([ z.lazy(() => PredepositArticleCreateWithoutPredepositInputSchema), z.lazy(() => PredepositArticleCreateWithoutPredepositInputSchema).array(), z.lazy(() => PredepositArticleUncheckedCreateWithoutPredepositInputSchema), z.lazy(() => PredepositArticleUncheckedCreateWithoutPredepositInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PredepositArticleCreateOrConnectWithoutPredepositInputSchema), z.lazy(() => PredepositArticleCreateOrConnectWithoutPredepositInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PredepositArticleCreateManyPredepositInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PredepositArticleWhereUniqueInputSchema), z.lazy(() => PredepositArticleWhereUniqueInputSchema).array() ]).optional(),
});

export const PredepositArticleUpdateManyWithoutPredepositNestedInputSchema: z.ZodType<Prisma.PredepositArticleUpdateManyWithoutPredepositNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PredepositArticleCreateWithoutPredepositInputSchema), z.lazy(() => PredepositArticleCreateWithoutPredepositInputSchema).array(), z.lazy(() => PredepositArticleUncheckedCreateWithoutPredepositInputSchema), z.lazy(() => PredepositArticleUncheckedCreateWithoutPredepositInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PredepositArticleCreateOrConnectWithoutPredepositInputSchema), z.lazy(() => PredepositArticleCreateOrConnectWithoutPredepositInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PredepositArticleUpsertWithWhereUniqueWithoutPredepositInputSchema), z.lazy(() => PredepositArticleUpsertWithWhereUniqueWithoutPredepositInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PredepositArticleCreateManyPredepositInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PredepositArticleWhereUniqueInputSchema), z.lazy(() => PredepositArticleWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PredepositArticleWhereUniqueInputSchema), z.lazy(() => PredepositArticleWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PredepositArticleWhereUniqueInputSchema), z.lazy(() => PredepositArticleWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PredepositArticleWhereUniqueInputSchema), z.lazy(() => PredepositArticleWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PredepositArticleUpdateWithWhereUniqueWithoutPredepositInputSchema), z.lazy(() => PredepositArticleUpdateWithWhereUniqueWithoutPredepositInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PredepositArticleUpdateManyWithWhereWithoutPredepositInputSchema), z.lazy(() => PredepositArticleUpdateManyWithWhereWithoutPredepositInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PredepositArticleScalarWhereInputSchema), z.lazy(() => PredepositArticleScalarWhereInputSchema).array() ]).optional(),
});

export const DepositUpdateOneWithoutPredepositsNestedInputSchema: z.ZodType<Prisma.DepositUpdateOneWithoutPredepositsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => DepositCreateWithoutPredepositsInputSchema), z.lazy(() => DepositUncheckedCreateWithoutPredepositsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => DepositCreateOrConnectWithoutPredepositsInputSchema).optional(),
  upsert: z.lazy(() => DepositUpsertWithoutPredepositsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => DepositWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => DepositWhereInputSchema) ]).optional(),
  connect: z.lazy(() => DepositWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => DepositUpdateToOneWithWhereWithoutPredepositsInputSchema), z.lazy(() => DepositUpdateWithoutPredepositsInputSchema), z.lazy(() => DepositUncheckedUpdateWithoutPredepositsInputSchema) ]).optional(),
});

export const PredepositArticleUncheckedUpdateManyWithoutPredepositNestedInputSchema: z.ZodType<Prisma.PredepositArticleUncheckedUpdateManyWithoutPredepositNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PredepositArticleCreateWithoutPredepositInputSchema), z.lazy(() => PredepositArticleCreateWithoutPredepositInputSchema).array(), z.lazy(() => PredepositArticleUncheckedCreateWithoutPredepositInputSchema), z.lazy(() => PredepositArticleUncheckedCreateWithoutPredepositInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PredepositArticleCreateOrConnectWithoutPredepositInputSchema), z.lazy(() => PredepositArticleCreateOrConnectWithoutPredepositInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PredepositArticleUpsertWithWhereUniqueWithoutPredepositInputSchema), z.lazy(() => PredepositArticleUpsertWithWhereUniqueWithoutPredepositInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PredepositArticleCreateManyPredepositInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PredepositArticleWhereUniqueInputSchema), z.lazy(() => PredepositArticleWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PredepositArticleWhereUniqueInputSchema), z.lazy(() => PredepositArticleWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PredepositArticleWhereUniqueInputSchema), z.lazy(() => PredepositArticleWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PredepositArticleWhereUniqueInputSchema), z.lazy(() => PredepositArticleWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PredepositArticleUpdateWithWhereUniqueWithoutPredepositInputSchema), z.lazy(() => PredepositArticleUpdateWithWhereUniqueWithoutPredepositInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PredepositArticleUpdateManyWithWhereWithoutPredepositInputSchema), z.lazy(() => PredepositArticleUpdateManyWithWhereWithoutPredepositInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PredepositArticleScalarWhereInputSchema), z.lazy(() => PredepositArticleScalarWhereInputSchema).array() ]).optional(),
});

export const PredepositCreateNestedOneWithoutArticlesInputSchema: z.ZodType<Prisma.PredepositCreateNestedOneWithoutArticlesInput> = z.strictObject({
  create: z.union([ z.lazy(() => PredepositCreateWithoutArticlesInputSchema), z.lazy(() => PredepositUncheckedCreateWithoutArticlesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PredepositCreateOrConnectWithoutArticlesInputSchema).optional(),
  connect: z.lazy(() => PredepositWhereUniqueInputSchema).optional(),
});

export const PredepositUpdateOneWithoutArticlesNestedInputSchema: z.ZodType<Prisma.PredepositUpdateOneWithoutArticlesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PredepositCreateWithoutArticlesInputSchema), z.lazy(() => PredepositUncheckedCreateWithoutArticlesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PredepositCreateOrConnectWithoutArticlesInputSchema).optional(),
  upsert: z.lazy(() => PredepositUpsertWithoutArticlesInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => PredepositWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => PredepositWhereInputSchema) ]).optional(),
  connect: z.lazy(() => PredepositWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PredepositUpdateToOneWithWhereWithoutArticlesInputSchema), z.lazy(() => PredepositUpdateWithoutArticlesInputSchema), z.lazy(() => PredepositUncheckedUpdateWithoutArticlesInputSchema) ]).optional(),
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

export const NestedEnumUserRoleFilterSchema: z.ZodType<Prisma.NestedEnumUserRoleFilter> = z.strictObject({
  equals: z.lazy(() => UserRoleSchema).optional(),
  in: z.lazy(() => UserRoleSchema).array().optional(),
  notIn: z.lazy(() => UserRoleSchema).array().optional(),
  not: z.union([ z.lazy(() => UserRoleSchema), z.lazy(() => NestedEnumUserRoleFilterSchema) ]).optional(),
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

export const NestedEnumUserRoleWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumUserRoleWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => UserRoleSchema).optional(),
  in: z.lazy(() => UserRoleSchema).array().optional(),
  notIn: z.lazy(() => UserRoleSchema).array().optional(),
  not: z.union([ z.lazy(() => UserRoleSchema), z.lazy(() => NestedEnumUserRoleWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumUserRoleFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumUserRoleFilterSchema).optional(),
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

export const NestedEnumContributionStatusFilterSchema: z.ZodType<Prisma.NestedEnumContributionStatusFilter> = z.strictObject({
  equals: z.lazy(() => ContributionStatusSchema).optional(),
  in: z.lazy(() => ContributionStatusSchema).array().optional(),
  notIn: z.lazy(() => ContributionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => NestedEnumContributionStatusFilterSchema) ]).optional(),
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

export const NestedEnumDepositTypeFilterSchema: z.ZodType<Prisma.NestedEnumDepositTypeFilter> = z.strictObject({
  equals: z.lazy(() => DepositTypeSchema).optional(),
  in: z.lazy(() => DepositTypeSchema).array().optional(),
  notIn: z.lazy(() => DepositTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => NestedEnumDepositTypeFilterSchema) ]).optional(),
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

export const NestedEnumContributionStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumContributionStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => ContributionStatusSchema).optional(),
  in: z.lazy(() => ContributionStatusSchema).array().optional(),
  notIn: z.lazy(() => ContributionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => NestedEnumContributionStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumContributionStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumContributionStatusFilterSchema).optional(),
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

export const NestedEnumDepositTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumDepositTypeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => DepositTypeSchema).optional(),
  in: z.lazy(() => DepositTypeSchema).array().optional(),
  notIn: z.lazy(() => DepositTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => NestedEnumDepositTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumDepositTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumDepositTypeFilterSchema).optional(),
});

export const NestedIntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntNullableWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
});

export const NestedFloatNullableFilterSchema: z.ZodType<Prisma.NestedFloatNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableFilterSchema) ]).optional().nullable(),
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

export const NestedEnumArticleStatusFilterSchema: z.ZodType<Prisma.NestedEnumArticleStatusFilter> = z.strictObject({
  equals: z.lazy(() => ArticleStatusSchema).optional(),
  in: z.lazy(() => ArticleStatusSchema).array().optional(),
  notIn: z.lazy(() => ArticleStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => ArticleStatusSchema), z.lazy(() => NestedEnumArticleStatusFilterSchema) ]).optional(),
});

export const NestedEnumArticleStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumArticleStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => ArticleStatusSchema).optional(),
  in: z.lazy(() => ArticleStatusSchema).array().optional(),
  notIn: z.lazy(() => ArticleStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => ArticleStatusSchema), z.lazy(() => NestedEnumArticleStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumArticleStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumArticleStatusFilterSchema).optional(),
});

export const SaleCreateWithoutUserInputSchema: z.ZodType<Prisma.SaleCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  saleIndex: z.number().int(),
  incrementStart: z.number().int().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundComment: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  buyer: z.lazy(() => ContactCreateNestedOneWithoutSalesInputSchema),
  articles: z.lazy(() => ArticleCreateNestedManyWithoutSaleInputSchema).optional(),
});

export const SaleUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.SaleUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  buyerId: z.string(),
  saleIndex: z.number().int(),
  incrementStart: z.number().int().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundComment: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedCreateNestedManyWithoutSaleInputSchema).optional(),
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
  contributionAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  depositIndex: z.number().int(),
  incrementStart: z.number().int(),
  dropWorkstationId: z.number().int(),
  type: z.lazy(() => DepositTypeSchema).optional(),
  collectWorkstationId: z.number().int().optional().nullable(),
  collectedAt: z.coerce.date().optional().nullable(),
  paymentAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  seller: z.lazy(() => ContactCreateNestedOneWithoutDepotsInputSchema),
  articles: z.lazy(() => ArticleCreateNestedManyWithoutDepositInputSchema).optional(),
  predeposits: z.lazy(() => PredepositCreateNestedManyWithoutDepositInputSchema).optional(),
});

export const DepositUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.DepositUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  sellerId: z.string(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  contributionAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  depositIndex: z.number().int(),
  incrementStart: z.number().int(),
  dropWorkstationId: z.number().int(),
  type: z.lazy(() => DepositTypeSchema).optional(),
  collectWorkstationId: z.number().int().optional().nullable(),
  collectedAt: z.coerce.date().optional().nullable(),
  paymentAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedCreateNestedManyWithoutDepositInputSchema).optional(),
  predeposits: z.lazy(() => PredepositUncheckedCreateNestedManyWithoutDepositInputSchema).optional(),
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

export const SaleScalarWhereInputSchema: z.ZodType<Prisma.SaleScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SaleScalarWhereInputSchema), z.lazy(() => SaleScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SaleScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SaleScalarWhereInputSchema), z.lazy(() => SaleScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  buyerId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  saleIndex: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  incrementStart: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  cardAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  cashAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  checkAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  refundCardAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  refundCashAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  refundComment: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
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

export const DepositScalarWhereInputSchema: z.ZodType<Prisma.DepositScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => DepositScalarWhereInputSchema), z.lazy(() => DepositScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => DepositScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DepositScalarWhereInputSchema), z.lazy(() => DepositScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  sellerId: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  contributionStatus: z.union([ z.lazy(() => EnumContributionStatusFilterSchema), z.lazy(() => ContributionStatusSchema) ]).optional(),
  contributionAmount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  depositIndex: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  incrementStart: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  dropWorkstationId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  type: z.union([ z.lazy(() => EnumDepositTypeFilterSchema), z.lazy(() => DepositTypeSchema) ]).optional(),
  collectWorkstationId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  collectedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  paymentAmount: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  chequeNumber: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  signature: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
});

export const SaleCreateWithoutBuyerInputSchema: z.ZodType<Prisma.SaleCreateWithoutBuyerInput> = z.strictObject({
  id: z.uuid().optional(),
  saleIndex: z.number().int(),
  incrementStart: z.number().int().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundComment: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => ArticleCreateNestedManyWithoutSaleInputSchema).optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutSalesInputSchema).optional(),
});

export const SaleUncheckedCreateWithoutBuyerInputSchema: z.ZodType<Prisma.SaleUncheckedCreateWithoutBuyerInput> = z.strictObject({
  id: z.uuid().optional(),
  saleIndex: z.number().int(),
  incrementStart: z.number().int().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundComment: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  userId: z.string().optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedCreateNestedManyWithoutSaleInputSchema).optional(),
});

export const SaleCreateOrConnectWithoutBuyerInputSchema: z.ZodType<Prisma.SaleCreateOrConnectWithoutBuyerInput> = z.strictObject({
  where: z.lazy(() => SaleWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SaleCreateWithoutBuyerInputSchema), z.lazy(() => SaleUncheckedCreateWithoutBuyerInputSchema) ]),
});

export const SaleCreateManyBuyerInputEnvelopeSchema: z.ZodType<Prisma.SaleCreateManyBuyerInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => SaleCreateManyBuyerInputSchema), z.lazy(() => SaleCreateManyBuyerInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const DepositCreateWithoutSellerInputSchema: z.ZodType<Prisma.DepositCreateWithoutSellerInput> = z.strictObject({
  id: z.uuid().optional(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  contributionAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  depositIndex: z.number().int(),
  incrementStart: z.number().int(),
  dropWorkstationId: z.number().int(),
  type: z.lazy(() => DepositTypeSchema).optional(),
  collectWorkstationId: z.number().int().optional().nullable(),
  collectedAt: z.coerce.date().optional().nullable(),
  paymentAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => ArticleCreateNestedManyWithoutDepositInputSchema).optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutDepotsInputSchema).optional(),
  predeposits: z.lazy(() => PredepositCreateNestedManyWithoutDepositInputSchema).optional(),
});

export const DepositUncheckedCreateWithoutSellerInputSchema: z.ZodType<Prisma.DepositUncheckedCreateWithoutSellerInput> = z.strictObject({
  id: z.uuid().optional(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  contributionAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  depositIndex: z.number().int(),
  incrementStart: z.number().int(),
  dropWorkstationId: z.number().int(),
  type: z.lazy(() => DepositTypeSchema).optional(),
  collectWorkstationId: z.number().int().optional().nullable(),
  collectedAt: z.coerce.date().optional().nullable(),
  paymentAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  userId: z.string().optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedCreateNestedManyWithoutDepositInputSchema).optional(),
  predeposits: z.lazy(() => PredepositUncheckedCreateNestedManyWithoutDepositInputSchema).optional(),
});

export const DepositCreateOrConnectWithoutSellerInputSchema: z.ZodType<Prisma.DepositCreateOrConnectWithoutSellerInput> = z.strictObject({
  where: z.lazy(() => DepositWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => DepositCreateWithoutSellerInputSchema), z.lazy(() => DepositUncheckedCreateWithoutSellerInputSchema) ]),
});

export const DepositCreateManySellerInputEnvelopeSchema: z.ZodType<Prisma.DepositCreateManySellerInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => DepositCreateManySellerInputSchema), z.lazy(() => DepositCreateManySellerInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const SaleUpsertWithWhereUniqueWithoutBuyerInputSchema: z.ZodType<Prisma.SaleUpsertWithWhereUniqueWithoutBuyerInput> = z.strictObject({
  where: z.lazy(() => SaleWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SaleUpdateWithoutBuyerInputSchema), z.lazy(() => SaleUncheckedUpdateWithoutBuyerInputSchema) ]),
  create: z.union([ z.lazy(() => SaleCreateWithoutBuyerInputSchema), z.lazy(() => SaleUncheckedCreateWithoutBuyerInputSchema) ]),
});

export const SaleUpdateWithWhereUniqueWithoutBuyerInputSchema: z.ZodType<Prisma.SaleUpdateWithWhereUniqueWithoutBuyerInput> = z.strictObject({
  where: z.lazy(() => SaleWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SaleUpdateWithoutBuyerInputSchema), z.lazy(() => SaleUncheckedUpdateWithoutBuyerInputSchema) ]),
});

export const SaleUpdateManyWithWhereWithoutBuyerInputSchema: z.ZodType<Prisma.SaleUpdateManyWithWhereWithoutBuyerInput> = z.strictObject({
  where: z.lazy(() => SaleScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SaleUpdateManyMutationInputSchema), z.lazy(() => SaleUncheckedUpdateManyWithoutBuyerInputSchema) ]),
});

export const DepositUpsertWithWhereUniqueWithoutSellerInputSchema: z.ZodType<Prisma.DepositUpsertWithWhereUniqueWithoutSellerInput> = z.strictObject({
  where: z.lazy(() => DepositWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => DepositUpdateWithoutSellerInputSchema), z.lazy(() => DepositUncheckedUpdateWithoutSellerInputSchema) ]),
  create: z.union([ z.lazy(() => DepositCreateWithoutSellerInputSchema), z.lazy(() => DepositUncheckedCreateWithoutSellerInputSchema) ]),
});

export const DepositUpdateWithWhereUniqueWithoutSellerInputSchema: z.ZodType<Prisma.DepositUpdateWithWhereUniqueWithoutSellerInput> = z.strictObject({
  where: z.lazy(() => DepositWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => DepositUpdateWithoutSellerInputSchema), z.lazy(() => DepositUncheckedUpdateWithoutSellerInputSchema) ]),
});

export const DepositUpdateManyWithWhereWithoutSellerInputSchema: z.ZodType<Prisma.DepositUpdateManyWithWhereWithoutSellerInput> = z.strictObject({
  where: z.lazy(() => DepositScalarWhereInputSchema),
  data: z.union([ z.lazy(() => DepositUpdateManyMutationInputSchema), z.lazy(() => DepositUncheckedUpdateManyWithoutSellerInputSchema) ]),
});

export const ContactCreateWithoutDepotsInputSchema: z.ZodType<Prisma.ContactCreateWithoutDepotsInput> = z.strictObject({
  id: z.uuid().optional(),
  lastName: z.string(),
  firstName: z.string(),
  phoneNumber: z.string(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleCreateNestedManyWithoutBuyerInputSchema).optional(),
});

export const ContactUncheckedCreateWithoutDepotsInputSchema: z.ZodType<Prisma.ContactUncheckedCreateWithoutDepotsInput> = z.strictObject({
  id: z.uuid().optional(),
  lastName: z.string(),
  firstName: z.string(),
  phoneNumber: z.string(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleUncheckedCreateNestedManyWithoutBuyerInputSchema).optional(),
});

export const ContactCreateOrConnectWithoutDepotsInputSchema: z.ZodType<Prisma.ContactCreateOrConnectWithoutDepotsInput> = z.strictObject({
  where: z.lazy(() => ContactWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ContactCreateWithoutDepotsInputSchema), z.lazy(() => ContactUncheckedCreateWithoutDepotsInputSchema) ]),
});

export const ArticleCreateWithoutDepositInputSchema: z.ZodType<Prisma.ArticleCreateWithoutDepositInput> = z.strictObject({
  id: z.uuid().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  category: z.string(),
  discipline: z.string(),
  brand: z.string(),
  model: z.string(),
  size: z.string(),
  color: z.string(),
  code: z.string(),
  year: z.number().int(),
  depositIndex: z.number().int(),
  identificationLetter: z.string(),
  articleIndex: z.number().int(),
  status: z.lazy(() => ArticleStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sale: z.lazy(() => SaleCreateNestedOneWithoutArticlesInputSchema).optional(),
});

export const ArticleUncheckedCreateWithoutDepositInputSchema: z.ZodType<Prisma.ArticleUncheckedCreateWithoutDepositInput> = z.strictObject({
  id: z.uuid().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  category: z.string(),
  discipline: z.string(),
  brand: z.string(),
  model: z.string(),
  size: z.string(),
  color: z.string(),
  code: z.string(),
  year: z.number().int(),
  depositIndex: z.number().int(),
  identificationLetter: z.string(),
  articleIndex: z.number().int(),
  status: z.lazy(() => ArticleStatusSchema).optional(),
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

export const UserCreateWithoutDepotsInputSchema: z.ZodType<Prisma.UserCreateWithoutDepotsInput> = z.strictObject({
  id: z.uuid().optional(),
  email: z.string(),
  password: z.string(),
  role: z.lazy(() => UserRoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutDepotsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutDepotsInput> = z.strictObject({
  id: z.uuid().optional(),
  email: z.string(),
  password: z.string(),
  role: z.lazy(() => UserRoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  sales: z.lazy(() => SaleUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutDepotsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutDepotsInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutDepotsInputSchema), z.lazy(() => UserUncheckedCreateWithoutDepotsInputSchema) ]),
});

export const PredepositCreateWithoutDepositInputSchema: z.ZodType<Prisma.PredepositCreateWithoutDepositInput> = z.strictObject({
  id: z.uuid().optional(),
  predepositIndex: z.number().int(),
  sellerLastName: z.string(),
  sellerFirstName: z.string(),
  sellerPhoneNumber: z.string(),
  sellerCity: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => PredepositArticleCreateNestedManyWithoutPredepositInputSchema).optional(),
});

export const PredepositUncheckedCreateWithoutDepositInputSchema: z.ZodType<Prisma.PredepositUncheckedCreateWithoutDepositInput> = z.strictObject({
  id: z.uuid().optional(),
  predepositIndex: z.number().int(),
  sellerLastName: z.string(),
  sellerFirstName: z.string(),
  sellerPhoneNumber: z.string(),
  sellerCity: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  articles: z.lazy(() => PredepositArticleUncheckedCreateNestedManyWithoutPredepositInputSchema).optional(),
});

export const PredepositCreateOrConnectWithoutDepositInputSchema: z.ZodType<Prisma.PredepositCreateOrConnectWithoutDepositInput> = z.strictObject({
  where: z.lazy(() => PredepositWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PredepositCreateWithoutDepositInputSchema), z.lazy(() => PredepositUncheckedCreateWithoutDepositInputSchema) ]),
});

export const PredepositCreateManyDepositInputEnvelopeSchema: z.ZodType<Prisma.PredepositCreateManyDepositInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => PredepositCreateManyDepositInputSchema), z.lazy(() => PredepositCreateManyDepositInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const ContactUpsertWithoutDepotsInputSchema: z.ZodType<Prisma.ContactUpsertWithoutDepotsInput> = z.strictObject({
  update: z.union([ z.lazy(() => ContactUpdateWithoutDepotsInputSchema), z.lazy(() => ContactUncheckedUpdateWithoutDepotsInputSchema) ]),
  create: z.union([ z.lazy(() => ContactCreateWithoutDepotsInputSchema), z.lazy(() => ContactUncheckedCreateWithoutDepotsInputSchema) ]),
  where: z.lazy(() => ContactWhereInputSchema).optional(),
});

export const ContactUpdateToOneWithWhereWithoutDepotsInputSchema: z.ZodType<Prisma.ContactUpdateToOneWithWhereWithoutDepotsInput> = z.strictObject({
  where: z.lazy(() => ContactWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ContactUpdateWithoutDepotsInputSchema), z.lazy(() => ContactUncheckedUpdateWithoutDepotsInputSchema) ]),
});

export const ContactUpdateWithoutDepotsInputSchema: z.ZodType<Prisma.ContactUpdateWithoutDepotsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  city: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUpdateManyWithoutBuyerNestedInputSchema).optional(),
});

export const ContactUncheckedUpdateWithoutDepotsInputSchema: z.ZodType<Prisma.ContactUncheckedUpdateWithoutDepotsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  city: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUncheckedUpdateManyWithoutBuyerNestedInputSchema).optional(),
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
  price: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  discipline: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  brand: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  model: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  size: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  color: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  code: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  year: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  depositIndex: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  identificationLetter: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  articleIndex: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  status: z.union([ z.lazy(() => EnumArticleStatusFilterSchema), z.lazy(() => ArticleStatusSchema) ]).optional(),
  depositId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  saleId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
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
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => UserRoleSchema), z.lazy(() => EnumUserRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutDepotsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutDepotsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => UserRoleSchema), z.lazy(() => EnumUserRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sales: z.lazy(() => SaleUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const PredepositUpsertWithWhereUniqueWithoutDepositInputSchema: z.ZodType<Prisma.PredepositUpsertWithWhereUniqueWithoutDepositInput> = z.strictObject({
  where: z.lazy(() => PredepositWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PredepositUpdateWithoutDepositInputSchema), z.lazy(() => PredepositUncheckedUpdateWithoutDepositInputSchema) ]),
  create: z.union([ z.lazy(() => PredepositCreateWithoutDepositInputSchema), z.lazy(() => PredepositUncheckedCreateWithoutDepositInputSchema) ]),
});

export const PredepositUpdateWithWhereUniqueWithoutDepositInputSchema: z.ZodType<Prisma.PredepositUpdateWithWhereUniqueWithoutDepositInput> = z.strictObject({
  where: z.lazy(() => PredepositWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PredepositUpdateWithoutDepositInputSchema), z.lazy(() => PredepositUncheckedUpdateWithoutDepositInputSchema) ]),
});

export const PredepositUpdateManyWithWhereWithoutDepositInputSchema: z.ZodType<Prisma.PredepositUpdateManyWithWhereWithoutDepositInput> = z.strictObject({
  where: z.lazy(() => PredepositScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PredepositUpdateManyMutationInputSchema), z.lazy(() => PredepositUncheckedUpdateManyWithoutDepositInputSchema) ]),
});

export const PredepositScalarWhereInputSchema: z.ZodType<Prisma.PredepositScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PredepositScalarWhereInputSchema), z.lazy(() => PredepositScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PredepositScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PredepositScalarWhereInputSchema), z.lazy(() => PredepositScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  predepositIndex: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  sellerLastName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sellerFirstName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sellerPhoneNumber: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sellerCity: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  depositId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const ContactCreateWithoutSalesInputSchema: z.ZodType<Prisma.ContactCreateWithoutSalesInput> = z.strictObject({
  id: z.uuid().optional(),
  lastName: z.string(),
  firstName: z.string(),
  phoneNumber: z.string(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  depots: z.lazy(() => DepositCreateNestedManyWithoutSellerInputSchema).optional(),
});

export const ContactUncheckedCreateWithoutSalesInputSchema: z.ZodType<Prisma.ContactUncheckedCreateWithoutSalesInput> = z.strictObject({
  id: z.uuid().optional(),
  lastName: z.string(),
  firstName: z.string(),
  phoneNumber: z.string(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  depots: z.lazy(() => DepositUncheckedCreateNestedManyWithoutSellerInputSchema).optional(),
});

export const ContactCreateOrConnectWithoutSalesInputSchema: z.ZodType<Prisma.ContactCreateOrConnectWithoutSalesInput> = z.strictObject({
  where: z.lazy(() => ContactWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ContactCreateWithoutSalesInputSchema), z.lazy(() => ContactUncheckedCreateWithoutSalesInputSchema) ]),
});

export const ArticleCreateWithoutSaleInputSchema: z.ZodType<Prisma.ArticleCreateWithoutSaleInput> = z.strictObject({
  id: z.uuid().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  category: z.string(),
  discipline: z.string(),
  brand: z.string(),
  model: z.string(),
  size: z.string(),
  color: z.string(),
  code: z.string(),
  year: z.number().int(),
  depositIndex: z.number().int(),
  identificationLetter: z.string(),
  articleIndex: z.number().int(),
  status: z.lazy(() => ArticleStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  deposit: z.lazy(() => DepositCreateNestedOneWithoutArticlesInputSchema).optional(),
});

export const ArticleUncheckedCreateWithoutSaleInputSchema: z.ZodType<Prisma.ArticleUncheckedCreateWithoutSaleInput> = z.strictObject({
  id: z.uuid().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  category: z.string(),
  discipline: z.string(),
  brand: z.string(),
  model: z.string(),
  size: z.string(),
  color: z.string(),
  code: z.string(),
  year: z.number().int(),
  depositIndex: z.number().int(),
  identificationLetter: z.string(),
  articleIndex: z.number().int(),
  status: z.lazy(() => ArticleStatusSchema).optional(),
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

export const UserCreateWithoutSalesInputSchema: z.ZodType<Prisma.UserCreateWithoutSalesInput> = z.strictObject({
  id: z.uuid().optional(),
  email: z.string(),
  password: z.string(),
  role: z.lazy(() => UserRoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  depots: z.lazy(() => DepositCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutSalesInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutSalesInput> = z.strictObject({
  id: z.uuid().optional(),
  email: z.string(),
  password: z.string(),
  role: z.lazy(() => UserRoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  depots: z.lazy(() => DepositUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutSalesInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutSalesInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutSalesInputSchema), z.lazy(() => UserUncheckedCreateWithoutSalesInputSchema) ]),
});

export const ContactUpsertWithoutSalesInputSchema: z.ZodType<Prisma.ContactUpsertWithoutSalesInput> = z.strictObject({
  update: z.union([ z.lazy(() => ContactUpdateWithoutSalesInputSchema), z.lazy(() => ContactUncheckedUpdateWithoutSalesInputSchema) ]),
  create: z.union([ z.lazy(() => ContactCreateWithoutSalesInputSchema), z.lazy(() => ContactUncheckedCreateWithoutSalesInputSchema) ]),
  where: z.lazy(() => ContactWhereInputSchema).optional(),
});

export const ContactUpdateToOneWithWhereWithoutSalesInputSchema: z.ZodType<Prisma.ContactUpdateToOneWithWhereWithoutSalesInput> = z.strictObject({
  where: z.lazy(() => ContactWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ContactUpdateWithoutSalesInputSchema), z.lazy(() => ContactUncheckedUpdateWithoutSalesInputSchema) ]),
});

export const ContactUpdateWithoutSalesInputSchema: z.ZodType<Prisma.ContactUpdateWithoutSalesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  city: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  depots: z.lazy(() => DepositUpdateManyWithoutSellerNestedInputSchema).optional(),
});

export const ContactUncheckedUpdateWithoutSalesInputSchema: z.ZodType<Prisma.ContactUncheckedUpdateWithoutSalesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  city: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  depots: z.lazy(() => DepositUncheckedUpdateManyWithoutSellerNestedInputSchema).optional(),
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
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => UserRoleSchema), z.lazy(() => EnumUserRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  depots: z.lazy(() => DepositUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutSalesInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutSalesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => UserRoleSchema), z.lazy(() => EnumUserRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  depots: z.lazy(() => DepositUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const DepositCreateWithoutArticlesInputSchema: z.ZodType<Prisma.DepositCreateWithoutArticlesInput> = z.strictObject({
  id: z.uuid().optional(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  contributionAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  depositIndex: z.number().int(),
  incrementStart: z.number().int(),
  dropWorkstationId: z.number().int(),
  type: z.lazy(() => DepositTypeSchema).optional(),
  collectWorkstationId: z.number().int().optional().nullable(),
  collectedAt: z.coerce.date().optional().nullable(),
  paymentAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  seller: z.lazy(() => ContactCreateNestedOneWithoutDepotsInputSchema),
  user: z.lazy(() => UserCreateNestedOneWithoutDepotsInputSchema).optional(),
  predeposits: z.lazy(() => PredepositCreateNestedManyWithoutDepositInputSchema).optional(),
});

export const DepositUncheckedCreateWithoutArticlesInputSchema: z.ZodType<Prisma.DepositUncheckedCreateWithoutArticlesInput> = z.strictObject({
  id: z.uuid().optional(),
  sellerId: z.string(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  contributionAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  depositIndex: z.number().int(),
  incrementStart: z.number().int(),
  dropWorkstationId: z.number().int(),
  type: z.lazy(() => DepositTypeSchema).optional(),
  collectWorkstationId: z.number().int().optional().nullable(),
  collectedAt: z.coerce.date().optional().nullable(),
  paymentAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  userId: z.string().optional().nullable(),
  predeposits: z.lazy(() => PredepositUncheckedCreateNestedManyWithoutDepositInputSchema).optional(),
});

export const DepositCreateOrConnectWithoutArticlesInputSchema: z.ZodType<Prisma.DepositCreateOrConnectWithoutArticlesInput> = z.strictObject({
  where: z.lazy(() => DepositWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => DepositCreateWithoutArticlesInputSchema), z.lazy(() => DepositUncheckedCreateWithoutArticlesInputSchema) ]),
});

export const SaleCreateWithoutArticlesInputSchema: z.ZodType<Prisma.SaleCreateWithoutArticlesInput> = z.strictObject({
  id: z.uuid().optional(),
  saleIndex: z.number().int(),
  incrementStart: z.number().int().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundComment: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  buyer: z.lazy(() => ContactCreateNestedOneWithoutSalesInputSchema),
  user: z.lazy(() => UserCreateNestedOneWithoutSalesInputSchema).optional(),
});

export const SaleUncheckedCreateWithoutArticlesInputSchema: z.ZodType<Prisma.SaleUncheckedCreateWithoutArticlesInput> = z.strictObject({
  id: z.uuid().optional(),
  buyerId: z.string(),
  saleIndex: z.number().int(),
  incrementStart: z.number().int().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundComment: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  userId: z.string().optional().nullable(),
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
  contributionAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  dropWorkstationId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => EnumDepositTypeFieldUpdateOperationsInputSchema) ]).optional(),
  collectWorkstationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  collectedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  chequeNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  signature: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  seller: z.lazy(() => ContactUpdateOneRequiredWithoutDepotsNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneWithoutDepotsNestedInputSchema).optional(),
  predeposits: z.lazy(() => PredepositUpdateManyWithoutDepositNestedInputSchema).optional(),
});

export const DepositUncheckedUpdateWithoutArticlesInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateWithoutArticlesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  contributionAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  dropWorkstationId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => EnumDepositTypeFieldUpdateOperationsInputSchema) ]).optional(),
  collectWorkstationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  collectedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  chequeNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  signature: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  predeposits: z.lazy(() => PredepositUncheckedUpdateManyWithoutDepositNestedInputSchema).optional(),
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
  saleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundComment: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  buyer: z.lazy(() => ContactUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneWithoutSalesNestedInputSchema).optional(),
});

export const SaleUncheckedUpdateWithoutArticlesInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateWithoutArticlesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  buyerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  saleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundComment: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PredepositArticleCreateWithoutPredepositInputSchema: z.ZodType<Prisma.PredepositArticleCreateWithoutPredepositInput> = z.strictObject({
  id: z.uuid().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  category: z.string(),
  discipline: z.string(),
  brand: z.string(),
  model: z.string(),
  size: z.string(),
  color: z.string(),
  year: z.number().int(),
  identificationLetter: z.string(),
  articleIndex: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const PredepositArticleUncheckedCreateWithoutPredepositInputSchema: z.ZodType<Prisma.PredepositArticleUncheckedCreateWithoutPredepositInput> = z.strictObject({
  id: z.uuid().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  category: z.string(),
  discipline: z.string(),
  brand: z.string(),
  model: z.string(),
  size: z.string(),
  color: z.string(),
  year: z.number().int(),
  identificationLetter: z.string(),
  articleIndex: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const PredepositArticleCreateOrConnectWithoutPredepositInputSchema: z.ZodType<Prisma.PredepositArticleCreateOrConnectWithoutPredepositInput> = z.strictObject({
  where: z.lazy(() => PredepositArticleWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PredepositArticleCreateWithoutPredepositInputSchema), z.lazy(() => PredepositArticleUncheckedCreateWithoutPredepositInputSchema) ]),
});

export const PredepositArticleCreateManyPredepositInputEnvelopeSchema: z.ZodType<Prisma.PredepositArticleCreateManyPredepositInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => PredepositArticleCreateManyPredepositInputSchema), z.lazy(() => PredepositArticleCreateManyPredepositInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const DepositCreateWithoutPredepositsInputSchema: z.ZodType<Prisma.DepositCreateWithoutPredepositsInput> = z.strictObject({
  id: z.uuid().optional(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  contributionAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  depositIndex: z.number().int(),
  incrementStart: z.number().int(),
  dropWorkstationId: z.number().int(),
  type: z.lazy(() => DepositTypeSchema).optional(),
  collectWorkstationId: z.number().int().optional().nullable(),
  collectedAt: z.coerce.date().optional().nullable(),
  paymentAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  seller: z.lazy(() => ContactCreateNestedOneWithoutDepotsInputSchema),
  articles: z.lazy(() => ArticleCreateNestedManyWithoutDepositInputSchema).optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutDepotsInputSchema).optional(),
});

export const DepositUncheckedCreateWithoutPredepositsInputSchema: z.ZodType<Prisma.DepositUncheckedCreateWithoutPredepositsInput> = z.strictObject({
  id: z.uuid().optional(),
  sellerId: z.string(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  contributionAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  depositIndex: z.number().int(),
  incrementStart: z.number().int(),
  dropWorkstationId: z.number().int(),
  type: z.lazy(() => DepositTypeSchema).optional(),
  collectWorkstationId: z.number().int().optional().nullable(),
  collectedAt: z.coerce.date().optional().nullable(),
  paymentAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  userId: z.string().optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedCreateNestedManyWithoutDepositInputSchema).optional(),
});

export const DepositCreateOrConnectWithoutPredepositsInputSchema: z.ZodType<Prisma.DepositCreateOrConnectWithoutPredepositsInput> = z.strictObject({
  where: z.lazy(() => DepositWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => DepositCreateWithoutPredepositsInputSchema), z.lazy(() => DepositUncheckedCreateWithoutPredepositsInputSchema) ]),
});

export const PredepositArticleUpsertWithWhereUniqueWithoutPredepositInputSchema: z.ZodType<Prisma.PredepositArticleUpsertWithWhereUniqueWithoutPredepositInput> = z.strictObject({
  where: z.lazy(() => PredepositArticleWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PredepositArticleUpdateWithoutPredepositInputSchema), z.lazy(() => PredepositArticleUncheckedUpdateWithoutPredepositInputSchema) ]),
  create: z.union([ z.lazy(() => PredepositArticleCreateWithoutPredepositInputSchema), z.lazy(() => PredepositArticleUncheckedCreateWithoutPredepositInputSchema) ]),
});

export const PredepositArticleUpdateWithWhereUniqueWithoutPredepositInputSchema: z.ZodType<Prisma.PredepositArticleUpdateWithWhereUniqueWithoutPredepositInput> = z.strictObject({
  where: z.lazy(() => PredepositArticleWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PredepositArticleUpdateWithoutPredepositInputSchema), z.lazy(() => PredepositArticleUncheckedUpdateWithoutPredepositInputSchema) ]),
});

export const PredepositArticleUpdateManyWithWhereWithoutPredepositInputSchema: z.ZodType<Prisma.PredepositArticleUpdateManyWithWhereWithoutPredepositInput> = z.strictObject({
  where: z.lazy(() => PredepositArticleScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PredepositArticleUpdateManyMutationInputSchema), z.lazy(() => PredepositArticleUncheckedUpdateManyWithoutPredepositInputSchema) ]),
});

export const PredepositArticleScalarWhereInputSchema: z.ZodType<Prisma.PredepositArticleScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PredepositArticleScalarWhereInputSchema), z.lazy(() => PredepositArticleScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PredepositArticleScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PredepositArticleScalarWhereInputSchema), z.lazy(() => PredepositArticleScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => UuidFilterSchema), z.string() ]).optional(),
  price: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  discipline: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  brand: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  model: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  size: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  color: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  year: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  identificationLetter: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  articleIndex: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  predepositId: z.union([ z.lazy(() => UuidNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const DepositUpsertWithoutPredepositsInputSchema: z.ZodType<Prisma.DepositUpsertWithoutPredepositsInput> = z.strictObject({
  update: z.union([ z.lazy(() => DepositUpdateWithoutPredepositsInputSchema), z.lazy(() => DepositUncheckedUpdateWithoutPredepositsInputSchema) ]),
  create: z.union([ z.lazy(() => DepositCreateWithoutPredepositsInputSchema), z.lazy(() => DepositUncheckedCreateWithoutPredepositsInputSchema) ]),
  where: z.lazy(() => DepositWhereInputSchema).optional(),
});

export const DepositUpdateToOneWithWhereWithoutPredepositsInputSchema: z.ZodType<Prisma.DepositUpdateToOneWithWhereWithoutPredepositsInput> = z.strictObject({
  where: z.lazy(() => DepositWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => DepositUpdateWithoutPredepositsInputSchema), z.lazy(() => DepositUncheckedUpdateWithoutPredepositsInputSchema) ]),
});

export const DepositUpdateWithoutPredepositsInputSchema: z.ZodType<Prisma.DepositUpdateWithoutPredepositsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  contributionAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  dropWorkstationId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => EnumDepositTypeFieldUpdateOperationsInputSchema) ]).optional(),
  collectWorkstationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  collectedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  chequeNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  signature: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  seller: z.lazy(() => ContactUpdateOneRequiredWithoutDepotsNestedInputSchema).optional(),
  articles: z.lazy(() => ArticleUpdateManyWithoutDepositNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneWithoutDepotsNestedInputSchema).optional(),
});

export const DepositUncheckedUpdateWithoutPredepositsInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateWithoutPredepositsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  contributionAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  dropWorkstationId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => EnumDepositTypeFieldUpdateOperationsInputSchema) ]).optional(),
  collectWorkstationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  collectedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  chequeNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  signature: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedUpdateManyWithoutDepositNestedInputSchema).optional(),
});

export const PredepositCreateWithoutArticlesInputSchema: z.ZodType<Prisma.PredepositCreateWithoutArticlesInput> = z.strictObject({
  id: z.uuid().optional(),
  predepositIndex: z.number().int(),
  sellerLastName: z.string(),
  sellerFirstName: z.string(),
  sellerPhoneNumber: z.string(),
  sellerCity: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  deposit: z.lazy(() => DepositCreateNestedOneWithoutPredepositsInputSchema).optional(),
});

export const PredepositUncheckedCreateWithoutArticlesInputSchema: z.ZodType<Prisma.PredepositUncheckedCreateWithoutArticlesInput> = z.strictObject({
  id: z.uuid().optional(),
  predepositIndex: z.number().int(),
  sellerLastName: z.string(),
  sellerFirstName: z.string(),
  sellerPhoneNumber: z.string(),
  sellerCity: z.string(),
  depositId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const PredepositCreateOrConnectWithoutArticlesInputSchema: z.ZodType<Prisma.PredepositCreateOrConnectWithoutArticlesInput> = z.strictObject({
  where: z.lazy(() => PredepositWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PredepositCreateWithoutArticlesInputSchema), z.lazy(() => PredepositUncheckedCreateWithoutArticlesInputSchema) ]),
});

export const PredepositUpsertWithoutArticlesInputSchema: z.ZodType<Prisma.PredepositUpsertWithoutArticlesInput> = z.strictObject({
  update: z.union([ z.lazy(() => PredepositUpdateWithoutArticlesInputSchema), z.lazy(() => PredepositUncheckedUpdateWithoutArticlesInputSchema) ]),
  create: z.union([ z.lazy(() => PredepositCreateWithoutArticlesInputSchema), z.lazy(() => PredepositUncheckedCreateWithoutArticlesInputSchema) ]),
  where: z.lazy(() => PredepositWhereInputSchema).optional(),
});

export const PredepositUpdateToOneWithWhereWithoutArticlesInputSchema: z.ZodType<Prisma.PredepositUpdateToOneWithWhereWithoutArticlesInput> = z.strictObject({
  where: z.lazy(() => PredepositWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => PredepositUpdateWithoutArticlesInputSchema), z.lazy(() => PredepositUncheckedUpdateWithoutArticlesInputSchema) ]),
});

export const PredepositUpdateWithoutArticlesInputSchema: z.ZodType<Prisma.PredepositUpdateWithoutArticlesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  predepositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sellerLastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerFirstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerPhoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerCity: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deposit: z.lazy(() => DepositUpdateOneWithoutPredepositsNestedInputSchema).optional(),
});

export const PredepositUncheckedUpdateWithoutArticlesInputSchema: z.ZodType<Prisma.PredepositUncheckedUpdateWithoutArticlesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  predepositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sellerLastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerFirstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerPhoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerCity: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  depositId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SaleCreateManyUserInputSchema: z.ZodType<Prisma.SaleCreateManyUserInput> = z.strictObject({
  id: z.uuid().optional(),
  buyerId: z.string(),
  saleIndex: z.number().int(),
  incrementStart: z.number().int().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundComment: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const DepositCreateManyUserInputSchema: z.ZodType<Prisma.DepositCreateManyUserInput> = z.strictObject({
  id: z.uuid().optional(),
  sellerId: z.string(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  contributionAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  depositIndex: z.number().int(),
  incrementStart: z.number().int(),
  dropWorkstationId: z.number().int(),
  type: z.lazy(() => DepositTypeSchema).optional(),
  collectWorkstationId: z.number().int().optional().nullable(),
  collectedAt: z.coerce.date().optional().nullable(),
  paymentAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const SaleUpdateWithoutUserInputSchema: z.ZodType<Prisma.SaleUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  saleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundComment: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  buyer: z.lazy(() => ContactUpdateOneRequiredWithoutSalesNestedInputSchema).optional(),
  articles: z.lazy(() => ArticleUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const SaleUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  buyerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  saleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundComment: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const SaleUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  buyerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  saleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundComment: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const DepositUpdateWithoutUserInputSchema: z.ZodType<Prisma.DepositUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  contributionAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  dropWorkstationId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => EnumDepositTypeFieldUpdateOperationsInputSchema) ]).optional(),
  collectWorkstationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  collectedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  chequeNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  signature: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  seller: z.lazy(() => ContactUpdateOneRequiredWithoutDepotsNestedInputSchema).optional(),
  articles: z.lazy(() => ArticleUpdateManyWithoutDepositNestedInputSchema).optional(),
  predeposits: z.lazy(() => PredepositUpdateManyWithoutDepositNestedInputSchema).optional(),
});

export const DepositUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  contributionAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  dropWorkstationId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => EnumDepositTypeFieldUpdateOperationsInputSchema) ]).optional(),
  collectWorkstationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  collectedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  chequeNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  signature: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedUpdateManyWithoutDepositNestedInputSchema).optional(),
  predeposits: z.lazy(() => PredepositUncheckedUpdateManyWithoutDepositNestedInputSchema).optional(),
});

export const DepositUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  contributionAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  dropWorkstationId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => EnumDepositTypeFieldUpdateOperationsInputSchema) ]).optional(),
  collectWorkstationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  collectedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  chequeNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  signature: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SaleCreateManyBuyerInputSchema: z.ZodType<Prisma.SaleCreateManyBuyerInput> = z.strictObject({
  id: z.uuid().optional(),
  saleIndex: z.number().int(),
  incrementStart: z.number().int().optional(),
  cardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  cashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  checkAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCardAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundCashAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  refundComment: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  userId: z.string().optional().nullable(),
});

export const DepositCreateManySellerInputSchema: z.ZodType<Prisma.DepositCreateManySellerInput> = z.strictObject({
  id: z.uuid().optional(),
  contributionStatus: z.lazy(() => ContributionStatusSchema).optional(),
  contributionAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  depositIndex: z.number().int(),
  incrementStart: z.number().int(),
  dropWorkstationId: z.number().int(),
  type: z.lazy(() => DepositTypeSchema).optional(),
  collectWorkstationId: z.number().int().optional().nullable(),
  collectedAt: z.coerce.date().optional().nullable(),
  paymentAmount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  userId: z.string().optional().nullable(),
});

export const SaleUpdateWithoutBuyerInputSchema: z.ZodType<Prisma.SaleUpdateWithoutBuyerInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  saleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundComment: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUpdateManyWithoutSaleNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneWithoutSalesNestedInputSchema).optional(),
});

export const SaleUncheckedUpdateWithoutBuyerInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateWithoutBuyerInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  saleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundComment: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedUpdateManyWithoutSaleNestedInputSchema).optional(),
});

export const SaleUncheckedUpdateManyWithoutBuyerInputSchema: z.ZodType<Prisma.SaleUncheckedUpdateManyWithoutBuyerInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  saleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  cashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  checkAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCardAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundCashAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  refundComment: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const DepositUpdateWithoutSellerInputSchema: z.ZodType<Prisma.DepositUpdateWithoutSellerInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  contributionAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  dropWorkstationId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => EnumDepositTypeFieldUpdateOperationsInputSchema) ]).optional(),
  collectWorkstationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  collectedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  chequeNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  signature: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUpdateManyWithoutDepositNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneWithoutDepotsNestedInputSchema).optional(),
  predeposits: z.lazy(() => PredepositUpdateManyWithoutDepositNestedInputSchema).optional(),
});

export const DepositUncheckedUpdateWithoutSellerInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateWithoutSellerInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  contributionAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  dropWorkstationId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => EnumDepositTypeFieldUpdateOperationsInputSchema) ]).optional(),
  collectWorkstationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  collectedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  chequeNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  signature: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => ArticleUncheckedUpdateManyWithoutDepositNestedInputSchema).optional(),
  predeposits: z.lazy(() => PredepositUncheckedUpdateManyWithoutDepositNestedInputSchema).optional(),
});

export const DepositUncheckedUpdateManyWithoutSellerInputSchema: z.ZodType<Prisma.DepositUncheckedUpdateManyWithoutSellerInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  contributionStatus: z.union([ z.lazy(() => ContributionStatusSchema), z.lazy(() => EnumContributionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  contributionAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  incrementStart: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  dropWorkstationId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => DepositTypeSchema), z.lazy(() => EnumDepositTypeFieldUpdateOperationsInputSchema) ]).optional(),
  collectWorkstationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  collectedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentAmount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  chequeNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  signature: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ArticleCreateManyDepositInputSchema: z.ZodType<Prisma.ArticleCreateManyDepositInput> = z.strictObject({
  id: z.uuid().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  category: z.string(),
  discipline: z.string(),
  brand: z.string(),
  model: z.string(),
  size: z.string(),
  color: z.string(),
  code: z.string(),
  year: z.number().int(),
  depositIndex: z.number().int(),
  identificationLetter: z.string(),
  articleIndex: z.number().int(),
  status: z.lazy(() => ArticleStatusSchema).optional(),
  saleId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const PredepositCreateManyDepositInputSchema: z.ZodType<Prisma.PredepositCreateManyDepositInput> = z.strictObject({
  id: z.uuid().optional(),
  predepositIndex: z.number().int(),
  sellerLastName: z.string(),
  sellerFirstName: z.string(),
  sellerPhoneNumber: z.string(),
  sellerCity: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const ArticleUpdateWithoutDepositInputSchema: z.ZodType<Prisma.ArticleUpdateWithoutDepositInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  color: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  identificationLetter: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  articleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => ArticleStatusSchema), z.lazy(() => EnumArticleStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sale: z.lazy(() => SaleUpdateOneWithoutArticlesNestedInputSchema).optional(),
});

export const ArticleUncheckedUpdateWithoutDepositInputSchema: z.ZodType<Prisma.ArticleUncheckedUpdateWithoutDepositInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  color: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  identificationLetter: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  articleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => ArticleStatusSchema), z.lazy(() => EnumArticleStatusFieldUpdateOperationsInputSchema) ]).optional(),
  saleId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ArticleUncheckedUpdateManyWithoutDepositInputSchema: z.ZodType<Prisma.ArticleUncheckedUpdateManyWithoutDepositInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  color: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  identificationLetter: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  articleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => ArticleStatusSchema), z.lazy(() => EnumArticleStatusFieldUpdateOperationsInputSchema) ]).optional(),
  saleId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PredepositUpdateWithoutDepositInputSchema: z.ZodType<Prisma.PredepositUpdateWithoutDepositInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  predepositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sellerLastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerFirstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerPhoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerCity: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => PredepositArticleUpdateManyWithoutPredepositNestedInputSchema).optional(),
});

export const PredepositUncheckedUpdateWithoutDepositInputSchema: z.ZodType<Prisma.PredepositUncheckedUpdateWithoutDepositInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  predepositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sellerLastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerFirstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerPhoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerCity: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  articles: z.lazy(() => PredepositArticleUncheckedUpdateManyWithoutPredepositNestedInputSchema).optional(),
});

export const PredepositUncheckedUpdateManyWithoutDepositInputSchema: z.ZodType<Prisma.PredepositUncheckedUpdateManyWithoutDepositInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  predepositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sellerLastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerFirstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerPhoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sellerCity: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ArticleCreateManySaleInputSchema: z.ZodType<Prisma.ArticleCreateManySaleInput> = z.strictObject({
  id: z.uuid().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  category: z.string(),
  discipline: z.string(),
  brand: z.string(),
  model: z.string(),
  size: z.string(),
  color: z.string(),
  code: z.string(),
  year: z.number().int(),
  depositIndex: z.number().int(),
  identificationLetter: z.string(),
  articleIndex: z.number().int(),
  status: z.lazy(() => ArticleStatusSchema).optional(),
  depositId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const ArticleUpdateWithoutSaleInputSchema: z.ZodType<Prisma.ArticleUpdateWithoutSaleInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  color: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  identificationLetter: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  articleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => ArticleStatusSchema), z.lazy(() => EnumArticleStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deposit: z.lazy(() => DepositUpdateOneWithoutArticlesNestedInputSchema).optional(),
});

export const ArticleUncheckedUpdateWithoutSaleInputSchema: z.ZodType<Prisma.ArticleUncheckedUpdateWithoutSaleInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  color: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  identificationLetter: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  articleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => ArticleStatusSchema), z.lazy(() => EnumArticleStatusFieldUpdateOperationsInputSchema) ]).optional(),
  depositId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const ArticleUncheckedUpdateManyWithoutSaleInputSchema: z.ZodType<Prisma.ArticleUncheckedUpdateManyWithoutSaleInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  color: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  depositIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  identificationLetter: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  articleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => ArticleStatusSchema), z.lazy(() => EnumArticleStatusFieldUpdateOperationsInputSchema) ]).optional(),
  depositId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PredepositArticleCreateManyPredepositInputSchema: z.ZodType<Prisma.PredepositArticleCreateManyPredepositInput> = z.strictObject({
  id: z.uuid().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  category: z.string(),
  discipline: z.string(),
  brand: z.string(),
  model: z.string(),
  size: z.string(),
  color: z.string(),
  year: z.number().int(),
  identificationLetter: z.string(),
  articleIndex: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const PredepositArticleUpdateWithoutPredepositInputSchema: z.ZodType<Prisma.PredepositArticleUpdateWithoutPredepositInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  color: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  identificationLetter: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  articleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PredepositArticleUncheckedUpdateWithoutPredepositInputSchema: z.ZodType<Prisma.PredepositArticleUncheckedUpdateWithoutPredepositInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  color: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  identificationLetter: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  articleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PredepositArticleUncheckedUpdateManyWithoutPredepositInputSchema: z.ZodType<Prisma.PredepositArticleUncheckedUpdateManyWithoutPredepositInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discipline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  color: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  year: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  identificationLetter: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  articleIndex: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

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

export const ContactFindFirstArgsSchema: z.ZodType<Prisma.ContactFindFirstArgs> = z.object({
  select: ContactSelectSchema.optional(),
  include: ContactIncludeSchema.optional(),
  where: ContactWhereInputSchema.optional(), 
  orderBy: z.union([ ContactOrderByWithRelationInputSchema.array(), ContactOrderByWithRelationInputSchema ]).optional(),
  cursor: ContactWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ContactScalarFieldEnumSchema, ContactScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ContactFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ContactFindFirstOrThrowArgs> = z.object({
  select: ContactSelectSchema.optional(),
  include: ContactIncludeSchema.optional(),
  where: ContactWhereInputSchema.optional(), 
  orderBy: z.union([ ContactOrderByWithRelationInputSchema.array(), ContactOrderByWithRelationInputSchema ]).optional(),
  cursor: ContactWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ContactScalarFieldEnumSchema, ContactScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ContactFindManyArgsSchema: z.ZodType<Prisma.ContactFindManyArgs> = z.object({
  select: ContactSelectSchema.optional(),
  include: ContactIncludeSchema.optional(),
  where: ContactWhereInputSchema.optional(), 
  orderBy: z.union([ ContactOrderByWithRelationInputSchema.array(), ContactOrderByWithRelationInputSchema ]).optional(),
  cursor: ContactWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ContactScalarFieldEnumSchema, ContactScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ContactAggregateArgsSchema: z.ZodType<Prisma.ContactAggregateArgs> = z.object({
  where: ContactWhereInputSchema.optional(), 
  orderBy: z.union([ ContactOrderByWithRelationInputSchema.array(), ContactOrderByWithRelationInputSchema ]).optional(),
  cursor: ContactWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ContactGroupByArgsSchema: z.ZodType<Prisma.ContactGroupByArgs> = z.object({
  where: ContactWhereInputSchema.optional(), 
  orderBy: z.union([ ContactOrderByWithAggregationInputSchema.array(), ContactOrderByWithAggregationInputSchema ]).optional(),
  by: ContactScalarFieldEnumSchema.array(), 
  having: ContactScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ContactFindUniqueArgsSchema: z.ZodType<Prisma.ContactFindUniqueArgs> = z.object({
  select: ContactSelectSchema.optional(),
  include: ContactIncludeSchema.optional(),
  where: ContactWhereUniqueInputSchema, 
}).strict();

export const ContactFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ContactFindUniqueOrThrowArgs> = z.object({
  select: ContactSelectSchema.optional(),
  include: ContactIncludeSchema.optional(),
  where: ContactWhereUniqueInputSchema, 
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

export const PredepositFindFirstArgsSchema: z.ZodType<Prisma.PredepositFindFirstArgs> = z.object({
  select: PredepositSelectSchema.optional(),
  include: PredepositIncludeSchema.optional(),
  where: PredepositWhereInputSchema.optional(), 
  orderBy: z.union([ PredepositOrderByWithRelationInputSchema.array(), PredepositOrderByWithRelationInputSchema ]).optional(),
  cursor: PredepositWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PredepositScalarFieldEnumSchema, PredepositScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PredepositFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PredepositFindFirstOrThrowArgs> = z.object({
  select: PredepositSelectSchema.optional(),
  include: PredepositIncludeSchema.optional(),
  where: PredepositWhereInputSchema.optional(), 
  orderBy: z.union([ PredepositOrderByWithRelationInputSchema.array(), PredepositOrderByWithRelationInputSchema ]).optional(),
  cursor: PredepositWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PredepositScalarFieldEnumSchema, PredepositScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PredepositFindManyArgsSchema: z.ZodType<Prisma.PredepositFindManyArgs> = z.object({
  select: PredepositSelectSchema.optional(),
  include: PredepositIncludeSchema.optional(),
  where: PredepositWhereInputSchema.optional(), 
  orderBy: z.union([ PredepositOrderByWithRelationInputSchema.array(), PredepositOrderByWithRelationInputSchema ]).optional(),
  cursor: PredepositWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PredepositScalarFieldEnumSchema, PredepositScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PredepositAggregateArgsSchema: z.ZodType<Prisma.PredepositAggregateArgs> = z.object({
  where: PredepositWhereInputSchema.optional(), 
  orderBy: z.union([ PredepositOrderByWithRelationInputSchema.array(), PredepositOrderByWithRelationInputSchema ]).optional(),
  cursor: PredepositWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PredepositGroupByArgsSchema: z.ZodType<Prisma.PredepositGroupByArgs> = z.object({
  where: PredepositWhereInputSchema.optional(), 
  orderBy: z.union([ PredepositOrderByWithAggregationInputSchema.array(), PredepositOrderByWithAggregationInputSchema ]).optional(),
  by: PredepositScalarFieldEnumSchema.array(), 
  having: PredepositScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PredepositFindUniqueArgsSchema: z.ZodType<Prisma.PredepositFindUniqueArgs> = z.object({
  select: PredepositSelectSchema.optional(),
  include: PredepositIncludeSchema.optional(),
  where: PredepositWhereUniqueInputSchema, 
}).strict();

export const PredepositFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PredepositFindUniqueOrThrowArgs> = z.object({
  select: PredepositSelectSchema.optional(),
  include: PredepositIncludeSchema.optional(),
  where: PredepositWhereUniqueInputSchema, 
}).strict();

export const PredepositArticleFindFirstArgsSchema: z.ZodType<Prisma.PredepositArticleFindFirstArgs> = z.object({
  select: PredepositArticleSelectSchema.optional(),
  include: PredepositArticleIncludeSchema.optional(),
  where: PredepositArticleWhereInputSchema.optional(), 
  orderBy: z.union([ PredepositArticleOrderByWithRelationInputSchema.array(), PredepositArticleOrderByWithRelationInputSchema ]).optional(),
  cursor: PredepositArticleWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PredepositArticleScalarFieldEnumSchema, PredepositArticleScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PredepositArticleFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PredepositArticleFindFirstOrThrowArgs> = z.object({
  select: PredepositArticleSelectSchema.optional(),
  include: PredepositArticleIncludeSchema.optional(),
  where: PredepositArticleWhereInputSchema.optional(), 
  orderBy: z.union([ PredepositArticleOrderByWithRelationInputSchema.array(), PredepositArticleOrderByWithRelationInputSchema ]).optional(),
  cursor: PredepositArticleWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PredepositArticleScalarFieldEnumSchema, PredepositArticleScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PredepositArticleFindManyArgsSchema: z.ZodType<Prisma.PredepositArticleFindManyArgs> = z.object({
  select: PredepositArticleSelectSchema.optional(),
  include: PredepositArticleIncludeSchema.optional(),
  where: PredepositArticleWhereInputSchema.optional(), 
  orderBy: z.union([ PredepositArticleOrderByWithRelationInputSchema.array(), PredepositArticleOrderByWithRelationInputSchema ]).optional(),
  cursor: PredepositArticleWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PredepositArticleScalarFieldEnumSchema, PredepositArticleScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PredepositArticleAggregateArgsSchema: z.ZodType<Prisma.PredepositArticleAggregateArgs> = z.object({
  where: PredepositArticleWhereInputSchema.optional(), 
  orderBy: z.union([ PredepositArticleOrderByWithRelationInputSchema.array(), PredepositArticleOrderByWithRelationInputSchema ]).optional(),
  cursor: PredepositArticleWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PredepositArticleGroupByArgsSchema: z.ZodType<Prisma.PredepositArticleGroupByArgs> = z.object({
  where: PredepositArticleWhereInputSchema.optional(), 
  orderBy: z.union([ PredepositArticleOrderByWithAggregationInputSchema.array(), PredepositArticleOrderByWithAggregationInputSchema ]).optional(),
  by: PredepositArticleScalarFieldEnumSchema.array(), 
  having: PredepositArticleScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PredepositArticleFindUniqueArgsSchema: z.ZodType<Prisma.PredepositArticleFindUniqueArgs> = z.object({
  select: PredepositArticleSelectSchema.optional(),
  include: PredepositArticleIncludeSchema.optional(),
  where: PredepositArticleWhereUniqueInputSchema, 
}).strict();

export const PredepositArticleFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PredepositArticleFindUniqueOrThrowArgs> = z.object({
  select: PredepositArticleSelectSchema.optional(),
  include: PredepositArticleIncludeSchema.optional(),
  where: PredepositArticleWhereUniqueInputSchema, 
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

export const ContactCreateArgsSchema: z.ZodType<Prisma.ContactCreateArgs> = z.object({
  select: ContactSelectSchema.optional(),
  include: ContactIncludeSchema.optional(),
  data: z.union([ ContactCreateInputSchema, ContactUncheckedCreateInputSchema ]),
}).strict();

export const ContactUpsertArgsSchema: z.ZodType<Prisma.ContactUpsertArgs> = z.object({
  select: ContactSelectSchema.optional(),
  include: ContactIncludeSchema.optional(),
  where: ContactWhereUniqueInputSchema, 
  create: z.union([ ContactCreateInputSchema, ContactUncheckedCreateInputSchema ]),
  update: z.union([ ContactUpdateInputSchema, ContactUncheckedUpdateInputSchema ]),
}).strict();

export const ContactCreateManyArgsSchema: z.ZodType<Prisma.ContactCreateManyArgs> = z.object({
  data: z.union([ ContactCreateManyInputSchema, ContactCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ContactCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ContactCreateManyAndReturnArgs> = z.object({
  data: z.union([ ContactCreateManyInputSchema, ContactCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ContactDeleteArgsSchema: z.ZodType<Prisma.ContactDeleteArgs> = z.object({
  select: ContactSelectSchema.optional(),
  include: ContactIncludeSchema.optional(),
  where: ContactWhereUniqueInputSchema, 
}).strict();

export const ContactUpdateArgsSchema: z.ZodType<Prisma.ContactUpdateArgs> = z.object({
  select: ContactSelectSchema.optional(),
  include: ContactIncludeSchema.optional(),
  data: z.union([ ContactUpdateInputSchema, ContactUncheckedUpdateInputSchema ]),
  where: ContactWhereUniqueInputSchema, 
}).strict();

export const ContactUpdateManyArgsSchema: z.ZodType<Prisma.ContactUpdateManyArgs> = z.object({
  data: z.union([ ContactUpdateManyMutationInputSchema, ContactUncheckedUpdateManyInputSchema ]),
  where: ContactWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ContactUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ContactUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ContactUpdateManyMutationInputSchema, ContactUncheckedUpdateManyInputSchema ]),
  where: ContactWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ContactDeleteManyArgsSchema: z.ZodType<Prisma.ContactDeleteManyArgs> = z.object({
  where: ContactWhereInputSchema.optional(), 
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

export const PredepositCreateArgsSchema: z.ZodType<Prisma.PredepositCreateArgs> = z.object({
  select: PredepositSelectSchema.optional(),
  include: PredepositIncludeSchema.optional(),
  data: z.union([ PredepositCreateInputSchema, PredepositUncheckedCreateInputSchema ]),
}).strict();

export const PredepositUpsertArgsSchema: z.ZodType<Prisma.PredepositUpsertArgs> = z.object({
  select: PredepositSelectSchema.optional(),
  include: PredepositIncludeSchema.optional(),
  where: PredepositWhereUniqueInputSchema, 
  create: z.union([ PredepositCreateInputSchema, PredepositUncheckedCreateInputSchema ]),
  update: z.union([ PredepositUpdateInputSchema, PredepositUncheckedUpdateInputSchema ]),
}).strict();

export const PredepositCreateManyArgsSchema: z.ZodType<Prisma.PredepositCreateManyArgs> = z.object({
  data: z.union([ PredepositCreateManyInputSchema, PredepositCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PredepositCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PredepositCreateManyAndReturnArgs> = z.object({
  data: z.union([ PredepositCreateManyInputSchema, PredepositCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PredepositDeleteArgsSchema: z.ZodType<Prisma.PredepositDeleteArgs> = z.object({
  select: PredepositSelectSchema.optional(),
  include: PredepositIncludeSchema.optional(),
  where: PredepositWhereUniqueInputSchema, 
}).strict();

export const PredepositUpdateArgsSchema: z.ZodType<Prisma.PredepositUpdateArgs> = z.object({
  select: PredepositSelectSchema.optional(),
  include: PredepositIncludeSchema.optional(),
  data: z.union([ PredepositUpdateInputSchema, PredepositUncheckedUpdateInputSchema ]),
  where: PredepositWhereUniqueInputSchema, 
}).strict();

export const PredepositUpdateManyArgsSchema: z.ZodType<Prisma.PredepositUpdateManyArgs> = z.object({
  data: z.union([ PredepositUpdateManyMutationInputSchema, PredepositUncheckedUpdateManyInputSchema ]),
  where: PredepositWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PredepositUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PredepositUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PredepositUpdateManyMutationInputSchema, PredepositUncheckedUpdateManyInputSchema ]),
  where: PredepositWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PredepositDeleteManyArgsSchema: z.ZodType<Prisma.PredepositDeleteManyArgs> = z.object({
  where: PredepositWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PredepositArticleCreateArgsSchema: z.ZodType<Prisma.PredepositArticleCreateArgs> = z.object({
  select: PredepositArticleSelectSchema.optional(),
  include: PredepositArticleIncludeSchema.optional(),
  data: z.union([ PredepositArticleCreateInputSchema, PredepositArticleUncheckedCreateInputSchema ]),
}).strict();

export const PredepositArticleUpsertArgsSchema: z.ZodType<Prisma.PredepositArticleUpsertArgs> = z.object({
  select: PredepositArticleSelectSchema.optional(),
  include: PredepositArticleIncludeSchema.optional(),
  where: PredepositArticleWhereUniqueInputSchema, 
  create: z.union([ PredepositArticleCreateInputSchema, PredepositArticleUncheckedCreateInputSchema ]),
  update: z.union([ PredepositArticleUpdateInputSchema, PredepositArticleUncheckedUpdateInputSchema ]),
}).strict();

export const PredepositArticleCreateManyArgsSchema: z.ZodType<Prisma.PredepositArticleCreateManyArgs> = z.object({
  data: z.union([ PredepositArticleCreateManyInputSchema, PredepositArticleCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PredepositArticleCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PredepositArticleCreateManyAndReturnArgs> = z.object({
  data: z.union([ PredepositArticleCreateManyInputSchema, PredepositArticleCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PredepositArticleDeleteArgsSchema: z.ZodType<Prisma.PredepositArticleDeleteArgs> = z.object({
  select: PredepositArticleSelectSchema.optional(),
  include: PredepositArticleIncludeSchema.optional(),
  where: PredepositArticleWhereUniqueInputSchema, 
}).strict();

export const PredepositArticleUpdateArgsSchema: z.ZodType<Prisma.PredepositArticleUpdateArgs> = z.object({
  select: PredepositArticleSelectSchema.optional(),
  include: PredepositArticleIncludeSchema.optional(),
  data: z.union([ PredepositArticleUpdateInputSchema, PredepositArticleUncheckedUpdateInputSchema ]),
  where: PredepositArticleWhereUniqueInputSchema, 
}).strict();

export const PredepositArticleUpdateManyArgsSchema: z.ZodType<Prisma.PredepositArticleUpdateManyArgs> = z.object({
  data: z.union([ PredepositArticleUpdateManyMutationInputSchema, PredepositArticleUncheckedUpdateManyInputSchema ]),
  where: PredepositArticleWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PredepositArticleUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PredepositArticleUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PredepositArticleUpdateManyMutationInputSchema, PredepositArticleUncheckedUpdateManyInputSchema ]),
  where: PredepositArticleWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PredepositArticleDeleteManyArgsSchema: z.ZodType<Prisma.PredepositArticleDeleteManyArgs> = z.object({
  where: PredepositArticleWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();