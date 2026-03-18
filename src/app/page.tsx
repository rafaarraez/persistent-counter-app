import { Suspense } from 'react'
import { CounterCard } from '@/components/counter-card'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

function CounterCardSkeleton() {
  return (
    <Card className="w-full max-w-sm">
      <CardContent className="flex flex-col items-center gap-6 py-10">
        <div className="w-32 h-24 rounded-lg bg-muted animate-pulse" />
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-md bg-muted animate-pulse" />
          <div className="w-16 h-16 rounded-md bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-4 sm:p-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Contador Persistente
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          El valor se mantiene entre sesiones y se reinicia tras 20 minutos de
          inactividad
        </p>
      </div>

      <Suspense fallback={<CounterCardSkeleton />}>
        <CounterCard />
      </Suspense>
    </main>
  );
}
