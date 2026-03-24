/**
 * Tiempo de inactividad en milisegundos antes de que el contador se resetee automáticamente.
 * Si deseas cambiar el timeout, modifica RESET_TIMEOUT_MINUTES aquí.
 */
export const RESET_TIMEOUT_MINUTES = 20;
export const RESET_TIMEOUT_SECONDS = RESET_TIMEOUT_MINUTES * 60;
export const RESET_TIMEOUT_MS = RESET_TIMEOUT_SECONDS * 1000;

/**
 * Clave única del contador global en la base de datos.
 */
export const COUNTER_KEY = 'global';
