// ============================================================================
// TYPES
// ============================================================================

export type SessionUser = {
id: string
email: string
firstName: string
lastName: string
role: 'super_admin' | 'store_admin' | 'location_admin' | 'staff'
storeAccess: string[]
locationAccess: string[]
isActive: boolean
}

// ============================================================================
// PRIMITIVE AUTH CHECKS (Foundation)
// ============================================================================

import { useAppSession } from '@/utils/session'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import {
stores,
locations,
machines,
inventory,
transactions,
staff,
} from '@/db/schema'

/\*\*

- Require authentication - throws if not authenticated
  \*/
  export async function requireAuth(): Promise<SessionUser> {
  const session = await useAppSession()
  const user = session.data

if (!user || !user.id) {
throw new Error('Unauthorized - Please login')
}

if (!user.isActive) {
throw new Error('Account is inactive')
}

return user
}

// ============================================================================
// ROLE-BASED PERMISSION CHECKS (No Data Access)
// ============================================================================

/\*\*

- All available permissions by role
  _/
  const ROLE_PERMISSIONS = {
  super_admin: ['_'], // All permissions
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
  'inventory.edit',
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
  'inventory.edit', // ✅ Staff can edit cell configuration!
  'inventory.restock', // ✅ Staff can mark as restocked
  'transactions.view',
  ],
  } as const

/\*\*

- Check if current user has a specific permission
  _/
  export async function hasPermission(action: string): Promise<boolean> {
  const user = await requireAuth()
  const rolePermissions = ROLE_PERMISSIONS[user.role]
  return rolePermissions.includes('_') || rolePermissions.includes(action)
  }

/\*\*

- Require specific permission - throws if user doesn't have it
  \*/
  export async function requirePermission(action: string): Promise<void> {
  const allowed = await hasPermission(action)

if (!allowed) {
throw new Error(`Permission denied: ${action}`)
}
}

// ============================================================================
// DATA-BASED ACCESS CHECKS (Resource Scope)
// ============================================================================

/\*\*

- Check if user can access a specific store
  \*/
  export async function canAccessStore(storeId: string): Promise<boolean> {
  const user = await requireAuth()

// Super admin can access everything
if (user.role === 'super_admin') {
return true
}

// Store admin: check if store is in their access list
if (user.role === 'store_admin') {
return user.storeAccess.includes(storeId)
}

// Location admin or staff: check if any of their locations belong to this store
if (user.role === 'location_admin' || user.role === 'staff') {
const userLocations = await db.query.locations.findMany({
where: (locations, { inArray, eq: eqOp }) =>
eqOp(locations.storeId, storeId) &&
inArray(locations.id, user.locationAccess),
})

    return userLocations.length > 0

}

return false
}

/\*\*

- Require store access - throws if user doesn't have access
  \*/
  export async function requireStoreAccess(storeId: string): Promise<void> {
  const allowed = await canAccessStore(storeId)

if (!allowed) {
throw new Error('You do not have access to this store')
}
}

/\*\*

- Check if user can access a specific location
  \*/
  export async function canAccessLocation(locationId: string): Promise<boolean> {
  const user = await requireAuth()

// Super admin can access everything
if (user.role === 'super_admin') {
return true
}

// Get location's store
const location = await db.query.locations.findFirst({
where: eq(locations.id, locationId),
columns: {
storeId: true,
},
})

if (!location) {
return false
}

// Store admin: check if location's store is in their access list
if (user.role === 'store_admin') {
return user.storeAccess.includes(location.storeId)
}

// Location admin or staff: check if location is in their access list
if (user.role === 'location_admin' || user.role === 'staff') {
return user.locationAccess.includes(locationId)
}

return false
}

/\*\*

- Require location access - throws if user doesn't have access
  \*/
  export async function requireLocationAccess(locationId: string): Promise<void> {
  const allowed = await canAccessLocation(locationId)

if (!allowed) {
throw new Error('You do not have access to this location')
}
}

/\*\*

- Check if user can access a specific machine
  \*/
  export async function canAccessMachine(machineId: string): Promise<boolean> {
  const user = await requireAuth()

// Super admin can access everything
if (user.role === 'super_admin') {
return true
}

// Get machine's location and store
const machine = await db.query.machines.findFirst({
where: eq(machines.id, machineId),
with: {
location: {
columns: {
id: true,
storeId: true,
},
},
},
})

if (!machine) {
return false
}

// Store admin: check if machine's store is in their access list
if (user.role === 'store_admin') {
return user.storeAccess.includes(machine.location.storeId)
}

// Location admin or staff: check if machine's location is in their access list
if (user.role === 'location_admin' || user.role === 'staff') {
return user.locationAccess.includes(machine.location.id)
}

return false
}

