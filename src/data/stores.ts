import {
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import type { StoreFormData } from '@/db/schemas'
import { storeFormSchema, stores } from '@/db/schemas'
import {
  fetchStore,
  requireAuthWithScope,
  requirePermission,
  requireStoreAccess,
} from '@/utils/auth/authorize'

// Get store by ID - SIMPLE AND CLEAR
const getStore = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { user, scope } = await requireAuthWithScope()
    requirePermission(user, 'stores.view')

    const store = await fetchStore(id)
    requireStoreAccess(scope, store)

    return store
  })

// Update store - SIMPLE AND CLEAR
const updateStore = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; store: StoreFormData }) => ({
    id: data.id,
    store: storeFormSchema.parse(data.store),
  }))
  .handler(async ({ data }) => {
    const { user, scope } = await requireAuthWithScope()
    requirePermission(user, 'stores.edit')

    const store = await fetchStore(data.id)
    requireStoreAccess(scope, store)

    const [updated] = await db
      .update(stores)
      .set(data.store)
      .where(eq(stores.id, data.id))
      .returning()

    return updated
  })

// Create store - SIMPLE AND CLEAR
const createStore = createServerFn({ method: 'POST' })
  .inputValidator(storeFormSchema)
  .handler(async ({ data }) => {
    const { user } = await requireAuthWithScope()
    requirePermission(user, 'stores.create')
    // No resource check needed for create

    const [newStore] = await db.insert(stores).values(data).returning()

    return newStore
  })

export const storeQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['stores', id],
    queryFn: () => getStore({ data: id }),
  })

export function useStore(id: string) {
  return useSuspenseQuery(storeQueryOptions(id))
}

export function useUpdateStore() {
  return useMutation({
    mutationFn: updateStore,
  })
}

export function useCreateStore() {
  return useMutation({
    mutationFn: createStore,
  })
}
