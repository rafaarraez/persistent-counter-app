export type CounterState = {
  value: number
  updatedAt: Date
}

export type ActionResult =
  | { success: true; counter: CounterState }
  | { success: false; error: string }
