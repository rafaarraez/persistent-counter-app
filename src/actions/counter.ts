'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { qstash } from '@/lib/qstash'
import { shouldReset, RESET_TIMEOUT_SECONDS } from '@/lib/counter-utils'
import type { ActionResult, CounterState } from '@/types/counter'

const COUNTER_KEY = "global"

/**
 * Lee el valor actual del contador desde la base de datos.
 * Si han pasado más de 20 minutos desde la última actualización,
 * resetea el valor a 0 antes de retornar.
 * Esta función NO es una Server Action pura (no usa revalidatePath),
 * está pensada para ser llamada desde Server Components.
 */
export async function getCounter(): Promise<CounterState> {
  const counter = await prisma.counter.findUniqueOrThrow({
    where: { key: COUNTER_KEY },
  })

  if (shouldReset(counter.updated_at)) {
    const reset = await prisma.counter.update({
      where: { key: COUNTER_KEY },
      data: { value: 0 },
    })
    return { value: reset.value, updatedAt: reset.updated_at }
  }

  return { value: counter.value, updatedAt: counter.updated_at }
}

/**
 * Mutate counter value de forma atómica.
 * Evalúa el reset antes de aplicar la operación.
 * Transacción atómica para evitar race conditions.
 * Publica un delayed job en QStash tras confirmar la transacción.
 */
async function mutateCounter(operation: 'increment' | 'decrement'): Promise<ActionResult> {
  let previousJobId: string | null = null
  let updatedCounter: { value: number; updated_at: Date } | null = null

  try {
     // Transacción atómica para actualizar el contador
     updatedCounter = await prisma.$transaction(async (tx) => {
       const current = await tx.$queryRaw<Array<{ key: string; value: number; updated_at: Date; qstash_job_id: string | null }>>`
         SELECT key, value, updated_at, qstash_job_id FROM counter WHERE key = ${COUNTER_KEY} FOR UPDATE
       `

       if (current.length === 0) throw new Error('Contador no encontrado')

       const counter = current[0]
       previousJobId = counter.qstash_job_id
       const baseValue = shouldReset(counter.updated_at) ? 0 : counter.value
       const newValue = operation === 'increment' ? baseValue + 1 : baseValue - 1

       const updated = await tx.counter.update({
         where: { key: COUNTER_KEY },
         data: { value: newValue },
       })

       return { value: updated.value, updated_at: updated.updated_at }
     })

      // Procesar QStash fuera de la transacción (después del commit)
      console.log('[QStash] Iniciando procesamiento post-transacción')

      try {
        // Cancelar el job anterior si existe
         if (previousJobId) {
           console.log('[QStash] Cancelando job anterior:', previousJobId)
           try {
             await qstash.messages.cancel(previousJobId)
             console.log('[QStash] Job anterior cancelado exitosamente')
           } catch (deleteError) {
             // El job puede ya haber expirado o ejecutado, ignorar silenciosamente
             console.log('[QStash] No se pudo cancelar job anterior (puede haber expirado):', deleteError)
           }
         }

        // Publicar nuevo delayed job con TTL de 20 minutos (1200 segundos)
        if (process.env.QSTASH_TOKEN && process.env.NEXT_PUBLIC_APP_URL) {
          console.log('[QStash] Publicando nuevo job a:', `${process.env.NEXT_PUBLIC_APP_URL}/api/reset`)

          const publishResult = await qstash.publishJSON({
            url: `${process.env.NEXT_PUBLIC_APP_URL}/api/reset`,
            body: {},
            delay: RESET_TIMEOUT_SECONDS,
          })

          console.log('[QStash] Job publicado exitosamente:', {
            messageId: publishResult.messageId,
            url: `${process.env.NEXT_PUBLIC_APP_URL}/api/reset`,
            delay: RESET_TIMEOUT_SECONDS,
          })

          // Persistir el nuevo job ID
          await prisma.counter.update({
            where: { key: COUNTER_KEY },
            data: { qstash_job_id: publishResult.messageId },
          })
          console.log('[QStash] Job ID persistido en base de datos:', publishResult.messageId)
        } else {
          const missingVars = []
          if (!process.env.QSTASH_TOKEN) missingVars.push('QSTASH_TOKEN')
          if (!process.env.NEXT_PUBLIC_APP_URL) missingVars.push('NEXT_PUBLIC_APP_URL')
          console.warn('[QStash] OMITIDO: Variables de entorno faltantes:', missingVars.join(', '))
        }
      } catch (qstashError) {
        // Loguear el error pero no fallar la operación del contador
        console.error('[QStash] ERROR al procesar QStash:', qstashError)
        if (qstashError instanceof Error) {
          console.error('[QStash] Error details:', {
            message: qstashError.message,
            stack: qstashError.stack,
            name: qstashError.name,
          })
        }
      }

     revalidatePath('/')
     return { success: true, counter: { value: updatedCounter.value, updatedAt: updatedCounter.updated_at } }
   } catch (error) {
     return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
   }
}

/**
 * Incrementa el contador en 1 de forma atómica.
 * Evalúa el reset antes de aplicar el incremento.
 * Transacción atómica para evitar race conditions.
 */
export async function incrementCounter(): Promise<ActionResult> {
  return mutateCounter('increment')
}

/**
 * Decrementa el contador en 1 de forma atómica.
 * Evalúa el reset antes de aplicar el decremento.
 * Transacción atómica para evitar race conditions.
 */
export async function decrementCounter(): Promise<ActionResult> {
  return mutateCounter('decrement')
}
