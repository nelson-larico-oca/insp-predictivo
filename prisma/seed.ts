import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
  const email = process.env.SEED_USER_EMAIL ?? 'admin@insp.local'
  const password = process.env.SEED_USER_PASSWORD ?? 'changeme123'
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Seed user ${email} already exists, skipping.`)
    return
  }
  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name: 'Administrador', email, passwordHash, role: 'ADMIN' },
  })
  console.log(`Seed user created: ${email}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
