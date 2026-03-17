export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Contador Persistente
        </h1>
        <p className="text-muted-foreground text-lg">
          El valor se mantiene entre sesiones y se reinicia tras 20 minutos de
          inactividad
        </p>
      </div>

      {/* Aquí irá el componente CounterCard en la Fase 6 */}
      <div className="w-full max-w-sm h-48 rounded-xl border border-dashed border-muted-foreground/30 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Componente del contador (próxima fase)
        </p>
      </div>
    </main>
  );
}
