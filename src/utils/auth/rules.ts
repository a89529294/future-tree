import type {
  Permission,
  Role,
  ScopeEntry,
  SessionUser,
} from './types-and-constants'

// ============================================================================
// TYPES
// ============================================================================

export type UserScope =
  | { type: 'global' }
  | { type: 'store'; scopes: Array<string> }
  | { type: 'branch'; scopes: Array<ScopeEntry> }

export type ResourceType =
  | 'store'
  | 'branch'
  | 'machine'
  | 'inventory'
  | 'transaction'
  | 'staff'

// Maps action strings to their resource type
export const ACTION_TO_RESOURCE = {
  'stores.view': 'store',
  'stores.create': 'store',
  'stores.edit': 'store',
  'stores.delete': 'store',
  'branches.view': 'branch',
  'branches.create': 'branch',
  'branches.edit': 'branch',
  'branches.delete': 'branch',
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
} as const satisfies Record<Permission, ResourceType>

export type Action = keyof typeof ACTION_TO_RESOURCE

// ============================================================================
// SCOPE FACTORY
// ============================================================================

export function getUserScope(user: SessionUser): UserScope {
  if (user.scopeType === 'global') {
    return { type: 'global' }
  }

  if (user.scopeType === 'store') {
    return { type: 'store', scopes: user.scopes.map((s) => s.storeId) }
  }

  return { type: 'branch', scopes: user.scopes }
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
   * Helper for actions reserved for global scope (super_admin).
   */
  globalOnly(scope: UserScope): boolean {
    return scope.type === 'global'
  },

  /**
   * Check if scope includes store.
   * Store-scoped user has array of store IDs.
   */
  store(scope: UserScope, storeId: string): boolean {
    if (scope.type === 'global') return true
    if (scope.type === 'store') return scope.scopes.includes(storeId)
    return false
  },

  /**
   * Check if scope includes branch.
   * - Store-scoped user: can access any branch in their managed stores
   * - Branch-scoped user: can only access their assigned branches
   */
  branch(
    scope: UserScope,
    branch: { branchId: string; storeId: string },
  ): boolean {
    if (scope.type === 'global') return true
    if (scope.type === 'store') return scope.scopes.includes(branch.storeId)
    return scope.scopes.some((s) => s.scopeId === branch.branchId)
  },

  /**
   * Check if scope includes machine.
   * - Store-scoped user: can access machines in their managed stores
   * - Branch-scoped user: can only access machines in their assigned branches
   */
  machine(
    scope: UserScope,
    parentIds: { branchId: string; storeId: string },
  ): boolean {
    if (scope.type === 'global') return true
    if (scope.type === 'store') return scope.scopes.includes(parentIds.storeId)
    return scope.scopes.some((s) => s.scopeId === parentIds.branchId)
  },

  /**
   * Check if scope includes inventory item.
   * - Store-scoped user: can access inventory in their managed stores
   * - Location-scoped user: can only access inventory in their assigned locations
   */
  inventory(
    scope: UserScope,
    inventory: { branchId: string; storeId: string },
  ): boolean {
    if (scope.type === 'global') return true
    if (scope.type === 'store') return scope.scopes.includes(inventory.storeId)
    return scope.scopes.some((s) => s.scopeId === inventory.branchId)
  },

  /**
   * Check if scope includes transaction.
   * - Store-scoped user: can access transactions in their managed stores
   * - Location-scoped user: can only access transactions in their assigned locations
   */
  transaction(
    scope: UserScope,
    transaction: { branchId: string; storeId: string },
  ): boolean {
    if (scope.type === 'global') return true
    if (scope.type === 'store')
      return scope.scopes.includes(transaction.storeId)
    return scope.scopes.some((s) => s.scopeId === transaction.branchId)
  },

  /**
   * Check if scope allows accessing a target staff member.
   * Rules:
   * - super_admin: can access all staff
   * - store_admin: can access all staff in their managed stores
   * - location_admin: can access all staff in their managed locations
   */
  staff(
    scope: UserScope,
    targetStaff: {
      role: Role
      scopes: Array<ScopeEntry>
    },
  ): boolean {
    if (scope.type === 'global') return true

    // Cannot access super_admin
    if (targetStaff.role === 'super_admin') return false

    // If viewer has store-level access, check if target staff has any scope in those stores
    if (scope.type === 'store') {
      const viewerStoreIds = new Set(scope.scopes)
      return targetStaff.scopes.some((s) => viewerStoreIds.has(s.storeId))
    }

    // If viewer has location-level access, check if target staff has location-level access to the same location
    const viewerLocationIds = new Set(scope.scopes.map((s) => s.scopeId))
    return targetStaff.scopes.some((s) => viewerLocationIds.has(s.scopeId))
  },
}
