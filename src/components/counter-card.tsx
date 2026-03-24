import { getCounter } from '@/actions/counter'
import { CounterControls } from '@/components/counter-controls.client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RESET_TIMEOUT_MS } from '@/lib/counter-utils'
import { ResetStatus } from './reset-status.client'


export async function CounterCard() {
  const counter = await getCounter()
  const resetAt = counter.updatedAt.getTime() + RESET_TIMEOUT_MS

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">Contador Global</CardTitle>
        <CardDescription className="text-xs">
          <ResetStatus resetAt={resetAt} />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-8 pt-4">
        <CounterControls initialValue={counter.value} />
      </CardContent>
    </Card>
  )
}
