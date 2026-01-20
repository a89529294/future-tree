// import type { ReactNode } from 'react'

// import {
//   useCanAccessBranch,
//   useCanAccessStore,
//   usePermission,
// } from '@/hooks/use-permission'
// import type { Permission } from '@/utils/auth/types-and-constants'

// type CanProps = {
//   action: Permission
//   storeId?: string
//   locationId?: string
//   children: ReactNode
//   fallback?: ReactNode
// }

/**
 * Declarative component to conditionally render children based on permissions.
 *
 * @example Permission only (for sidebar/nav):
 * <Can action="stores.view">
 *   <SidebarLink to="/stores">Stores</SidebarLink>
 * </Can>
 *
 * @example Permission + store access:
 * <Can action="stores.edit" storeId={store.id}>
 *   <EditStoreButton />
 * </Can>
 *
 * @example Permission + location access:
 * <Can action="locations.edit" locationId={location.id}>
 *   <EditLocationButton />
 * </Can>
 *
 * @example With fallback:
 * <Can action="staff.delete" fallback={<DisabledButton />}>
 *   <DeleteStaffButton />
 * </Can>
 */
// export function Can({
//   action,
//   storeId,
//   locationId,
//   children,
//   fallback = null,
// }: CanProps): ReactNode {
//   const hasPermission = usePermission(action)
//   const hasStoreAccess = useCanAccessStore(storeId ?? '')
//   const hasLocationAccess = useCanAccessLocation(locationId ?? '')

//   // Permission check
//   if (!hasPermission) {
//     return fallback
//   }

//   // Store access check (only if storeId provided)
//   if (storeId !== undefined && !hasStoreAccess) {
//     return fallback
//   }

//   // Location access check (only if locationId provided)
//   if (locationId !== undefined && !hasLocationAccess) {
//     return fallback
//   }

//   return children
// }
