import { createFileRoute } from '@tanstack/react-router'
import { useDeferredValue } from 'react'

import { StoreForm } from '@/components/stores/store-form'
import { Spinner } from '@/components/ui/spinner'
import { storeQueryOptions, useStore } from '@/data/stores'

export const Route = createFileRoute('/_authenticated/stores/$storeId/')({
  loader: ({ params, context }) => {
    context.queryClient.ensureQueryData(storeQueryOptions(params.storeId))
  },
  component: StoreDetailComponent,
  pendingComponent: () => (
    <div className="h-full grid place-items-center">
      <Spinner className="size-8" />
    </div>
  ),
})

function StoreDetailComponent() {
  const { storeId } = Route.useParams()
  const deferredStoreId = useDeferredValue(storeId)
  const { data: store } = useStore(deferredStoreId)

  return (
    <div className="space-y-6">
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
