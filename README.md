# persistent-counter-app

Aplicación web de contador global con persistencia en base de datos construida con **Next.js 15** y **Server Actions**. El contador se incrementa o decrementa de forma atómica y se resetea automáticamente a cero tras 20 minutos de inactividad, sin necesidad de procesos en segundo plano ni cron jobs. El estado persiste en **Supabase (PostgreSQL)** mediante **Prisma 7**.

Puedes visitar la app disponible en Vercel en: [https://persistent-counter-app.vercel.app/](https://persistent-counter-app.vercel.app/).

---

## Requisitos previos

- Node.js 20.x o superior
- pnpm 9.x (recomendado) o npm/yarn
- Cuenta de Supabase (tier gratuito suficiente para este proyecto)

---

## Stack tecnológico

| Capa              | Tecnología                         |
|-------------------|------------------------------------|
| Framework         | Next.js 15 con App Router          |
| Lenguaje          | TypeScript (modo estricto)         |
| Base de datos     | Supabase (PostgreSQL)              |
| ORM               | Prisma 7 con `@prisma/adapter-pg`  |
| UI                | Shadcn UI + Sonner                 |
| Paradigma backend | Server Actions + Server Components |

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
NODE_ENV=development o production
DATABASE_URL="postgresql://..."
```

**Nota:** La cadena de conexión debe incluir el parámetro `pooling=false` para evitar problemas con migraciones en entornos de producción.

---

## Instalación y configuración

Sigue estos pasos en orden después de clonar el repositorio:

### 1. Instalar dependencias

```bash
pnpm install
```

> Esto también ejecuta `prisma generate` automáticamente gracias al script `postinstall`.

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp .env.example .env
```

Edita `.env` y configura `DATABASE_URL` con tu cadena de conexión de Supabase (usa la conexión directa, puerto `5432`, no el pooler de PgBouncer en puerto `6543`).

### 3. Aplicar migraciones

```bash
pnpm prisma migrate deploy
```

### 4. Crear el registro inicial del contador (seed)

```bash
pnpm prisma db seed
```

### 5. Iniciar el servidor de desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## Scripts útiles

| Comando                      | Descripción                                       |
|------------------------------|---------------------------------------------------|
| `pnpm dev`                   | Inicia el servidor de desarrollo con Turbopack    |
| `pnpm build`                 | Compila la aplicación para producción             |
| `pnpm start`                 | Inicia el servidor de producción                  |
| `pnpm lint`                  | Ejecuta ESLint                                    |
| `pnpm prisma migrate dev`    | Crea y aplica una migración en desarrollo         |
| `pnpm prisma migrate deploy` | Aplica migraciones en producción                  |
| `pnpm prisma db seed`        | Ejecuta el seed (crea el registro inicial)        |
| `pnpm prisma studio`         | Abre Prisma Studio para explorar la base de datos |

---

## Estructura de carpetas

```
prisma/
  schema.prisma         → Definición del modelo Counter
  seed.ts               → Script de seeding de la fila inicial
  migrations/           → Historial de migraciones generado por Prisma
src/
  actions/
    counter.ts          → Server Actions: getCounter, incrementCounter, decrementCounter
  app/
    layout.tsx          → Layout raíz con Toaster de Sonner registrado globalmente
    page.tsx            → Página principal con force-dynamic y Suspense boundary
    globals.css         → Estilos globales
    favicon.ico
  components/
    counter-card.tsx              → Server Component: obtiene counter y calcula resetStatus
    counter-controls.client.tsx   → Client Component: useOptimistic + useTransition + toasts
    ui/
      button.tsx        → Componente de botón de Shadcn UI
      card.tsx          → Componente de tarjeta de Shadcn UI
      sonner.tsx        → Wrapper del Toaster de Sonner
  lib/
    prisma.ts           → Singleton de PrismaClient con PrismaPg adapter
    utils.ts            → Utilidades compartidas (cn)
  types/
    counter.ts          → Tipos TypeScript: CounterState, ActionResult
```

---

## Decisiones técnicas y arquitectura

### Server Components como capa principal de renderizado
El componente raíz de la página es un Server Component que lee el estado del contador directamente desde la base de datos en cada solicitud. Esto elimina la necesidad de un estado cliente adicional para el valor inicial y reduce el JavaScript enviado al navegador.

### Server Actions para mutaciones
Las operaciones de incremento y decremento se implementan como Server Actions en lugar de API Routes. Esto simplifica el código eliminando la capa HTTP explícita y permite invocar lógica de servidor directamente desde componentes, manteniendo la seguridad de tipo de extremo a extremo con TypeScript.

### Prisma 7 con `@prisma/adapter-pg`
Prisma 7 introduce una nueva API que requiere configurar un adapter de base de datos explícitamente. Se usa `PrismaPg` de `@prisma/adapter-pg` junto con `Pool` de `pg` como adapter al inicializar el singleton de `PrismaClient` en `src/lib/prisma.ts`. La instancia del cliente se crea una vez y se reutiliza gracias al patrón singleton con `globalThis`, evitando múltiples conexiones en desarrollo con hot reload.

### Concurrencia `SELECT FOR UPDATE` dentro de `$transaction`
Para garantizar atomicidad real en las operaciones de incremento y decremento, se usa `$queryRaw` con `SELECT ... FOR UPDATE` dentro de `prisma.$transaction()`. Esto obtiene un bloqueo exclusivo de fila (row-level lock) a nivel de PostgreSQL antes de leer y escribir el valor, previniendo race conditions cuando múltiples usuarios actualizan el contador simultáneamente. La segunda transacción concurrente queda bloqueada hasta que la primera libera el lock al hacer commit.

### `useOptimistic` de React 19
Los controles del contador usan `useOptimistic` (disponible en React 19 / Next.js 15) en lugar de `useState` para el valor mostrado. Esto permite actualizar el UI de forma inmediata sin esperar la respuesta del servidor. El rollback es automático: si la Server Action falla, React revierte al último valor base (`initialValue`) sin necesidad de lógica manual de restauración.

### `export const dynamic = 'force-dynamic'` en `page.tsx`
La página usa `force-dynamic` para evitar que Next.js intente pre-renderizar la ruta en build time, ya que requiere acceso a la base de datos en cada request. Esto garantiza que el valor del contador siempre refleje el estado actual de la DB al momento del render.

### Sonner para notificaciones
Se usa `sonner` (integrado en Shadcn UI) para mostrar toasts de error cuando las Server Actions fallan. El componente `<Toaster />` está registrado en el layout raíz para disponibilidad global en toda la aplicación.

### Indicador de reset en tiempo de servidor
La función `getResetStatus()` en `CounterCard` calcula a que hora se aplicara el reset automático, calculado en el servidor en el momento del render a partir del `updated_at` devuelto por la DB.

### Reset automático por evaluación de timestamp
El reset a cero tras 20 minutos de inactividad no requiere cron jobs ni workers. En cada lectura (`getCounter`) y en cada mutación (`incrementCounter`, `decrementCounter`), se evalúa el campo `updated_at` de la fila del contador: si el tiempo transcurrido supera los 20 minutos, el reset se aplica dentro de la misma operación antes de retornar el valor. Esto garantiza consistencia global sin infraestructura adicional.

### Supabase como base de datos
Supabase ofrece integración nativa con Prisma mediante cadenas de conexión estándar de PostgreSQL y dispone de un tier gratuito suficiente para el scope del proyecto.

---

## Solución de problemas

### Error de conexión a la base de datos al migrar
Usa la cadena de conexión directa (puerto `5432`), no el pooler de PgBouncer (puerto `6543`), al ejecutar migraciones con Prisma.

### El contador no se muestra o falla en desarrollo
Asegúrate de haber ejecutado `pnpm prisma db seed` para crear el registro inicial del contador en la base de datos.

### Variables de entorno
El timeout de reset del contador está hardcodeado en [`src/lib/counter-utils.ts`](src/lib/counter-utils.ts) como `RESET_TIMEOUT_MINUTES = 20`. Para cambiarlo, edita ese valor directamente.
