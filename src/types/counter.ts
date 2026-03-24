export type CounterState = {
  value: number
  updatedAt: Date
}

export type ActionResult =
  | { success: true; counter: CounterState }
  | { success: false; error: string }

/**
 * Tipo de fila cruda de base de datos para consultas del contador.
 * Se usa con $queryRaw para seleccionar campos de la tabla counter.
 */
export type CounterRow = {
   key: string
   value: number
   updated_at: Date
   qstash_job_id: string | null
 }