/\*\*

- Require machine access - throws if user doesn't have access
  \*/
  export async function requireMachineAccess(machineId: string): Promise<void> {
  const allowed = await canAccessMachine(machineId)

if (!allowed) {
throw new Error('You do not have access to this machine')
}
}

/\*\*

- Check if user can access a specific transaction
  \*/
  export async function canAccessTransaction(
  transactionId: string
  ): Promise<boolean> {
  const user = await requireAuth()

// Super admin can access everything
if (user.role === 'super_admin') {
return true
}

// Get transaction's machine
const transaction = await db.query.transactions.findFirst({
where: eq(transactions.id, transactionId),
columns: {
machineId: true,
},
})

if (!transaction) {
return false
}

// Use machine access check (transactions follow machine access)
return canAccessMachine(transaction.machineId)
}

/\*\*

- Require transaction access - throws if user doesn't have access
  \*/
  export async function requireTransactionAccess(
  transactionId: string
  ): Promise<void> {
  const allowed = await canAccessTransaction(transactionId)

if (!allowed) {
throw new Error('You do not have access to this transaction')
}
}

/\*\*

- Check if user can access a specific staff member
- Used for editing/deleting staff accounts
  \*/
  export async function canAccessStaff(targetStaffId: string): Promise<boolean> {
  const user = await requireAuth()

// Super admin can access all staff
if (user.role === 'super_admin') {
return true
}

// Get target staff's role and access
const targetStaff = await db.query.staff.findFirst({
where: eq(staff.id, targetStaffId),
with: {
roleAssignments: {
with: {
role: true,
},
},
storeAccess: {
columns: {
storeId: true,
},
},
locationAccess: {
columns: {
locationId: true,
},
},
},
})

if (!targetStaff) {
return false
}

const targetRole = targetStaff.roleAssignments[0]?.role.name

// Store admin: can only access location admins and staff in their stores
if (user.role === 'store_admin') {
// Cannot access super admins or other store admins
if (targetRole === 'super_admin' || targetRole === 'store_admin') {
return false
}

    // Check if target staff's stores overlap with user's stores
    const targetStoreIds = targetStaff.storeAccess.map((s) => s.storeId)
    const hasOverlap = targetStoreIds.some((id) => user.storeAccess.includes(id))

    if (hasOverlap) {
      return true
    }

    // Check if target staff's locations are in user's stores
    const targetLocationIds = targetStaff.locationAccess.map((l) => l.locationId)
    if (targetLocationIds.length > 0) {
      const targetLocations = await db.query.locations.findMany({
        where: (locations, { inArray }) =>
          inArray(locations.id, targetLocationIds),
        columns: {
          storeId: true,
        },
      })

      return targetLocations.some((loc) => user.storeAccess.includes(loc.storeId))
    }

    return false

}

// Location admin: can only access staff in their locations
if (user.role === 'location_admin') {
// Cannot access super admins, store admins, or other location admins
if (
targetRole === 'super_admin' ||
targetRole === 'store_admin' ||
targetRole === 'location_admin'
) {
return false
}

    // Check if target staff's locations overlap with user's locations
    const targetLocationIds = targetStaff.locationAccess.map((l) => l.locationId)
    return targetLocationIds.some((id) => user.locationAccess.includes(id))

}

// Staff cannot access other staff
return false
}

/\*\*

- Require staff access - throws if user doesn't have access
  \*/
  export async function requireStaffAccess(targetStaffId: string): Promise<void> {
  const allowed = await canAccessStaff(targetStaffId)

if (!allowed) {
throw new Error('You do not have access to this staff member')
}
}

// ============================================================================
// CONVENIENCE HELPERS (Combined Permission + Data Access)
// ============================================================================

/\*\*

- Check if user can view a store + has access to it
- Returns the store
  \*/
  export async function requireStoreView(storeId: string) {
  await requirePermission('stores.view')
  await requireStoreAccess(storeId)

const store = await db.query.stores.findFirst({
where: eq(stores.id, storeId),
})

if (!store) {
throw new Error('Store not found')
}

return store
}

/\*\*

- Check if user can edit a store + has access to it
- Returns the store
  \*/
  export async function requireStoreEdit(storeId: string) {
  await requirePermission('stores.edit')
  await requireStoreAccess(storeId)

const store = await db.query.stores.findFirst({
where: eq(stores.id, storeId),
})

if (!store) {
throw new Error('Store not found')
}

return store
}

/\*\*

- Check if user can view a location + has access to it
- Returns the location
  \*/
  export async function requireLocationView(locationId: string) {
  await requirePermission('locations.view')
  await requireLocationAccess(locationId)

const location = await db.query.locations.findFirst({
where: eq(locations.id, locationId),
})

if (!location) {
throw new Error('Location not found')
}

return location
}

