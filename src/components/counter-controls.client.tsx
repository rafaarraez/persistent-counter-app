'use client'

import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { incrementCounter, decrementCounter } from '@/actions/counter'

type CounterControlsProps = {
  initialValue: number
}

export function CounterControls({ initialValue }: CounterControlsProps) {
  const [optimisticValue, setOptimisticValue] = useOptimistic(initialValue)
  const [isPending, startTransition] = useTransition()

  function handleIncrement() {
    startTransition(async () => {
      setOptimisticValue((prev) => prev + 1)
      const result = await incrementCounter()
      if (!result.success) {
        toast.error('Error al incrementar', {
          description: result.error,
        })
      }
    })
  }

  function handleDecrement() {
    startTransition(async () => {
      setOptimisticValue((prev) => prev - 1)
      const result = await decrementCounter()
      if (!result.success) {
        toast.error('Error al decrementar', {
          description: result.error,
        })
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div
        className="text-8xl font-bold tabular-nums select-none transition-opacity duration-150"
        style={{ opacity: isPending ? 0.6 : 1 }}
        aria-live="polite"
        aria-label={`Valor del contador: ${optimisticValue}`}
      >
        {optimisticValue}
      </div>

      <div className="flex items-center gap-4" role="group" aria-label="Controles del contador">
        <Button
          variant="outline"
          size="lg"
          onClick={handleDecrement}
          disabled={isPending}
          aria-label="Decrementar contador en 1"
          className="w-16 h-16 text-2xl font-light cursor-pointer"
        >
          −
        </Button>

        <Button
          size="lg"
          onClick={handleIncrement}
          disabled={isPending}
          aria-label="Incrementar contador en 1"
          className="w-16 h-16 text-2xl cursor-pointer"
        >
          +
        </Button>
      </div>

      {isPending && (
        <p className="text-xs text-muted-foreground" aria-live="polite" aria-atomic="true">
          Sincronizando...
        </p>
      )}
    </div>
  )
}
