import { useSuspenseQuery } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { inArray } from 'drizzle-orm'

import { db } from '@/db'
import { locations, stores } from '@/db/schemas'
import { requireAuth } from '@/utils/auth/authorize'

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
  locations: Array<SidebarLocation>
}

const fetchSidebarData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SidebarData> => {
    const user = await requireAuth()

    // Super admin or global access - fetch all
    if (user.role === 'super_admin') {
      const allStores = await db.query.stores.findMany({
        columns: { id: true, name: true },
        orderBy: (s, { asc }) => [asc(s.name)],
      })

      const allLocations = await db.query.locations.findMany({
        columns: { id: true, name: true, storeId: true },
        with: {
          store: {
            columns: { name: true },
          },
        },
        orderBy: (l, { asc }) => [asc(l.name)],
      })

      return {
        stores: allStores,
        locations: allLocations.map((loc) => ({
          id: loc.id,
          name: loc.name,
          storeId: loc.storeId,
          storeName: loc.store.name,
        })),
      }
    }

    // Store admin - fetch their stores and locations in those stores
    if (user.storeAccess.length > 0) {
      const userStores = await db.query.stores.findMany({
        where: inArray(stores.id, user.storeAccess),
        columns: { id: true, name: true },
        orderBy: (s, { asc }) => [asc(s.name)],
      })

      const userLocations = await db.query.locations.findMany({
        where: inArray(locations.storeId, user.storeAccess),
        columns: { id: true, name: true, storeId: true },
        with: {
          store: {
            columns: { name: true },
          },
        },
        orderBy: (l, { asc }) => [asc(l.name)],
      })

      return {
        stores: userStores,
        locations: userLocations.map((loc) => ({
          id: loc.id,
          name: loc.name,
          storeId: loc.storeId,
          storeName: loc.store.name,
        })),
      }
    }

    // Location admin/staff - fetch only their locations (no stores)
    if (user.locationAccess.length > 0) {
      const userLocations = await db.query.locations.findMany({
        where: inArray(locations.id, user.locationAccess),
        columns: { id: true, name: true, storeId: true },
        with: {
          store: {
            columns: { name: true },
          },
        },
        orderBy: (l, { asc }) => [asc(l.name)],
      })

      return {
        stores: [], // No store access
        locations: userLocations.map((loc) => ({
          id: loc.id,
          name: loc.name,
          storeId: loc.storeId,
          storeName: loc.store.name,
        })),
      }
    }

    return { stores: [], locations: [] }
  },
)

export const fetchSidebarDataOptions = {
  queryKey: ['sidebar'],
  queryFn: fetchSidebarData,
}

export const useSidebarData = () => useSuspenseQuery(fetchSidebarDataOptions)
