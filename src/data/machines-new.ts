import { createServerFn } from '@tanstack/react-start'

import { machineFormSchema } from '@/db/schemas/resources/machines'
import { requireAuth } from '@/utils/auth/authorize'

const createMachine = createServerFn({ method: 'POST' })
  .inputValidator(machineFormSchema)
  .handler(async ({ data }) => {
    const user = await requireAuth()
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
