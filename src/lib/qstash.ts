import { Client } from '@upstash/qstash'

const globalForQStash = globalThis as unknown as {
  qstash: Client | undefined
}

function createQStashClient(): Client {
   const token = process.env.QSTASH_TOKEN

   if (!token) {
     if (process.env.NODE_ENV === 'development') {
       console.warn('[QStash Client] WARNING: QSTASH_TOKEN no está definido en desarrollo')
       console.warn('[QStash Client] Las operaciones de QStash fallarán en tiempo de llamada, no de importación')
       // Devuelve un cliente que falla gracefully cuando se llama, permitiendo que la app inicie
       // Esto es aceptable solo en desarrollo local  
       return new Client({ token: 'dev-placeholder-token' })
     }
     throw new Error('La variable de entorno QSTASH_TOKEN es requerida en producción')
   }

   console.log('[QStash Client] Creando cliente con token válido (largo:', token.length, ')')

   return new Client({ token })
 }

export const qstash: Client =
  globalForQStash.qstash ?? createQStashClient()

if (process.env.NODE_ENV !== 'production') {
  globalForQStash.qstash = qstash
}
