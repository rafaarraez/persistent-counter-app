'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { qstash } from '@/lib/qstash'
import { RESET_TIMEOUT_SECONDS, COUNTER_KEY } from '@/lib/counter-utils'
import type { ActionResult, CounterState, CounterRow } from '@/types/counter'

/**
 * Lee el valor actual del contador desde la base de datos.
 * Esta función NO es una Server Action pura (no usa revalidatePath),
 * está pensada para ser llamada desde Server Components.
 */
export async function getCounter(): Promise<CounterState> {
  const counter = await prisma.counter.findUniqueOrThrow({
    where: { key: COUNTER_KEY },
  })

  return { value: counter.value, updatedAt: counter.updated_at }
}

/**
 * Mutate counter value de forma atómica.
 * 
 * Flow:
 * 1. Publish QStash job FIRST (get messageId)
 * 2. Inside transaction: update counter value AND persist messageId atomically
 * 3. After transaction: cancel old job (best-effort, non-critical)
 * 
 * This ensures atomicity: value + job_id are always consistent.
 * Old job cancellation is best-effort since QStash handles duplicate idempotency.
 */
async function mutateCounter(operation: 'increment' | 'decrement'): Promise<ActionResult> {
   let previousJobId: string | null = null
   let newQStashMessageId: string | null = null
   let updatedCounter: { value: number; updated_at: Date } | null = null

   try {
      // Step 1: Publish new QStash job BEFORE transaction to get messageId
      console.log('[QStash] Publicando nuevo job...')
      if (process.env.QSTASH_TOKEN && process.env.NEXT_PUBLIC_APP_URL) {
        try {
          const publishResult = await qstash.publishJSON({
            url: `${process.env.NEXT_PUBLIC_APP_URL}/api/reset`,
            body: {},
            delay: RESET_TIMEOUT_SECONDS,
          })

          newQStashMessageId = publishResult.messageId
          console.log('[QStash] Job publicado exitosamente:', {
            messageId: newQStashMessageId,
            url: `${process.env.NEXT_PUBLIC_APP_URL}/api/reset`,
            delay: RESET_TIMEOUT_SECONDS,
          })
        } catch (publishError) {
          console.error('[QStash] ERROR al publicar job:', publishError)
          throw publishError
        }
      } else {
        const missingVars = []
        if (!process.env.QSTASH_TOKEN) missingVars.push('QSTASH_TOKEN')
        if (!process.env.NEXT_PUBLIC_APP_URL) missingVars.push('NEXT_PUBLIC_APP_URL')
        console.warn('[QStash] OMITIDO: Variables de entorno faltantes:', missingVars.join(', '))
      }

      // Step 2: Perform atomic transaction with counter update AND job ID persistence
      console.log('[QStash] Iniciando transacción atómica...')
      updatedCounter = await prisma.$transaction(async (tx) => {
        const current = await tx.$queryRaw<CounterRow[]>`
          SELECT key, value, updated_at, qstash_job_id FROM counter WHERE key = ${COUNTER_KEY} FOR UPDATE
        `

        if (current.length === 0) throw new Error('Contador no encontrado')

        const counter = current[0]
        previousJobId = counter.qstash_job_id
        const newValue = operation === 'increment' ? counter.value + 1 : counter.value - 1

        // Update counter value AND job ID atomically
        const updated = await tx.counter.update({
          where: { key: COUNTER_KEY },
          data: { 
            value: newValue,
            qstash_job_id: newQStashMessageId,
          },
        })

        console.log('[QStash] Transacción completada. Job ID persistido:', newQStashMessageId)

        return { value: updated.value, updated_at: updated.updated_at }
      })

      // Step 3: Cancel old QStash job (best-effort, after transaction confirmed)
      if (previousJobId) {
        console.log('[QStash] Cancelando job anterior en background:', previousJobId)
        try {
          await qstash.messages.cancel(previousJobId)
          console.log('[QStash] Job anterior cancelado exitosamente')
        } catch (cancelError) {
          // El job puede ya haber expirado o ejecutado, ignorar silenciosamente
          console.log('[QStash] No se pudo cancelar job anterior (puede haber expirado):', cancelError)
        }
      }

      revalidatePath('/')
      return { success: true, counter: { value: updatedCounter.value, updatedAt: updatedCounter.updated_at } }
   } catch (error) {
      console.error('[Counter Mutation] Error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
   }
}

/**
 * Incrementa el contador en 1 de forma atómica.
 * Transacción atómica para evitar race conditions.
 */
export async function incrementCounter(): Promise<ActionResult> {
   return mutateCounter('increment')
 }

/**
 * Decrementa el contador en 1 de forma atómica.
 * Transacción atómica para evitar race conditions.
 */
export async function decrementCounter(): Promise<ActionResult> {
   return mutateCounter('decrement')
 }
