import type { Permission, SessionUser } from './types-and-constants'

// ============================================================================
// TYPES
// ============================================================================

export type UserScope =
  | { type: 'global' }
  | { type: 'store'; storeIds: Array<string> }
  | { type: 'location'; locationIds: Array<string> }

export type ResourceType =
  | 'store'
  | 'location'
  | 'machine'
  | 'inventory'
  | 'transaction'
  | 'staff'

// Maps action strings to their resource type
const ACTION_TO_RESOURCE: Record<Permission, ResourceType> = {
  'stores.view': 'store',
  'stores.create': 'store',
  'stores.edit': 'store',
  'stores.delete': 'store',
  'locations.view': 'location',
  'locations.create': 'location',
  'locations.edit': 'location',
  'locations.delete': 'location',
  'machines.view': 'machine',
  'machines.create': 'machine',
  'machines.edit': 'machine',
  'machines.delete': 'machine',
  'inventory.view': 'inventory',
  'inventory.create': 'inventory',
  'inventory.edit': 'inventory',
  'inventory.delete': 'inventory',
  'inventory.restock': 'inventory',
  'transactions.view': 'transaction',
  'transactions.create': 'transaction',
  'transactions.edit': 'transaction',
  'transactions.delete': 'transaction',
  'transactions.export': 'transaction',
  'staff.view': 'staff',
  'staff.create': 'staff',
  'staff.edit': 'staff',
  'staff.delete': 'staff',
}

export type Action = keyof typeof ACTION_TO_RESOURCE

// ============================================================================
// SCOPE FACTORY
// ============================================================================

export function getUserScope(user: SessionUser): UserScope {
  if (user.role === 'super_admin') {
    return { type: 'global' }
  }

  if (user.role === 'store_admin') {
    return { type: 'store', storeIds: user.storeAccess }
  }

  return { type: 'location', locationIds: user.locationAccess }
}

// ============================================================================
// ROLE ACCESS (Driver's License)
// ============================================================================

export function hasPermission(
  permissions: ReadonlyArray<string>,
  action: string,
): boolean {
  return permissions.includes(action)
}

// ============================================================================
// DATA ACCESS (Car Key) - Pure Rules, No DB
// ============================================================================

export const DataRules = {
  /**
   * Check if scope includes store
   */
  store(scope: UserScope, storeId: string): boolean {
    if (scope.type === 'global') return true
    if (scope.type === 'store') return scope.storeIds.includes(storeId)
    return false
  },

  /**
   * Check if scope includes location.
   * Requires parent storeId for hierarchy checks.
   */
  location(
    scope: UserScope,
    location: { id: string; storeId: string },
  ): boolean {
    switch (scope.type) {
      case 'global':
        return true
      case 'store':
        return scope.storeIds.includes(location.storeId)
      case 'location':
        return scope.locationIds.includes(location.id)
    }
  },

  /**
   * Check if scope includes machine.
   * Requires location info for hierarchy checks.
   */
  machine(
    scope: UserScope,
    machine: { locationId: string; storeId: string },
  ): boolean {
    switch (scope.type) {
      case 'global':
        return true
      case 'store':
        return scope.storeIds.includes(machine.storeId)
      case 'location':
        return scope.locationIds.includes(machine.locationId)
    }
  },

  /**
   * Check if scope includes inventory item.
   * Inventory is tied to machine, so same rules apply.
   */
  inventory(
    scope: UserScope,
    inventory: { machineId: string; locationId: string; storeId: string },
  ): boolean {
    return DataRules.machine(scope, {
      locationId: inventory.locationId,
      storeId: inventory.storeId,
    })
  },

  /**
   * Check if scope includes transaction.
   * Transaction is tied to machine, so same rules apply.
   */
  transaction(
    scope: UserScope,
    transaction: { machineId: string; locationId: string; storeId: string },
  ): boolean {
    return DataRules.machine(scope, {
      locationId: transaction.locationId,
      storeId: transaction.storeId,
    })
  },

  /**
   * Check if scope allows accessing a target staff member.
   * Requires target's complete access profile.
   */
  staff(
    scope: UserScope,
    targetStaff: {
      storeAccess: Array<{ storeId: string }>
      locationAccess: Array<{ locationId: string; storeId: string }>
    },
  ): boolean {
    switch (scope.type) {
      case 'global':
        return true
      case 'store':
        // Can access if target is in my store (directly or via location)
        if (
          targetStaff.storeAccess.some((s) =>
            scope.storeIds.includes(s.storeId),
          )
        ) {
          return true
        }
        return targetStaff.locationAccess.some((l) =>
          scope.storeIds.includes(l.storeId),
        )
      case 'location':
        // Can access if target is in my location
        return targetStaff.locationAccess.some((l) =>
          scope.locationIds.includes(l.locationId),
        )
    }
  },

  /**
   * Special case: Location admin viewing their parent store.
   * They can view the store if any of their locations belong to it.
   */
  storeViaLocation(
    scope: UserScope,
    storeId: string,
    userLocationStoreIds: Array<string>,
  ): boolean {
    switch (scope.type) {
      case 'global':
        return true
      case 'store':
        return scope.storeIds.includes(storeId)
      case 'location':
        return userLocationStoreIds.includes(storeId)
    }
  },
}
