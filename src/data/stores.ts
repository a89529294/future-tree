// src/routes/api/stores.ts

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
import { sleep } from '@/utils'
import { requireAuth } from '@/utils/auth/authorize'

// Create store
const createStore = createServerFn({ method: 'POST' })
  .inputValidator(storeFormSchema)
  .handler(async ({ data }) => {
    const user = await requireAuth()

    // Only super_admin can create stores
    if (user.role !== 'super_admin') {
      throw new Error('Unauthorized: Only super admins can create stores')
    }

    const [newStore] = await db
      .insert(stores)
      .values({
        name: data.name,
        address: data.address ?? null,
        phoneNumber: data.phoneNumber ?? null,
      })
      .returning()

    return newStore
  })

// Get store by ID
const getStore = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await sleep(2000)
    const user = await requireAuth()

    // Super admin can access any store
    if (user.role === 'super_admin') {
      const [store] = await db
        .select()
        .from(stores)
        .where(eq(stores.id, id))
        .limit(1)

      return store
    }

    // Store admin can only access stores in their storeAccess
    if (user.storeAccess.length > 0 && user.storeAccess.includes(id)) {
      const [store] = await db
        .select()
        .from(stores)
        .where(eq(stores.id, id))
        .limit(1)

      return store
    }

    // Location admins/staff cannot access stores directly
    throw new Error('Unauthorized: You do not have access to this store')
  })

// Update store
const updateStore = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; store: StoreFormData }) => ({
    id: data.id,
    store: storeFormSchema.parse(data.store),
  }))
  .handler(async ({ data }) => {
    await sleep(2000)
    const user = await requireAuth()

    // Super admin can update any store
    if (user.role !== 'super_admin') {
      // Store admin can only update stores in their storeAccess
      if (!user.storeAccess.includes(data.id)) {
        throw new Error(
          'Unauthorized: You do not have permission to update this store',
        )
      }
    }

    const [updatedStore] = await db
      .update(stores)
      .set(data.store)
      .where(eq(stores.id, data.id))
      .returning()

    return updatedStore
  })

// Delete store
const deleteStore = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const user = await requireAuth()

    // Only super_admin can delete stores
    if (user.role !== 'super_admin') {
      throw new Error('Unauthorized: Only super admins can delete stores')
    }

    await db.delete(stores).where(eq(stores.id, id))
    return { success: true }
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
