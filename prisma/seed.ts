import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
})

async function main() {
  const existing = await prisma.counter.findFirst()

  if (!existing) {
    await prisma.counter.create({
      data: {
        value: 0,
      },
    })
    console.log('✅ Registro inicial del contador creado (value: 0)')
  } else {
    console.log('ℹ️ El contador ya existe (value:', existing.value, ')')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
