import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
  const name = process.env.ADMIN_NAME
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!name || !email || !password) {
    throw new Error('Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD env vars before running this script')
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: 'ADMIN' },
    create: { name, email, passwordHash, role: 'ADMIN' },
  })
  console.log(`Admin user ready: ${user.email} (${user.id})`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
