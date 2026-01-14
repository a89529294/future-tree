import { useSuspenseQuery } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'

import {
  fetchAccessibleBranches,
  fetchAccessibleStores,
  requireAuthWithScope,
} from '@/utils/auth/authorize'
import { hasPermission } from '@/utils/auth/rules'

export type SidebarStore = {
  id: string
  name: string
}

export type SidebarLocation = {
  id: string
  name: string
  storeId: string
  storeName: string
}

export type SidebarData = {
  stores: Array<SidebarStore>
  branches: Array<SidebarLocation>
}

const fetchSidebarData = createServerFn({ method: 'GET' }).handler(async () => {
  const { user, scope } = await requireAuthWithScope()

  let stores: Array<SidebarStore> = []
  let branches: Array<SidebarLocation> = []

  if (hasPermission(user.permissions, 'stores.view')) {
    stores = await fetchAccessibleStores(scope)
  }

  if (hasPermission(user.permissions, 'branches.view')) {
    const fetchedBranches = await fetchAccessibleBranches(scope)
    branches = fetchedBranches.map((loc) => ({
      id: loc.id,
      name: loc.name,
      storeId: loc.storeId,
      storeName: loc.store.name,
    }))
  }

  return {
    stores,
    branches,
  } satisfies SidebarData
})

export const fetchSidebarDataOptions = {
  queryKey: ['sidebar'],
  queryFn: fetchSidebarData,
}

export const useSidebarData = () => useSuspenseQuery(fetchSidebarDataOptions)
