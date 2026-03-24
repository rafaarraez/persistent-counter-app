import { Receiver } from "@upstash/qstash";
import { prisma } from "@/lib/prisma";
import { COUNTER_KEY } from "@/lib/counter-utils";
import type { CounterRow } from "@/types/counter";

// Falla en startup si faltan las claves — no en cada request
const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

if (!currentSigningKey || !nextSigningKey) {
  throw new Error(
    "Faltan variables de entorno: QSTASH_CURRENT_SIGNING_KEY y/o QSTASH_NEXT_SIGNING_KEY"
  );
}

// Receiver instanciado una sola vez al cargar el módulo
const receiver = new Receiver({ currentSigningKey, nextSigningKey });

export async function POST(request: Request) {
  // 1. Verificar firma de QStash
  const body = await request.text();
  const signature = request.headers.get("upstash-signature") ?? "";

  const isValid = await receiver.verify({ body, signature });
  if (!isValid) {
    console.error("[QStash Reset] Firma inválida");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Leer message ID
  const qstashMessageId = request.headers.get("upstash-message-id");
  if (!qstashMessageId) {
    console.error("[QStash Reset] Falta el header upstash-message-id");
    return Response.json({ error: "Missing message ID header" }, { status: 400 });
  }

  // 3. Transacción atómica con validación idempotente
  try {
    await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<CounterRow[]>`
        SELECT key, value, updated_at, qstash_job_id
        FROM counter
        WHERE key = ${COUNTER_KEY}
        FOR UPDATE
      `;

      if (rows.length === 0) {
        throw new Error(`Contador no encontrado para key="${COUNTER_KEY}"`);
      }

      const counter = rows[0];

      // Descartar jobs obsoletos silenciosamente
      if (qstashMessageId !== counter.qstash_job_id) {
        console.log("[QStash Reset] Job descartado (no es el job activo):", {
          received: qstashMessageId,
          active: counter.qstash_job_id,
        });
        return;
      }

      await tx.counter.update({
        where: { key: COUNTER_KEY },
        data: { value: 0, qstash_job_id: null },
      });

      console.log("[QStash Reset] Contador reseteado a 0");
    });

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[QStash Reset] Error inesperado:", error);
    return Response.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}