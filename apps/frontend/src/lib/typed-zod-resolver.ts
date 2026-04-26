import type { FieldValues, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ZodType, infer as zInfer } from 'zod'

// Zod 4 + @hookform/resolvers v5 split the resolver's TFieldValues (input) and
// TTransformedValues (output) — input is `unknown` for `z.coerce.*` fields. Our
// forms reason about a single inferred (output) shape on both sides; this
// helper presents the resolver as `Resolver<z.infer<T>>` so useForm, Controller,
// getValues and SubmitHandler share one type. Runtime behaviour is unchanged.
export function typedZodResolver<T extends ZodType>(
  schema: T,
): Resolver<zInfer<T> & FieldValues> {
  // Cast the schema arg too: zodResolver's overloads are split between Zod 3
  // and Zod 4 shapes, and the generic `ZodType` import isn't narrow enough for
  // overload resolution.
  return zodResolver(
    schema as Parameters<typeof zodResolver>[0],
  ) as unknown as Resolver<zInfer<T> & FieldValues>
}
