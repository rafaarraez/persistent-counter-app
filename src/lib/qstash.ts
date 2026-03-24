import { Client } from '@upstash/qstash'

const globalForQStash = globalThis as unknown as {
  qstash: Client | undefined
}

function createQStashClient(): Client {
  const token = process.env.QSTASH_TOKEN

  if (!token) {
    console.error('[QStash Client] ERROR: QSTASH_TOKEN no está definido')
    throw new Error('QSTASH_TOKEN environment variable is required')
  }

   console.log('[QStash Client] Creando cliente con token válido (largo:', token.length, ')')

  return new Client({ token })
}

export const qstash: Client =
  globalForQStash.qstash ?? createQStashClient()

if (process.env.NODE_ENV !== 'production') {
  globalForQStash.qstash = qstash
}
