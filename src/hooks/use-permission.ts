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
 * const canDoAnything = useAnyPermission(['stores.view', 'locations.view'])
 */
export function useAnyPermission(actions: Array<Permission>): boolean {
  const user = useRequiredAuth()
  return actions.some((action) => user.permissions.includes(action))
}

// DATA ACCESS CHECKS (Car Key - can user access this specific resource?)

/**
 * Check if user can access a specific store.
 * @example
 * const canAccessStore = useCanAccessStore(storeId)
 * {canAccessStore && <StoreDetails store={store} />}
 */
export function useCanAccessStore(storeId: string): boolean {
  const user = useRequiredAuth()
  return user.storeAccess.includes(storeId)
}

/**
 * Check if user can access a specific location.
 * @example
 * const canAccessLocation = useCanAccessLocation(locationId)
 * {canAccessLocation && <LocationDetails location={location} />}
 */
export function useCanAccessLocation(locationId: string): boolean {
  const user = useRequiredAuth()
  return user.locationAccess.includes(locationId)
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
  return user.permissions.includes(action) && user.storeAccess.includes(storeId)
}

/**
 * Check if user can perform action on a specific location.
 * Combines permission check + data access check.
 * @example
 * const canEditLocation = useCanDoOnLocation('locations.edit', locationId)
 * {canEditLocation && <EditLocationButton />}
 */
export function useCanDoOnLocation(
  action: Permission,
  locationId: string,
): boolean {
  const user = useRequiredAuth()
  return (
    user.permissions.includes(action) &&
    user.locationAccess.includes(locationId)
  )
}
