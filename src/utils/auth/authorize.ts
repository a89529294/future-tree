import { eq, inArray } from 'drizzle-orm'

import { db } from '@/db'
import type { staff, Store } from '@/db/schemas'
import {
  branches,
  inventory,
  machines,
  stores,
  transactions,
  // userScopes,
} from '@/db/schemas'
import { useAppSession } from '@/utils/auth/session'

import { Policies } from './policies'
import type { ResourceType, UserScope } from './rules'
import { getUserScope, hasPermission } from './rules'
import type {
  ParentIds,
  Permission,
  Role,
  ScopeEntry,
  SessionUser,
} from './types-and-constants'

// ============================================================================
// TYPES
// ============================================================================

export type { ResourceType, SessionUser, UserScope }

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class PermissionError extends Error {
  constructor(action: string) {
    super(`Permission denied: ${action}`)
    this.name = 'PermissionError'
  }
}

export class AccessError extends Error {
  constructor(resourceType: ResourceType) {
    super(`You do not have access to this ${resourceType}`)
    this.name = 'AccessError'
  }
}

export class NotFoundError extends Error {
  constructor(resourceType: ResourceType, id: string) {
    super(`${resourceType} not found: ${id}`)
    this.name = 'NotFoundError'
  }
}

// ============================================================================
// SIMPLE AUTH HELPERS
// ============================================================================

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

/**
 * Get authenticated user and their scope
 * Throws if not authenticated
 */
export async function requireAuthWithScope() {
  const user = await requireAuth()
  const scope = getUserScope(user)
  return { user, scope }
}

/**
 * Check if user has permission to perform action
 * Super admin bypasses all permission checks
 */
export function requirePermission(user: SessionUser, action: Permission): void {
  if (user.role === 'super_admin') return

  if (!hasPermission(user.permissions, action)) {
    throw new PermissionError(action)
  }
}

/**
 * Check if user has access to specific resources via scope
 * Super admin bypasses all scope checks
 */
export function requireStoreAccess(scope: UserScope, store: Store): void {
  if (!Policies.store.access(scope, store)) {
    throw new AccessError('store')
  }
}

export function requireBranchAccess(
  scope: UserScope,
  branch: typeof branches.$inferSelect,
): void {
  if (!Policies.branch.access(scope, branch)) {
    throw new AccessError('branch')
  }
}

export function requireBranchParentAccess(
  scope: UserScope,
  parentStore: Store,
): void {
  if (!Policies.branch.parentAccess(scope, parentStore)) {
    throw new AccessError('branch')
  }
}

export function requireMachineParentAccess(
  scope: UserScope,
  parentIds: ParentIds,
): void {
  if (!Policies.machine.parentAccess(scope, parentIds)) {
    throw new AccessError('machine')
  }
}

export function requireInventoryAccess(
  scope: UserScope,
  inventoryItem: typeof inventory.$inferSelect,
): void {
  if (!Policies.inventory.access(scope, inventoryItem)) {
    throw new AccessError('inventory')
  }
}

export function requireTransactionAccess(
  scope: UserScope,
  transaction: typeof transactions.$inferSelect,
): void {
  if (!Policies.transaction.access(scope, transaction)) {
    throw new AccessError('transaction')
  }
}

export function requireStaffAccess(
  scope: UserScope,
  staffMember: typeof staff.$inferSelect & {
    role: Role
    scopes: Array<ScopeEntry>
  },
): void {
  if (!Policies.staff.access(scope, staffMember)) {
    throw new AccessError('staff')
  }
}

// ============================================================================
// RESOURCE FETCHERS - Simple, no generics
// ============================================================================

export async function fetchStore(id: string) {
  const store = await db.query.stores.findFirst({
    where: eq(stores.id, id),
  })

  if (!store) {
    throw new NotFoundError('store', id)
  }

  return store
}

export async function fetchBranch(id: string) {
  const branch = await db.query.branches.findFirst({
    where: eq(branches.id, id),
  })

  if (!branch) {
    throw new NotFoundError('branch', id)
  }

  return branch
}

export async function fetchMachine(id: string) {
  const machine = await db.query.machines.findFirst({
    where: eq(machines.id, id),
  })

  if (!machine) {
    throw new NotFoundError('machine', id)
  }

  return machine
}

export async function fetchInventory(id: string) {
  const item = await db.query.inventory.findFirst({
    where: eq(inventory.id, id),
  })

  if (!item) {
    throw new NotFoundError('inventory', id)
  }

  return item
}

export async function fetchTransaction(id: string) {
  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, id),
  })

  if (!transaction) {
    throw new NotFoundError('transaction', id)
  }

  return transaction
}

export async function fetchAccessibleStores(scope: UserScope) {
  if (scope.type === 'global') {
    return await db.query.stores.findMany({
      columns: { id: true, name: true },
      orderBy: (s, { asc }) => [asc(s.name)],
    })
  }

  if (scope.type === 'store') {
    return await db.query.stores.findMany({
      where: inArray(stores.id, scope.scopes),
      columns: { id: true, name: true },
      orderBy: (s, { asc }) => [asc(s.name)],
    })
  }

  return []
}

export async function fetchAccessibleBranches(scope: UserScope) {
  if (scope.type === 'global') {
    return await db.query.branches.findMany({
      columns: { id: true, name: true, storeId: true },
      with: {
        store: {
          columns: { name: true },
        },
      },
      orderBy: (l, { asc }) => [asc(l.name)],
    })
  }

  if (scope.type === 'store') {
    return await db.query.branches.findMany({
      where: inArray(branches.storeId, scope.scopes),
      columns: { id: true, name: true, storeId: true },
      with: {
        store: {
          columns: { name: true },
        },
      },
      orderBy: (l, { asc }) => [asc(l.name)],
    })
  }

  const locationIds = scope.scopes.map((s) => s.scopeId)

  return await db.query.branches.findMany({
    where: inArray(branches.id, locationIds),
    columns: { id: true, name: true, storeId: true },
    with: {
      store: {
        columns: { name: true },
      },
    },
    orderBy: (l, { asc }) => [asc(l.name)],
  })
}

// export async function fetchStaff(id: string) {
//   const staffMember = await db.query.staff.findFirst({
//     where: eq(staff.id, id),
//     with: {
//       roleAssignments: {
//         with: { role: true },
//       },
//     },
//   })

//   if (!staffMember) {
//     throw new NotFoundError('staff', id)
//   }

//   const scopes = await db.query.userScopes.findMany({
//     where: eq(userScopes.staffId, id),
//   })

//   const role = staffMember.roleAssignments[0]?.role.name as Role

//   return {
//     ...staffMember,
//     role,
//     scopes: scopes.map((s) => ({
//       scopeId: s.scopeId,
//       storeId: s.storeId,
//     })),
//   }
// }
