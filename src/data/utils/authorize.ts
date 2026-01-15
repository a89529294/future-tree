import type { Store } from '@/db/schemas'
import type { Branch } from '@/db/schemas/resources/branches'
import { useAppSession } from '@/utils/auth/session'
import type { Permission, SessionUser } from '@/utils/auth/types-and-constants'

type ResourceType =
  | 'global'
  | 'store'
  | 'branch'
  | 'machine'
  | 'inventory'
  | 'transaction'
  | 'staff'

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

export function canAccessGlobal(user: SessionUser): boolean {
  return user.scopeType === 'global'
}

export function canAccessStore(user: SessionUser, store: Store): boolean {
  if (user.scopeType === 'global') {
    return true
  }

  if (user.scopeType === 'store') {
    return user.scopes.includes(store.id)
  }

  return false
}

export function canAccessBranch(user: SessionUser, branch: Branch): boolean {
  if (user.scopeType === 'global') {
    return true
  }

  if (user.scopeType === 'store') {
    return user.scopes.includes(branch.storeId)
  }

  return user.scopes.includes(branch.id)
}

export function requireAccessGlobal(user: SessionUser) {
  const hasAccess = canAccessGlobal(user)
  if (!hasAccess) throw new AccessError('global')
}

export function requireAccessStore(user: SessionUser, store: Store) {
  const hasAccess = canAccessStore(user, store)
  if (!hasAccess) throw new AccessError('store')
}

export function requireAccessBranch(user: SessionUser, branch: Branch) {
  const hasAccess = canAccessBranch(user, branch)
  if (!hasAccess) throw new AccessError('branch')
}

export function requirePermission(user: SessionUser, permission: Permission) {
  const hasPermission = user.permissions.includes(permission)

  if (!hasPermission) throw new PermissionError(permission)
}
