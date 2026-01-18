import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useDeferredValue } from 'react'
import { toast } from 'sonner'

import { PendingComponent } from '@/components/pending-component'
import { ResourceErrorComponent } from '@/components/resource-error-component'
import { StoreForm } from '@/components/stores/store-form'
import type { StoreFormData } from '@/db/schemas'
import { useDeleleStore, useStore, useUpdateStore } from '@/queries/stores'

export const Route = createFileRoute('/_authenticated/stores/$storeId/edit')({
  component: StoreEditComponent,
  pendingComponent: PendingComponent,
  errorComponent: ResourceErrorComponent,
})

function StoreEditComponent() {
  const queryClient = useQueryClient()
  const { storeId } = Route.useParams()
  const deferredStoreId = useDeferredValue(storeId)
  const { data: initialData, error } = useStore(deferredStoreId)
  const { mutate, isPending } = useUpdateStore()
  const { mutate: deleteStore } = useDeleleStore()

  console.log(error)

  return (
    <div className="space-y-6 bg-slate-900 p-4 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">編輯廠商</h1>
      </div>
      <div className={isPending ? 'opacity-50 transition-opacity' : ''}>
        <StoreForm
          initialData={initialData}
          mode={'edit'}
          storeId={storeId}
          onSubmit={(store: StoreFormData) =>
            mutate(
              {
                data: {
                  id: storeId,
                  ...store,
                },
              },
              {
                onSuccess({ name }) {
                  toast.success(`編輯 ${name} 成功`)
                  queryClient.invalidateQueries({
                    queryKey: ['stores', storeId],
                  })
                  queryClient.invalidateQueries({
                    queryKey: ['stores'],
                  })
                },
                onError({ message }) {
                  toast.error(`編輯失敗 ${message}`)
                },
              },
            )
          }
          onDelete={() => deleteStore({ data: storeId })}
        />
      </div>
    </div>
  )
}
