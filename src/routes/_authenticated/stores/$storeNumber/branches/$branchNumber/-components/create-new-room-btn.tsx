import { Plus } from 'lucide-react'

import { RouterLink } from '@/components/router-link'
import { Button } from '@/components/ui/button'

export function CreateNewRoomBtn({
  storeNumber,
  branchNumber,
}: {
  storeNumber: string
  branchNumber: string
}) {
  return (
    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
      <RouterLink
        to="/stores/$storeNumber/branches/$branchNumber/rooms/create"
        params={{ storeNumber, branchNumber }}
      >
        <Plus className="mr-2 h-4 w-4" />
        建立新房間
      </RouterLink>
    </Button>
  )
}