/\*\*

- Check if user can edit a location + has access to it
- Returns the location
  \*/
  export async function requireLocationEdit(locationId: string) {
  await requirePermission('locations.edit')
  await requireLocationAccess(locationId)

const location = await db.query.locations.findFirst({
where: eq(locations.id, locationId),
})

if (!location) {
throw new Error('Location not found')
}

return location
}

/\*\*

- Check if user can create a location in a store
- Returns the store
  \*/
  export async function requireLocationCreate(storeId: string) {
  await requirePermission('locations.create')
  await requireStoreAccess(storeId)

const store = await db.query.stores.findFirst({
where: eq(stores.id, storeId),
})

if (!store) {
throw new Error('Store not found')
}

return store
}

/\*\*

- Check if user can delete a location + has access to it
- Returns the location
  \*/
  export async function requireLocationDelete(locationId: string) {
  await requirePermission('locations.delete')
  await requireLocationAccess(locationId)

const location = await db.query.locations.findFirst({
where: eq(locations.id, locationId),
})

if (!location) {
throw new Error('Location not found')
}

return location
}

/\*\*

- Check if user can view a machine + has access to it
- Returns the machine with location and store
  \*/
  export async function requireMachineView(machineId: string) {
  await requirePermission('machines.view')
  await requireMachineAccess(machineId)

const machine = await db.query.machines.findFirst({
where: eq(machines.id, machineId),
with: {
location: {
with: {
store: true,
},
},
},
})

if (!machine) {
throw new Error('Machine not found')
}

return machine
}

/\*\*

- Check if user can edit a machine + has access to it
- Returns the machine
  \*/
  export async function requireMachineEdit(machineId: string) {
  await requirePermission('machines.edit')
  await requireMachineAccess(machineId)

const machine = await db.query.machines.findFirst({
where: eq(machines.id, machineId),
})

if (!machine) {
throw new Error('Machine not found')
}

return machine
}

/\*\*

- Check if user can create a machine in a location
- Returns the location
  \*/
  export async function requireMachineCreate(locationId: string) {
  await requirePermission('machines.create')
  await requireLocationAccess(locationId)

const location = await db.query.locations.findFirst({
where: eq(locations.id, locationId),
})

if (!location) {
throw new Error('Location not found')
}

return location
}

/\*\*

- Check if user can delete a machine + has access to it
- Returns the machine
  \*/
  export async function requireMachineDelete(machineId: string) {
  await requirePermission('machines.delete')
  await requireMachineAccess(machineId)

const machine = await db.query.machines.findFirst({
where: eq(machines.id, machineId),
})

if (!machine) {
throw new Error('Machine not found')
}

return machine
}

/\*\*

- Check if user can view inventory + has machine access
- Returns the inventory item with machine info
  \*/
  export async function requireInventoryView(inventoryId: string) {
  await requirePermission('inventory.view')

const item = await db.query.inventory.findFirst({
where: eq(inventory.id, inventoryId),
with: {
machine: true,
},
})

if (!item) {
throw new Error('Inventory item not found')
}

await requireMachineAccess(item.machineId)

return item
}

/\*\*

- Check if user can edit inventory + has machine access
- Returns the inventory item
  \*/
  export async function requireInventoryEdit(inventoryId: string) {
  await requirePermission('inventory.edit')

const item = await db.query.inventory.findFirst({
where: eq(inventory.id, inventoryId),
})

if (!item) {
throw new Error('Inventory item not found')
}

await requireMachineAccess(item.machineId)

return item
}

/\*\*

- Check if user can restock + has machine access
- Staff can do this, but not edit config
- Returns the inventory item
  \*/
  export async function requireInventoryRestock(inventoryId: string) {
  await requirePermission('inventory.restock')

const item = await db.query.inventory.findFirst({
where: eq(inventory.id, inventoryId),
})

if (!item) {
throw new Error('Inventory item not found')
}

await requireMachineAccess(item.machineId)

return item
}

/\*\*

- Check if user can view transaction + has machine access
- Returns the transaction with items and machine info
  \*/
  export async function requireTransactionView(transactionId: string) {
  await requirePermission('transactions.view')

const transaction = await db.query.transactions.findFirst({
where: eq(transactions.id, transactionId),
with: {
items: true,
machine: {
with: {
location: {
with: {
store: true,
},
},
},
},
},
})

if (!transaction) {
throw new Error('Transaction not found')
}

await requireMachineAccess(transaction.machineId)

return transaction
}

/\*\*

