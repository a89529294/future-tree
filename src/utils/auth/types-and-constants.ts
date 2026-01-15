export type LoginUser = {
  email: string
  password: string
}

export type Role = 'super_admin' | 'store_admin' | 'branch_admin' | 'staff'

export type SessionUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role // Label only - for display/quick reference
  scopeType: 'global' | 'store' | 'branch' // Determines access level
  permissions: Array<string> // Actual permissions from staff_permissions table
  scopes: Array<string> // Only populated for store/branch scoped users, for store scoped user they are store ids, for branch scoped users they are branch ids
  isActive: boolean
  sessionId?: string // Unique identifier for this session, used to sync with loggedInStaff table
}

export type SessionState = {
  user: SessionUser
}

export type ParentIds = {
  branchId: string
  storeId: string
}

// Complete permission list - CRUD for all resources
export const ALL_PERMISSIONS = [
  // Stores
  'stores.create',
  'stores.read',
  'stores.update',
  'stores.delete',

  // Branches
  'branches.create',
  'branches.read',
  'branches.update',
  'branches.delete',

  // Machines
  'machines.create',
  'machines.read',
  'machines.update',
  'machines.delete',

  // Inventory
  'inventory.create',
  'inventory.read',
  'inventory.update',
  'inventory.delete',
  'inventory.restock', // Special action

  // Transactions
  'transactions.create',
  'transactions.read',
  'transactions.update',
  'transactions.delete',
  'transactions.export', // Special action

  // Staff
  'staff.create',
  'staff.read',
  'staff.update',
  'staff.delete',
] as const

export type Permission = (typeof ALL_PERMISSIONS)[number]

// Role default permissions - used as templates when assigning roles
// These are copied to staff_permissions table on role assignment
export const ROLE_DEFAULT_PERMISSIONS: Record<
  Role,
  ReadonlyArray<Permission>
> = {
  super_admin: [...ALL_PERMISSIONS], // All permissions
  store_admin: [
    'stores.read',
    'stores.update',
    'branches.read',
    'branches.create',
    'branches.update',
    'branches.delete',
    'machines.read',
    'machines.create',
    'machines.update',
    'machines.delete',
    'inventory.read',
    'inventory.create',
    'inventory.update',
    'inventory.delete',
    'inventory.restock',
    'transactions.read',
    'transactions.export',
    'staff.read',
    'staff.create',
    'staff.update',
    'staff.delete',
  ],
  branch_admin: [
    'stores.read',
    'branches.read',
    'branches.update',
    'machines.read',
    'machines.create',
    'machines.update',
    'inventory.read',
    'inventory.create',
    'inventory.update',
    'inventory.restock',
    'transactions.read',
    'staff.read',
    'staff.create',
    'staff.update',
  ],
  staff: [
    'stores.read',
    'branches.read',
    'machines.read',
    'inventory.read',
    'inventory.update',
    'inventory.restock',
    'transactions.read',
  ],
}

export const expiresInSeconds = 60 * 60 * 24 * 5
export const expiresInMilliseconds = expiresInSeconds * 1000
