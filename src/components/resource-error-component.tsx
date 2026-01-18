import type { ErrorComponentProps } from '@tanstack/react-router'

export function ResourceErrorComponent(e: ErrorComponentProps) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">頁面錯誤</h1>
      <p className="text-muted-foreground">{e.error.message}</p>
    </div>
  )
}
