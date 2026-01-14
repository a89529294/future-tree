import {
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { branches, stores } from '@/db/schemas'
import {
  fetchBranch,
  requireAuthWithScope,
  requireBranchAccess,
  requireBranchParentAccess,
  requirePermission,
} from '@/utils/auth/authorize'

export type BranchFormData = {
  storeId: string
  name: string
  description: string | null
}

const branchFormSchema = {
  parse: (data: BranchFormData) => ({
    storeId: data.storeId,
    name: data.name.trim(),
    description: data.description?.trim() || null,
  }),
}

// Get branch by ID - SIMPLE AND CLEAR
const getBranch = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { user, scope } = await requireAuthWithScope()
    requirePermission(user, 'branches.view')

    const branch = await fetchBranch(id)
    requireBranchAccess(scope, branch)

    return branch
  })

// Update branch - SIMPLE AND CLEAR
const updateBranch = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; branch: BranchFormData }) => ({
    id: data.id,
    branch: branchFormSchema.parse(data.branch),
  }))
  .handler(async ({ data }) => {
    const { user, scope } = await requireAuthWithScope()
    requirePermission(user, 'branches.edit')

    const branch = await fetchBranch(data.id)
    requireBranchAccess(scope, branch)

    const [updated] = await db
      .update(branches)
      .set(data.branch)
      .where(eq(branches.id, data.id))
      .returning()

    return updated
  })

// Create branch - SIMPLE AND CLEAR
const createBranch = createServerFn({ method: 'POST' })
  .inputValidator(branchFormSchema)
  .handler(async ({ data }) => {
    const { user, scope } = await requireAuthWithScope()
    requirePermission(user, 'branches.create')

    // check if store exist
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, data.storeId),
    })
    if (!store) {
      throw new Error('Store not found')
    }

    // Check user has access to the parent store
    requireBranchParentAccess(scope, store)

    const [newBranch] = await db.insert(branches).values(data).returning()

    return newBranch
  })

export const branchQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['branches', id],
    queryFn: () => getBranch({ data: id }),
  })

export function useBranch(id: string) {
  return useSuspenseQuery(branchQueryOptions(id))
}

export function useUpdateBranch() {
  return useMutation({
    mutationFn: updateBranch,
  })
}

export function useCreateBranch() {
  return useMutation({
    mutationFn: createBranch,
  })
}
