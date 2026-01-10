import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useDeferredValue } from 'react'
import { toast } from 'sonner'

import { StoreForm } from '@/components/stores/store-form'
import { storeQueryOptions, useStore, useUpdateStore } from '@/data/stores'
import type { StoreFormData } from '@/db/schemas'

// Mock data fetcher
const fetchStore = async (id: string) => {
  // Simulating an API call
  await new Promise((resolve) => setTimeout(resolve, 100))
  return {
    id,
    name: 'Main Street Bakery',
    address: '123 Main St, Springfield, IL 62701',
    phoneNumber: '217-555-0123',
  }
}

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
    <div className="space-y-6">
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
                  store,
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
