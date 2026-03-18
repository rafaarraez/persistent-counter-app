import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
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
  })
