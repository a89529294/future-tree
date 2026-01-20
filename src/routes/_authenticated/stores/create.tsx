import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'

import { StoreForm } from '@/components/stores/store-form'
import type { StoreFormData } from '@/db/schemas'
import { useCreateStore } from '@/queries/stores'

export const Route = createFileRoute('/_authenticated/stores/create')({
  component: StoreNewComponent,
})

function StoreNewComponent() {
  const createStore = useCreateStore()
  const queryClient = useQueryClient()
  const navigate = Route.useNavigate()
  return (
    <div className="space-y-6 bg-slate-900 h-full p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">建立集團</h1>
      </div>
      <StoreForm
        mode="new"
        onSubmit={(store: StoreFormData) =>
          createStore.mutate(
            { data: store },
            {
              onSuccess({ name, storeNumber }) {
                toast.success(`建立 ${name} 成功`)
                queryClient.invalidateQueries({ queryKey: ['stores'] })
                navigate({
                  to: '/stores/$storeNumber',
                  params: { storeNumber: storeNumber },
                })
              },
              onError({ message }) {
                toast.error(`建立失敗 ${message}`)
              },
            },
          )
        }
      />
    </div>
  )
}
