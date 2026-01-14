import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'

import { StoreForm } from '@/components/stores/store-form'
import { useCreateStore } from '@/data/stores'
import type { StoreFormData } from '@/db/schemas'

export const Route = createFileRoute('/_authenticated/stores/create')({
  component: StoreNewComponent,
})

function StoreNewComponent() {
  const createStore = useCreateStore()
  const queryClient = useQueryClient()
  const navigate = Route.useNavigate()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">建立廠商</h1>
      </div>
      <StoreForm
        mode="new"
        onSubmit={(store: StoreFormData) =>
          createStore.mutateAsync(
            { data: store },
            {
              onSuccess({ name, id }) {
                toast.success(`編輯 ${name} 成功`)
                queryClient.invalidateQueries({ queryKey: ['sidebar'] })
                navigate({
                  to: '/stores/$storeId',
                  params: { storeId: id },
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
  )
}
