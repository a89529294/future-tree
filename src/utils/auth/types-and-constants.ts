export type LoginUser = {
  email: string
  password: string
}

export type Role = 'super_admin' | 'store_admin' | 'location_admin' | 'staff'

export type SessionUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role // Label only - for display/quick reference
  permissions: Array<string> // Actual permissions from staff_permissions table
  storeAccess: Array<string> // Array of store IDs
  locationAccess: Array<string> // Array of location IDs
  isActive: boolean
}

export type SessionState = {
  user: SessionUser
}

// Complete permission list - CRUD for all resources
export const ALL_PERMISSIONS = [
  // Stores
  'stores.view',
  'stores.create',
  'stores.edit',
  'stores.delete',

  // Locations
  'locations.view',
  'locations.create',
  'locations.edit',
  'locations.delete',

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
    'locations.view',
    'locations.create',
    'locations.edit',
    'locations.delete',
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
  location_admin: [
    'stores.view',
    'locations.view',
    'locations.edit',
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
    'locations.view',
    'machines.view',
    'inventory.view',
    'inventory.edit',
    'inventory.restock',
    'transactions.view',
  ],
}
