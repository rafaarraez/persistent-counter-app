import { getCounter } from '@/actions/counter'
import { CounterControls } from '@/components/counter-controls'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

function getResetStatus(updatedAt: Date): string {
  const elapsed = Date.now() - updatedAt.getTime()
  const remaining = 20 * 60 * 1000 - elapsed
  if (remaining <= 0) return 'Se reiniciará en breve'
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  if (minutes === 0) return `Se reinicia en ${seconds}s`
  return `Se reinicia en ${minutes}m ${seconds}s`
}

export async function CounterCard() {
  const counter = await getCounter()
  const resetStatus = getResetStatus(counter.updatedAt)

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">Contador Global</CardTitle>
        <CardDescription className="text-xs">
          {resetStatus}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-8 pt-4">
        <CounterControls initialValue={counter.value} />
      </CardContent>
    </Card>
  )
}
