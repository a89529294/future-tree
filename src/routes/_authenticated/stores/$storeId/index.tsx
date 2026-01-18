import { createFileRoute } from '@tanstack/react-router'
import { useDeferredValue } from 'react'

import { PendingComponent } from '@/components/pending-component'
import { ResourceErrorComponent } from '@/components/resource-error-component'
import { StoreForm } from '@/components/stores/store-form'
import { useStore } from '@/queries/stores'

export const Route = createFileRoute('/_authenticated/stores/$storeId/')({
  component: StoreDetailComponent,
  pendingComponent: PendingComponent,
  errorComponent: ResourceErrorComponent,
})

function StoreDetailComponent() {
  const { storeId } = Route.useParams()
  const deferredStoreId = useDeferredValue(storeId)
  const { data: store } = useStore(deferredStoreId)

  return (
    <div className="space-y-6 bg-slate-900 p-4 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">檢視廠商</h1>
      </div>

      <div
        className={
          storeId !== deferredStoreId ? 'opacity-50 transition-opacity' : ''
        }
      >
        <StoreForm
          key={store.id}
          initialData={store}
          mode={'view'}
          storeId={storeId}
        />
      </div>
    </div>
  )
}
