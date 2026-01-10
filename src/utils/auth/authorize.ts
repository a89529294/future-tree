import { and, eq, inArray } from 'drizzle-orm'

import { db } from '@/db'
import type { transactionItems } from '@/db/schemas'
import {
  inventory,
  locations,
  machines,
  staff,
  stores,
  transactions,
} from '@/db/schemas'

import type { UserScope } from './rules'
import { DataRules, getUserScope, hasPermission } from './rules'
import { useAppSession } from './session'
import type { SessionUser } from './types-and-constants'

// TYPES

type StoreData = typeof stores.$inferSelect
type LocationData = typeof locations.$inferSelect & {
  store?: typeof stores.$inferSelect
}
type MachineData = typeof machines.$inferSelect & {
  location: typeof locations.$inferSelect & {
    store: typeof stores.$inferSelect
  }
}
type InventoryData = typeof inventory.$inferSelect & {
  machine: typeof machines.$inferSelect & {
    location: typeof locations.$inferSelect & {
      store: typeof stores.$inferSelect
    }
  }
}
type TransactionData = typeof transactions.$inferSelect & {
  items: Array<typeof transactionItems.$inferSelect>
  machine: typeof machines.$inferSelect & {
    location: typeof locations.$inferSelect & {
      store: typeof stores.$inferSelect
    }
  }
}
type StaffData = typeof staff.$inferSelect & {
  roleAssignments: Array<{
    role: { id: string; name: string; description: string | null }
  }>
  storeAccess: Array<{ storeId: string }>
  locationAccess: Array<{ locationId: string }>
}

// AUTH HELPERS

export async function requireAuth(): Promise<SessionUser> {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- useAppSession is a TanStack Start server function, not a React hook
  const session = await useAppSession()
  const user = session.data.user

  if (!user) {
    throw new Error('Unauthorized - Please login')
  }

  if (!user.isActive) {
    throw new Error('Account is inactive')
  }

  return user
}

// ============================================================================
// STORE AUTHORIZATION
// ============================================================================

export async function authorizeStore(
  action: 'stores.view' | 'stores.edit',
  storeId: string,
): Promise<StoreData> {
  const user = await requireAuth()

  if (!hasPermission(user.permissions, action)) {
    throw new Error(`Permission denied: ${action}`)
  }

  const store = await db.query.stores.findFirst({
    where: eq(stores.id, storeId),
  })

  if (!store) {
    throw new Error('Store not found')
  }

  const scope = getUserScope(user)

  // Special handling: location admins can view stores they have locations in
  if (action === 'stores.view' && scope.type === 'location') {
    const userLocations = await db.query.locations.findMany({
      where: and(
        eq(locations.storeId, storeId),
        inArray(locations.id, scope.locationIds),
      ),
      columns: { id: true },
    })
    if (userLocations.length === 0) {
      throw new Error('You do not have access to this store')
    }
  } else if (!DataRules.store(scope, storeId)) {
    throw new Error('You do not have access to this store')
  }

  return store
}

// ============================================================================
// LOCATION AUTHORIZATION
// ============================================================================

export async function authorizeLocation(
  action: 'locations.view' | 'locations.edit' | 'locations.delete',
  locationId: string,
): Promise<LocationData> {
  const user = await requireAuth()

  if (!hasPermission(user.permissions, action)) {
    throw new Error(`Permission denied: ${action}`)
  }

  const location = await db.query.locations.findFirst({
    where: eq(locations.id, locationId),
    with: { store: true },
  })

  if (!location) {
    throw new Error('Location not found')
  }

  const scope = getUserScope(user)
  if (
    !DataRules.location(scope, { id: location.id, storeId: location.storeId })
  ) {
    throw new Error('You do not have access to this location')
  }

  return location
}

export async function authorizeLocationCreate(
  storeId: string,
): Promise<StoreData> {
  const user = await requireAuth()

  if (!hasPermission(user.permissions, 'locations.create')) {
    throw new Error('Permission denied: locations.create')
  }

  const store = await db.query.stores.findFirst({
    where: eq(stores.id, storeId),
  })

  if (!store) {
    throw new Error('Store not found')
  }

  const scope = getUserScope(user)
  if (!DataRules.store(scope, storeId)) {
    throw new Error('You do not have access to the target store')
  }

  return store
}

// ============================================================================
// MACHINE AUTHORIZATION
// ============================================================================

