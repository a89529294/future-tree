import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useDeferredValue } from 'react'
import { toast } from 'sonner'

import { PendingComponent } from '@/components/pending-component'
import { ResourceErrorComponent } from '@/components/resource-error-component'
import { StoreForm } from '@/components/stores/store-form'
import type { StoreFormData } from '@/db/schemas'
import {
  storesQueryKeys,
  useDeleleStore,
  useStore,
  useUpdateStore,
} from '@/queries/stores'

export const Route = createFileRoute(
  '/_authenticated/stores/$storeNumber/edit',
)({
  component: StoreEditComponent,
  pendingComponent: PendingComponent,
  errorComponent: ResourceErrorComponent,
})

function StoreEditComponent() {
  const queryClient = useQueryClient()
  const { storeNumber } = Route.useParams()
  const navigate = Route.useNavigate()
  const deferredStoreNumber = useDeferredValue(storeNumber)
  const { data: initialData } = useStore(deferredStoreNumber)
  const { mutateAsync: updateStore } = useUpdateStore()
  const { mutateAsync: deleteStore } = useDeleleStore()

  return (
    <div className="space-y-6 bg-slate-900 p-4 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">編輯集團</h1>
      </div>
      <div>
        <StoreForm
          initialData={initialData}
          mode={'edit'}
          storeNumber={storeNumber}
          onSubmit={async (store: StoreFormData) => {
            try {
              const { name } = await updateStore({
                data: {
                  storeNumber,
                  ...store,
                },
              })

              toast.success(`編輯 ${name} 成功`)
              queryClient.invalidateQueries({
                queryKey: storesQueryKeys.all,
              })
            } catch (error) {
              const message =
                error instanceof Error ? error.message : '未知錯誤'
              toast.error(`編輯失敗 ${message}`)
            }
          }}
          onDelete={async () => {
            try {
              await deleteStore({ data: storeNumber })

              navigate({ to: '/dashboard' })
              queryClient.invalidateQueries({
                queryKey: storesQueryKeys.all,
              })
            } catch (error) {
              const message =
                error instanceof Error ? error.message : '未知錯誤'
              toast.error(`刪除失敗 ${message}`)
            }
          }}
        />
      </div>
    </div>
  )
}
