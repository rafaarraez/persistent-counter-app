import { getCounter } from '@/actions/counter'
import { CounterControls } from '@/components/counter-controls.client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RESET_TIMEOUT_MS } from '@/lib/counter-utils'

function getResetStatus(updatedAt: Date): string {
  const resetDate = new Date(updatedAt.getTime() + RESET_TIMEOUT_MS)
  const formatted = resetDate.toLocaleTimeString(undefined, { // undefined usa la zona horaria local
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `Se reinicia a las: ${formatted}`
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
