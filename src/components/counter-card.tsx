import { getCounter } from '@/actions/counter'
import { CounterControls } from '@/components/counter-controls'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export async function CounterCard() {
  const counter = await getCounter()

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Contador Global</CardTitle>
        <CardDescription>
          Se reinicia automáticamente tras 20 min de inactividad
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-8">
        <CounterControls initialValue={counter.value} />
      </CardContent>
    </Card>
  )
}
