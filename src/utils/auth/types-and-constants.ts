export type LoginUser = {
  email: string
  password: string
}

export type Role = 'super_admin' | 'store_admin' | 'branch_admin' | 'staff'

export type ScopeEntry = {
  scopeId: string
  storeId: string
}

export type SessionUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role // Label only - for display/quick reference
  scopeType: 'global' | 'store' | 'branch' // Determines access level
  permissions: Array<string> // Actual permissions from staff_permissions table
  scopes: Array<ScopeEntry>
  // scopes: Array<string> // Only populated for store/branch scoped users, for store scoped user they are store ids, for branch scoped users they are branch ids
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
  'stores.view',
  'stores.create',
  'stores.edit',
  'stores.delete',

  // Branches
  'branches.view',
  'branches.create',
  'branches.edit',
  'branches.delete',

  // Machines
  'machines.view',
  'machines.create',
  'machines.edit',
  'machines.delete',

  // Inventory
  'inventory.view',
  'inventory.create',
  'inventory.edit',
  'inventory.delete',
  'inventory.restock', // Special action

  // Transactions
  'transactions.view',
  'transactions.create',
  'transactions.edit',
  'transactions.delete',
  'transactions.export', // Special action

  // Staff
  'staff.view',
  'staff.create',
  'staff.edit',
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
    'stores.view',
    'stores.edit',
    'branches.view',
    'branches.create',
    'branches.edit',
    'branches.delete',
    'machines.view',
    'machines.create',
    'machines.edit',
    'machines.delete',
    'inventory.view',
    'inventory.create',
    'inventory.edit',
    'inventory.delete',
    'inventory.restock',
    'transactions.view',
    'transactions.export',
    'staff.view',
    'staff.create',
    'staff.edit',
    'staff.delete',
  ],
  branch_admin: [
    'stores.view',
    'branches.view',
    'branches.edit',
    'machines.view',
    'machines.create',
    'machines.edit',
    'inventory.view',
    'inventory.create',
    'inventory.edit',
    'inventory.restock',
    'transactions.view',
    'staff.view',
    'staff.create',
    'staff.edit',
  ],
  staff: [
    'stores.view',
    'branches.view',
    'machines.view',
    'inventory.view',
    'inventory.edit',
    'inventory.restock',
    'transactions.view',
  ],
}

export const expiresInSeconds = 60 * 60 * 24 * 5
export const expiresInMilliseconds = expiresInSeconds * 1000
