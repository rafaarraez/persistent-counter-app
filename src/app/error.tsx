'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  const errorMessage =
    error.message && error.message.length < 200
      ? error.message
      : 'Algo salió mal. Por favor, intenta de nuevo.'

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>¡Oops! Algo salió mal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/70">
              ID de Error: {error.digest}
            </p>
          )}
          <Button onClick={reset} className="w-full">
            Intentar de nuevo
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
