import { useSuspenseQuery } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'

import { readBranches } from '@/data/branches'
import { readStores } from '@/data/stores'

export type SidebarStore = {
  id: string
  name: string
}

export type SidebarBranch = {
  id: string
  name: string
  storeId: string
  storeName: string
}

export type SidebarData = {
  stores: Array<SidebarStore>
  branches: Array<SidebarBranch>
}

const fetchSidebarData = createServerFn({ method: 'GET' }).handler(async () => {
  let stores: Array<SidebarStore> = []
  let branches: Array<SidebarBranch> = []

  const fetchedStores = await readStores()
  stores = fetchedStores.map((s: { id: string; name: string }) => ({
    id: s.id,
    name: s.name,
  }))

  const fetchedBranches = await readBranches()

  branches = fetchedBranches.map((b) => ({
    id: b.id,
    name: b.name,
    storeId: b.storeId,
    storeName: b.store.name,
  }))

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
