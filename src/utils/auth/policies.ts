import type { UserScope } from './rules'
import { DataRules } from './rules'
import type { Role, ScopeEntry } from './types-and-constants'

// ============================================================================
// POLICY TYPES
// ============================================================================

type StaffWithScopes = {
  role: Role
  scopes: Array<ScopeEntry>
}

// ============================================================================
// STORE POLICY
// ============================================================================

export const StorePolicy = {
  /** Can access store (view/edit) if at same tier or higher */
  access: (scope: UserScope, store: { id: string }): boolean =>
    DataRules.store(scope, store.id),

  /** Can create/delete store if one tier higher (global only) */
  parentAccess: (scope: UserScope): boolean => DataRules.globalOnly(scope),
}

// ============================================================================
// BRANCH POLICY
// ============================================================================

export const BranchPolicy = {
  /** Can access branch (view/edit) if at same tier or higher */
  access: (
    scope: UserScope,
    branch: { id: string; storeId: string },
  ): boolean => DataRules.branch(scope, branch),

  /** Can create/delete branch if one tier higher (global or store) */
  parentAccess: (scope: UserScope, parentStore: { id: string }): boolean =>
    DataRules.store(scope, parentStore.id),
}

// ============================================================================
// MACHINE POLICY
// ============================================================================

export const MachinePolicy = {
  /** Can access machine (view/edit/create/delete) */
  parentAccess: (
    scope: UserScope,
    parentIds: { branchId: string; storeId: string },
  ) => DataRules.branch(scope, parentIds),
}

// ============================================================================
// INVENTORY POLICY
// ============================================================================

export const InventoryPolicy = {
  /** Can access inventory (view/edit/create/delete) */
  access: (
    scope: UserScope,
    inventory: { branchId: string; storeId: string },
  ): boolean => DataRules.inventory(scope, inventory),
}

// ============================================================================
// TRANSACTION POLICY
// ============================================================================

export const TransactionPolicy = {
  /** Can access transaction (view/edit/create/delete) */
  access: (
    scope: UserScope,
    transaction: { branchId: string; storeId: string },
  ): boolean => DataRules.transaction(scope, transaction),
}

// ============================================================================
// STAFF POLICY
// ============================================================================

export const StaffPolicy = {
  /** Can access staff (view/edit) if at same tier or higher */
  access: (scope: UserScope, target: StaffWithScopes): boolean =>
    DataRules.staff(scope, target),

  /** Can create/delete staff if one tier higher (global, store, or branch) */
  parentAccess: (scope: UserScope, target: StaffWithScopes): boolean =>
    DataRules.staff(scope, target),
}

// ============================================================================
// POLICY REGISTRY
// ============================================================================

export const Policies = {
  store: StorePolicy,
  branch: BranchPolicy,
  machine: MachinePolicy,
  inventory: InventoryPolicy,
  transaction: TransactionPolicy,
  staff: StaffPolicy,
} as const
