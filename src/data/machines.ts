import {
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { branches, machines } from '@/db/schemas'
import type { MachineFormData } from '@/db/schemas/resources/machines'
import { machineFormSchema } from '@/db/schemas/resources/machines'
import {
  fetchMachine,
  requireAuthWithScope,
  requireMachineParentAccess,
  requirePermission,
} from '@/utils/auth/authorize'

// Get machine by ID - SIMPLE AND CLEAR
const getMachine = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { user, scope } = await requireAuthWithScope()
    requirePermission(user, 'machines.view')

    const machine = await fetchMachine(id)
    requireMachineParentAccess(scope, machine)

    return machine
  })

// Update machine - SIMPLE AND CLEAR
const updateMachine = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; machine: MachineFormData }) => ({
    id: data.id,
    machine: machineFormSchema.parse(data.machine),
  }))
  .handler(async ({ data }) => {
    const { user, scope } = await requireAuthWithScope()
    requirePermission(user, 'machines.edit')

    const machine = await fetchMachine(data.id)
    requireMachineParentAccess(scope, machine)

    const [updated] = await db
      .update(machines)
      .set(data.machine)
      .where(eq(machines.id, data.id))
      .returning()

    return updated
  })

// Create machine - SIMPLE AND CLEAR
const createMachine = createServerFn({ method: 'POST' })
  .inputValidator(machineFormSchema)
  .handler(async ({ data }) => {
    const { user, scope } = await requireAuthWithScope()
    requirePermission(user, 'machines.create')

    // check if branch exist
    const branch = await db.query.branches.findFirst({
      where: eq(branches.id, data.branchId),
    })
    if (!branch) {
      throw new Error('Branch not found')
    }

    // Check user has access to the parent branch
    requireMachineParentAccess(scope, {
      storeId: branch.storeId,
      branchId: data.branchId,
    })

    // Insert with denormalized storeId from branch
    const [newMachine] = await db
      .insert(machines)
      .values({ ...data, storeId: branch.storeId })
      .returning()

    return newMachine
  })

export const machineQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['machines', id],
    queryFn: () => getMachine({ data: id }),
  })

export function useMachine(id: string) {
  return useSuspenseQuery(machineQueryOptions(id))
}

export function useUpdateMachine() {
  return useMutation({
    mutationFn: updateMachine,
  })
}

export function useCreateMachine() {
  return useMutation({
    mutationFn: createMachine,
  })
}
