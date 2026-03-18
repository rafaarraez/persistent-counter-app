'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { ActionResult, CounterState } from '@/types/counter'

const RESET_TIMEOUT_MS = 1 * 60 * 1000 // 20 minutos en milisegundos
const COUNTER_ID = 1

/**
 * Evalúa si el contador debe resetearse basándose en el timestamp de última actualización.
 * Retorna true si han pasado más de 20 minutos desde updated_at.
 */
function shouldReset(updatedAt: Date): boolean {
  return Date.now() - updatedAt.getTime() > RESET_TIMEOUT_MS
}

/**
 * Lee el valor actual del contador desde la base de datos.
 * Si han pasado más de 20 minutos desde la última actualización,
 * resetea el valor a 0 antes de retornar.
 * Esta función NO es una Server Action pura (no usa revalidatePath),
 * está pensada para ser llamada desde Server Components.
 */
export async function getCounter(): Promise<CounterState> {
  const counter = await prisma.counter.findUniqueOrThrow({
    where: { id: COUNTER_ID },
  })

  if (shouldReset(counter.updated_at)) {
    const reset = await prisma.counter.update({
      where: { id: COUNTER_ID },
      data: { value: 0 },
    })
    return { value: reset.value, updatedAt: reset.updated_at }
  }

  return { value: counter.value, updatedAt: counter.updated_at }
}

/**
 * Incrementa el contador en 1 de forma atómica.
 * Evalúa el reset antes de aplicar el incremento.
 * Transacción atómica para evitar race conditions.
 */
export async function incrementCounter(): Promise<ActionResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.$queryRaw<Array<{ id: number; value: number; updated_at: Date }>>`
        SELECT id, value, updated_at FROM counter WHERE id = ${COUNTER_ID} FOR UPDATE
      `

      if (current.length === 0) throw new Error('Contador no encontrado')

      const counter = current[0]
      const baseValue = shouldReset(counter.updated_at) ? 0 : counter.value

      return tx.counter.update({
        where: { id: COUNTER_ID },
        data: { value: baseValue + 1 },
      })
    })

    revalidatePath('/')
    return { success: true, counter: { value: result.value, updatedAt: result.updated_at } }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

/**
 * Decrementa el contador en 1 de forma atómica.
 * Evalúa el reset antes de aplicar el decremento.
 * Transacción atómica para evitar race conditions.
 */
export async function decrementCounter(): Promise<ActionResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.$queryRaw<Array<{ id: number; value: number; updated_at: Date }>>`
        SELECT id, value, updated_at FROM counter WHERE id = ${COUNTER_ID} FOR UPDATE
      `

      if (current.length === 0) throw new Error('Contador no encontrado')

      const counter = current[0]
      const baseValue = shouldReset(counter.updated_at) ? 0 : counter.value

      return tx.counter.update({
        where: { id: COUNTER_ID },
        data: { value: baseValue - 1 },
      })
    })

    revalidatePath('/')
    return { success: true, counter: { value: result.value, updatedAt: result.updated_at } }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}
