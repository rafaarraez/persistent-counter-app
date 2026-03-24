// reset-status.client.tsx
'use client'

export function ResetStatus({ resetAt }: { resetAt: number }) {
  const formatted = new Date(resetAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return <span>Se reinicia a las: {formatted}</span>
}