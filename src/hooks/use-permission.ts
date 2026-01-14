import type { Permission } from '@/utils/auth/types-and-constants'

import { useRequiredAuth } from './use-auth'

// PERMISSION CHECKS (Driver's License - can user do this action?)

/**
 * Check if user has a specific permission.
 * @example
 * const canViewStores = usePermission('stores.view')
 * {canViewStores && <SidebarLink to="/stores" />}
 */
export function usePermission(action: Permission): boolean {
  const user = useRequiredAuth()
  return user.permissions.includes(action)
}

/**
 * Check if user has ALL specified permissions.
 * @example
 * const canManageStaff = usePermissions(['staff.view', 'staff.edit'])
 */
export function usePermissions(actions: Array<Permission>): boolean {
  const user = useRequiredAuth()
  return actions.every((action) => user.permissions.includes(action))
}

/**
 * Check if user has ANY of the specified permissions.
 * @example
 * const canDoAnything = useAnyPermission(['stores.view', 'branches.view'])
 */
export function useAnyPermission(actions: Array<Permission>): boolean {
  const user = useRequiredAuth()
  return actions.some((action) => user.permissions.includes(action))
}

// DATA ACCESS CHECKS (Car Key - can user access this specific resource?)

/**
 * Check if user can access a specific store.
 * User has access if any of their scopes share the same storeId.
 * @example
 * const canAccessStore = useCanAccessStore(storeId)
 * {canAccessStore && <StoreDetails store={store} />}
 */
export function useCanAccessStore(storeId: string): boolean {
  const user = useRequiredAuth()
  return user.scopes.some((s) => s.storeId === storeId)
}

/**
 * Check if user can access a specific branch.
 * User has access if any of their scopes share the same storeId.
 * @example
 * const canAccessBranch = useCanAccessBranch(branchId)
 * {canAccessBranch && <BranchDetails branch={branch} />}
 */
export function useCanAccessBranch(branchId: string): boolean {
  const user = useRequiredAuth()
  // Store-scoped users have access to all branches in their stores
  // Branch-scoped users only have access to their assigned branches
  if (user.scopeType === 'store') {
    return true
  }
  return user.scopes.some((s) => s.scopeId === branchId)
}

// COMBINED CHECKS (Permission + Data Access)

/**
 * Check if user can perform action on a specific store.
 * Combines permission check + data access check.
 * @example
 * const canEditStore = useCanDoOnStore('stores.edit', storeId)
 * {canEditStore && <EditStoreButton />}
 */
export function useCanDoOnStore(action: Permission, storeId: string): boolean {
  const user = useRequiredAuth()
  return (
    user.permissions.includes(action) &&
    user.scopes.some((s) => s.storeId === storeId)
  )
}

/**
 * Check if user can perform action on a specific branch.
 * Combines permission check + data access check.
 * @example
 * const canEditBranch = useCanDoOnBranch('branches.edit', branchId)
 * {canEditBranch && <EditBranchButton />}
 */
export function useCanDoOnBranch(
  action: Permission,
  branchId: string,
): boolean {
  const user = useRequiredAuth()
  // Store-scoped users have access to all branches in their stores
  // Branch-scoped users only have access to their assigned branches
  if (user.scopeType === 'store') {
    return user.permissions.includes(action)
  }
  return (
    user.permissions.includes(action) &&
    user.scopes.some((s) => s.scopeId === branchId)
  )
}
