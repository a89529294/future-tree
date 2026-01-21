import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { PendingComponent } from '@/components/pending-component'
import { ResourceErrorComponent } from '@/components/resource-error-component'
import { RoomForm } from '@/routes/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/-components/room-form'

export const Route = createFileRoute(
  '/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/create',
)({
  component: RoomNewComponent,
  pendingComponent: PendingComponent,
  errorComponent: ResourceErrorComponent,
})

function RoomNewComponent() {
  const { storeNumber, branchNumber } = Route.useParams()
  const navigate = useNavigate()

  return (
    <div className="space-y-6 bg-slate-900 h-full p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          建立房間
        </h1>
      </div>

      <RoomForm
        mode="new"
        storeNumber={storeNumber}
        branchNumber={branchNumber}
        onSubmit={(data) => {
          console.log('Create room:', data)
          // Dummy navigation back to rooms tab
          navigate({
            to: '/stores/$storeNumber/branches/$branchNumber',
            params: { storeNumber, branchNumber },
            search: { tab: 'rooms' },
          })
        }}
      />
    </div>
  )
}
