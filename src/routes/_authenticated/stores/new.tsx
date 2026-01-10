import { createFileRoute } from '@tanstack/react-router'

import { StoreForm } from '@/components/stores/store-form'
// import { createStore } from '@/data/stores'
import type { StoreFormData } from '@/db/schemas'

export const Route = createFileRoute('/_authenticated/stores/new')({
  component: StoreNewComponent,
})

function StoreNewComponent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">建立廠商</h1>
      </div>
      {/* <StoreForm
        mode="new"
        onSubmit={(store: StoreFormData) => createStore({ data: store })}
      /> */}
    </div>
  )
}
