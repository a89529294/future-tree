import { createFileRoute } from '@tanstack/react-router'
import { useDeferredValue } from 'react'
import { z } from 'zod'

import { PendingComponent } from '@/components/pending-component'
import { ResourceErrorComponent } from '@/components/resource-error-component'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useBranch } from '@/queries/branches'

import { BranchForm } from '../-components/branch-form'
import { RoomList } from './-components/room-list'

const branchDetailSearchSchema = z.object({
  tab: z.enum(['info', 'rooms']).catch('info'),
})

export const Route = createFileRoute(
  '/_authenticated/stores/$storeNumber/branches/$branchNumber/',
)({
  component: BranchDetailComponent,
  pendingComponent: PendingComponent,
  errorComponent: ResourceErrorComponent,
  validateSearch: branchDetailSearchSchema,
})

function BranchDetailComponent() {
  const { storeNumber, branchNumber } = Route.useParams()
  const deferredBranchNumber = useDeferredValue(branchNumber)
  const { data: branch } = useBranch(deferredBranchNumber)
  const { tab } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <div className="space-y-6 bg-slate-900 h-full p-4">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          檢視店家
        </h1>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) =>
          navigate({
            search: (prev) => ({ ...prev, tab: value as 'info' | 'rooms' }),
          })
        }
        className="w-full"
      >
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger
            value="info"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100"
          >
            店家資訊
          </TabsTrigger>
          <TabsTrigger
            value="rooms"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100"
          >
            房間
          </TabsTrigger>
        </TabsList>

        <div
          className={cn(
            'mt-6',
            branchNumber !== deferredBranchNumber
              ? 'opacity-50 transition-opacity delay-100'
              : '',
          )}
        >
          <TabsContent value="info">
            <BranchForm
              // key={branch.id}
              initialData={branch}
              mode={'view'}
              storeNumber={storeNumber}
              branchNumber={branchNumber}
            />
          </TabsContent>
          <TabsContent value="rooms">
            <RoomList />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