- Check if user can view a staff member + has access
- Returns the staff member with role and access info
  \*/
  export async function requireStaffView(targetStaffId: string) {
  await requirePermission('staff.view')
  await requireStaffAccess(targetStaffId)

const staffMember = await db.query.staff.findFirst({
where: eq(staff.id, targetStaffId),
with: {
roleAssignments: {
with: {
role: true,
},
},
storeAccess: true,
locationAccess: true,
},
})

if (!staffMember) {
throw new Error('Staff member not found')
}

return staffMember
}

/\*\*

- Check if user can edit a staff member + has access
- Returns the staff member
  \*/
  export async function requireStaffEdit(targetStaffId: string) {
  await requirePermission('staff.edit')
  await requireStaffAccess(targetStaffId)

const staffMember = await db.query.staff.findFirst({
where: eq(staff.id, targetStaffId),
})

if (!staffMember) {
throw new Error('Staff member not found')
}

return staffMember
}

/\*\*

- Check if user can delete a staff member + has access
- Returns the staff member
  \*/
  export async function requireStaffDelete(targetStaffId: string) {
  await requirePermission('staff.delete')
  await requireStaffAccess(targetStaffId)

const staffMember = await db.query.staff.findFirst({
where: eq(staff.id, targetStaffId),
})

if (!staffMember) {
throw new Error('Staff member not found')
}

return staffMember
}

// ============================================================================
// FRONTEND UTILITY FUNCTIONS (Client-side role checks)
// ============================================================================

/\*\*

- Check if role can perform an action (no async, for UI logic)
  _/
  export function roleHasPermission(
  role: SessionUser['role'],
  action: string
  ): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role]
  return rolePermissions.includes('_') || rolePermissions.includes(action)
  }

// Specific permission checks for UI
export function canViewStores(role: SessionUser['role']) {
return roleHasPermission(role, 'stores.view')
}

export function canEditStores(role: SessionUser['role']) {
return roleHasPermission(role, 'stores.edit')
}

export function canCreateLocations(role: SessionUser['role']) {
return roleHasPermission(role, 'locations.create')
}

export function canEditLocations(role: SessionUser['role']) {
return roleHasPermission(role, 'locations.edit')
}

export function canDeleteLocations(role: SessionUser['role']) {
return roleHasPermission(role, 'locations.delete')
}

export function canCreateMachines(role: SessionUser['role']) {
return roleHasPermission(role, 'machines.create')
}

export function canEditMachines(role: SessionUser['role']) {
return roleHasPermission(role, 'machines.edit')
}

export function canDeleteMachines(role: SessionUser['role']) {
return roleHasPermission(role, 'machines.delete')
}

export function canEditInventory(role: SessionUser['role']) {
return roleHasPermission(role, 'inventory.edit')
}

export function canRestockInventory(role: SessionUser['role']) {
return roleHasPermission(role, 'inventory.restock')
}

export function canViewTransactions(role: SessionUser['role']) {
return roleHasPermission(role, 'transactions.view')
}

export function canExportTransactions(role: SessionUser['role']) {
return roleHasPermission(role, 'transactions.export')
}

export function canCreateStaff(role: SessionUser['role']) {
return roleHasPermission(role, 'staff.create')
}

export function canEditStaff(role: SessionUser['role']) {
return roleHasPermission(role, 'staff.edit')
}

export function canDeleteStaff(role: SessionUser['role']) {
return roleHasPermission(role, 'staff.delete')
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/\*
// Example 1: Update inventory (server function)
export const updateInventoryFn = createServerFn({ method: 'POST' })
.inputValidator(...)
.handler(async ({ data }) => {
await requireAuth()

    // One line - does all checks + returns item
    const item = await requireInventoryEdit(data.inventoryId)

    // Update
    await db.update(inventory).set({ ... })

})

// Example 2: Restock inventory (staff can do this)
export const restockInventoryFn = createServerFn({ method: 'POST' })
.inputValidator(...)
.handler(async ({ data }) => {
await requireAuth()

    // Staff can restock but not edit
    const item = await requireInventoryRestock(data.inventoryId)

    await db.update(inventory).set({
      stockAvailable: true,
      lastRestocked: new Date(),
    })

})

// Example 3: Create location (must be in accessible store)
export const createLocationFn = createServerFn({ method: 'POST' })
.inputValidator(...)
.handler(async ({ data }) => {
await requireAuth()

    // Check permission + store access
    const store = await requireLocationCreate(data.storeId)

    // Create location
    await db.insert(locations).values({ ... })

})

// Example 4: UI conditional rendering
function InventoryCell({ cell }) {
const user = useCurrentUser()

return (
<div>
<p>{cell.productName}</p>

      {canEditInventory(user.role) && (
        <button>Edit Config</button>
      )}

      {canRestockInventory(user.role) && (
        <button>Mark as Restocked</button>
      )}
    </div>

)
}
\*/