export async function authorizeMachine(
  action: 'machines.view' | 'machines.edit' | 'machines.delete',
  machineId: string,
): Promise<MachineData> {
  const user = await requireAuth()

  if (!hasPermission(user.permissions, action)) {
    throw new Error(`Permission denied: ${action}`)
  }

  const machine = await db.query.machines.findFirst({
    where: eq(machines.id, machineId),
    with: {
      location: {
        with: { store: true },
      },
    },
  })

  if (!machine) {
    throw new Error('Machine not found')
  }

  const scope = getUserScope(user)
  if (
    !DataRules.machine(scope, {
      locationId: machine.location.id,
      storeId: machine.location.storeId,
    })
  ) {
    throw new Error('You do not have access to this machine')
  }

  return machine
}

export async function authorizeMachineCreate(
  locationId: string,
): Promise<LocationData> {
  const user = await requireAuth()

  if (!hasPermission(user.permissions, 'machines.create')) {
    throw new Error('Permission denied: machines.create')
  }

  const location = await db.query.locations.findFirst({
    where: eq(locations.id, locationId),
  })

  if (!location) {
    throw new Error('Location not found')
  }

  const scope = getUserScope(user)
  if (
    !DataRules.location(scope, { id: location.id, storeId: location.storeId })
  ) {
    throw new Error('You do not have access to the target location')
  }

  return location
}

// ============================================================================
// INVENTORY AUTHORIZATION
// ============================================================================

export async function authorizeInventory(
  action: 'inventory.view' | 'inventory.edit' | 'inventory.restock',
  inventoryId: string,
): Promise<InventoryData> {
  const user = await requireAuth()

  if (!hasPermission(user.permissions, action)) {
    throw new Error(`Permission denied: ${action}`)
  }

  const item = await db.query.inventory.findFirst({
    where: eq(inventory.id, inventoryId),
    with: {
      machine: {
        with: {
          location: {
            with: { store: true },
          },
        },
      },
    },
  })

  if (!item) {
    throw new Error('Inventory item not found')
  }

  const scope = getUserScope(user)
  if (
    !DataRules.machine(scope, {
      locationId: item.machine.location.id,
      storeId: item.machine.location.storeId,
    })
  ) {
    throw new Error('You do not have access to this inventory item')
  }

  return item
}

// ============================================================================
// TRANSACTION AUTHORIZATION
// ============================================================================

export async function authorizeTransaction(
  action: 'transactions.view' | 'transactions.export',
  transactionId: string,
): Promise<TransactionData> {
  const user = await requireAuth()

  if (!hasPermission(user.permissions, action)) {
    throw new Error(`Permission denied: ${action}`)
  }

  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, transactionId),
    with: {
      items: true,
      machine: {
        with: {
          location: {
            with: { store: true },
          },
        },
      },
    },
  })

  if (!transaction) {
    throw new Error('Transaction not found')
  }

  const scope = getUserScope(user)
  if (
    !DataRules.machine(scope, {
      locationId: transaction.machine.location.id,
      storeId: transaction.machine.location.storeId,
    })
  ) {
    throw new Error('You do not have access to this transaction')
  }

  return transaction
}

// ============================================================================
// STAFF AUTHORIZATION
// ============================================================================

export async function authorizeStaff(
  action: 'staff.view' | 'staff.edit' | 'staff.delete',
  targetStaffId: string,
): Promise<StaffData> {
  const user = await requireAuth()

  if (!hasPermission(user.permissions, action)) {
    throw new Error(`Permission denied: ${action}`)
  }

  const targetStaff = await db.query.staff.findFirst({
    where: eq(staff.id, targetStaffId),
    with: {
      roleAssignments: {
        with: { role: true },
      },
      storeAccess: true,
      locationAccess: true,
    },
  })

  if (!targetStaff) {
    throw new Error('Staff member not found')
  }

  const scope = getUserScope(user)
  const canAccess = await canAccessStaff(scope, targetStaffId)

  if (!canAccess) {
    throw new Error('You do not have access to this staff member')
  }

  return targetStaff
}

// Helper to check staff access (needs DB for location → store mapping)
async function canAccessStaff(
  scope: UserScope,
  targetStaffId: string,
): Promise<boolean> {
  if (scope.type === 'global') return true

  const targetStaff = await db.query.staff.findFirst({
    where: eq(staff.id, targetStaffId),
    with: {
      storeAccess: { columns: { storeId: true } },
      locationAccess: {
        with: {
          location: { columns: { id: true, storeId: true } },
        },
      },
    },
  })

  if (!targetStaff) return false

  const formattedStaff = {
    storeAccess: targetStaff.storeAccess,
    locationAccess: targetStaff.locationAccess.map((la) => ({
      locationId: la.location.id,
      storeId: la.location.storeId,
    })),
  }

  return DataRules.staff(scope, formattedStaff)
}
