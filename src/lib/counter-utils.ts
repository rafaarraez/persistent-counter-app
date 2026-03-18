/**
 * Tiempo de inactividad en milisegundos antes de que el contador se resetee automáticamente.
 * Si deseas cambiar el timeout, modifica RESET_TIMEOUT_MINUTES aquí.
 */
export const RESET_TIMEOUT_MINUTES = 20;
export const RESET_TIMEOUT_MS = RESET_TIMEOUT_MINUTES * 60 * 1000;

/**
 * Determina si el contador debe resetearse basado en su última actualización.
 */
export function shouldReset(updatedAt: Date): boolean {
  return Date.now() - updatedAt.getTime() > RESET_TIMEOUT_MS;
}
