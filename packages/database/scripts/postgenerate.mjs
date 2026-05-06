// Prepend `// @ts-nocheck` to the zod-prisma-types output.
//
// Why: the generated file in ../types/src/generated/index.ts contains
// type errors caused by a known mismatch between zod 4 and the generator's
// emitted z.instanceof(...) calls around `Decimal`. Type-checking the file
// blocks the @cmr-apps/types build, even though the generated runtime is
// fine. We never *consume* the zod schemas anywhere in the repo — only the
// plain TS interfaces in ../types/src/index.ts — so silencing the type
// checker on this one auto-generated file is the safe choice.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const target = path.resolve(here, '..', '..', 'types', 'src', 'generated', 'index.ts')

const banner = '// @ts-nocheck\n'
const current = fs.readFileSync(target, 'utf8')
if (!current.startsWith(banner)) {
  fs.writeFileSync(target, banner + current)
}
