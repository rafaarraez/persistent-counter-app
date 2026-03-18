import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
  log: ['error', 'warn'],
})

const COUNTER_KEY = "global"

async function main() {
  await prisma.counter.upsert({
    where: { key: COUNTER_KEY },
    update: {}, // no cambia nada si ya existe
    create: {
      key: COUNTER_KEY,
      value: 0,
    },
  })

  console.log("✅ Counter inicializado correctamente")
}
main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
