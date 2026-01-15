import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useDeferredValue } from 'react'
import { toast } from 'sonner'

import { StoreForm } from '@/components/stores/store-form'
import type { StoreFormData } from '@/db/schemas'
import { storeQueryOptions, useStore, useUpdateStore } from '@/queries/stores'

export const Route = createFileRoute('/_authenticated/stores/$storeId/edit')({
  loader: ({ params, context }) => {
    context.queryClient.ensureQueryData(storeQueryOptions(params.storeId))
  },
  component: StoreEditComponent,
})

function StoreEditComponent() {
  const queryClient = useQueryClient()
  const { storeId } = Route.useParams()
  const deferredStoreId = useDeferredValue(storeId)
  const { data: initialData } = useStore(deferredStoreId)
  const { mutateAsync, isPending } = useUpdateStore()

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
          onSubmit={async (store: StoreFormData) =>
            mutateAsync(
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
                    queryKey: ['sidebar'],
                  })
                },
                onError({ message }) {
                  toast.error(`編輯失敗 ${message}`)
                },
              },
            )
          }
        />
      </div>
    </div>
  )
}
