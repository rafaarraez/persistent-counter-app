'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { incrementCounter, decrementCounter } from '@/actions/counter'

type CounterControlsProps = {
  initialValue: number
}

export function CounterControls({ initialValue }: CounterControlsProps) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleIncrement() {
    setError(null)
    startTransition(async () => {
      const result = await incrementCounter()
      if (result.success) {
        setValue(result.counter.value)
      } else {
        setError(result.error)
      }
    })
  }

  function handleDecrement() {
    setError(null)
    startTransition(async () => {
      const result = await decrementCounter()
      if (result.success) {
        setValue(result.counter.value)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-8xl font-bold tabular-nums transition-all duration-200">
        {value}
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={handleDecrement}
          disabled={isPending}
          aria-label="Decrementar contador"
          className="w-16 h-16 text-2xl"
        >
          −
        </Button>

        <Button
          size="lg"
          onClick={handleIncrement}
          disabled={isPending}
          aria-label="Incrementar contador"
          className="w-16 h-16 text-2xl"
        >
          +
        </Button>
      </div>

      {isPending && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Guardando...
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          Error: {error}
        </p>
      )}
    </div>
  )
}
