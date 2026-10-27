// Notre référentiel, tel que l'app et l'import des pré-dépôts l'utilisent,
// pour decode_pro.py. Lit sur stdin {"brands": [noms], "letters": n} et écrit
// sur stdout les listes de l'app, la marque trouvée par findBrand pour chaque
// nom, la table identifiant → marque de l'import de l'ancien export (même
// logiciel, mêmes identifiants) et les n premières lettres d'identification.
// Lancé par decode_pro.py, depuis apps/backend.
import { readFileSync } from 'node:fs'
import { marques } from '../marques'
import { findBrand } from '../predeposit-brand'
import { brands } from '../../../../../frontend/src/types/brands'
import { categories } from '../../../../../frontend/src/types/categories'
import { colors } from '../../../../../frontend/src/types/colors'
import { disciplines } from '../../../../../frontend/src/types/disciplines'
import { generateIdentificationLetter } from '../../../../../frontend/src/utils'

const input: { brands: string[]; letters: number } = JSON.parse(readFileSync(0, 'utf8'))
console.log(
  JSON.stringify({
    brands,
    categories,
    disciplines,
    colors,
    found: input.brands.map((name) => findBrand(name)),
    legacy: marques,
    letters: Array.from({ length: input.letters }, (_, i) => generateIdentificationLetter(i)),
  }),
)
