// Comptes créés à chaque `db:reset` (prisma migrate reset lance le seed) et
// par `db:seed`.
//
// Une bourse se prépare en réinitialisant la base, et sans compte personne ne
// peut se connecter : ces deux-là suffisent pour ouvrir l'application tout de
// suite. Le mot de passe est volontairement trivial — la base est locale au
// réseau de la salle et ces comptes sont faits pour être partagés entre
// bénévoles.
import bcrypt from 'bcrypt'
import { PrismaClient } from '../generated/client/index.js'

const prisma = new PrismaClient()

const USERS = [
  { email: 'admin@cmr.com', password: 'admin', role: 'ADMIN' },
  { email: 'benevole@cmr.com', password: 'benevole', role: 'BENEVOLE' },
] as const

async function seed() {
  for (const { email, password, role } of USERS) {
    // users.email ne porte pas de contrainte d'unicité : on cherche avant
    // d'insérer, pour que le seed puisse être rejoué sans créer de doublon.
    const existing = await prisma.user.findFirst({ where: { email } })
    if (existing) {
      console.log(`= ${email} (${existing.role}) existe déjà`)
      continue
    }
    await prisma.user.create({
      data: { email, password: await bcrypt.hash(password, 10), role },
    })
    console.log(`+ ${email} (${role}) — mot de passe : ${password}`)
  }
}

seed()
  .catch((error) => {
    console.error('❌ Seed échoué :', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
