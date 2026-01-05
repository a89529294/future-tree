# V1 RBAC Permission Matrix

## Role Hierarchy

```
Super Admin (全域管理員)
    ↓ manages all
Store Admin (店舖管理員)
    ↓ manages assigned stores
Location Admin (地點管理員)
    ↓ manages assigned locations
Staff (員工)
    ↓ view + restock only
```

---

## Data Access Scope

| Role               | Stores                 | Locations                        | Machines                        |
| ------------------ | ---------------------- | -------------------------------- | ------------------------------- |
| **Super Admin**    | All                    | All                              | All                             |
| **Store Admin**    | Assigned stores only   | All locations in assigned stores | All machines in assigned stores |
| **Location Admin** | N/A (read-only parent) | Assigned locations only          | Machines in assigned locations  |
| **Staff**          | N/A (read-only parent) | Assigned locations only          | Machines in assigned locations  |

---

## Feature Permissions

### 🏪 Store Management

| Action       | Super Admin |  Store Admin  | Location Admin |     Staff      |
| ------------ | :---------: | :-----------: | :------------: | :------------: |
| View stores  |   ✅ All    |  ✅ Assigned  | ✅ Parent only | ✅ Parent only |
| Create store |     ✅      |      ❌       |       ❌       |       ❌       |
| Edit store   |     ✅      | ✅ Own stores |       ❌       |       ❌       |
| Delete store |     ✅      |      ❌       |       ❌       |       ❌       |

### 📍 Location Management

| Action          | Super Admin |      Store Admin      | Location Admin |    Staff    |
| --------------- | :---------: | :-------------------: | :------------: | :---------: |
| View locations  |   ✅ All    | ✅ In assigned stores |  ✅ Assigned   | ✅ Assigned |
| Create location |     ✅      | ✅ In assigned stores |       ❌       |     ❌      |
| Edit location   |     ✅      | ✅ In assigned stores |  ✅ Assigned   |     ❌      |
| Delete location |     ✅      | ✅ In assigned stores |       ❌       |     ❌      |

### 🤖 Machine Management

| Action         | Super Admin |      Store Admin      |      Location Admin      |          Staff           |
| -------------- | :---------: | :-------------------: | :----------------------: | :----------------------: |
| View machines  |   ✅ All    | ✅ In assigned stores | ✅ In assigned locations | ✅ In assigned locations |
| Create machine |     ✅      | ✅ In assigned stores | ✅ In assigned locations |            ❌            |
| Edit machine   |     ✅      | ✅ In assigned stores | ✅ In assigned locations |            ❌            |
| Delete machine |     ✅      | ✅ In assigned stores |            ❌            |            ❌            |

### 📦 Inventory Management

| Action                                             | Super Admin |      Store Admin      |      Location Admin      |            Staff             |
| -------------------------------------------------- | :---------: | :-------------------: | :----------------------: | :--------------------------: |
| View inventory                                     |   ✅ All    | ✅ In assigned stores | ✅ In assigned locations |   ✅ In assigned locations   |
| Edit cell config (name, description, price, image) |     ✅      | ✅ In assigned stores | ✅ In assigned locations | ✅ **In assigned locations** |
| Mark cell available/unavailable                    |     ✅      | ✅ In assigned stores | ✅ In assigned locations | ✅ **In assigned locations** |
| **Restock cell**                                   |     ✅      | ✅ In assigned stores | ✅ In assigned locations | ✅ **In assigned locations** |

**Note:** Staff can fully manage cells because they're the ones physically restocking and configuring what products go in each cell.

### 💰 Transaction Management

| Action                   | Super Admin |      Store Admin      |      Location Admin      |                Staff                 |
| ------------------------ | :---------: | :-------------------: | :----------------------: | :----------------------------------: |
| View transactions        |   ✅ All    | ✅ In assigned stores | ✅ In assigned locations | ✅ In assigned locations (read-only) |
| View transaction details |     ✅      | ✅ In assigned stores | ✅ In assigned locations |       ✅ In assigned locations       |
| Export transactions      |     ✅      | ✅ In assigned stores | ✅ In assigned locations |                  ❌                  |

### 👥 Staff Management

| Action                | Super Admin |      Store Admin       |      Location Admin       | Staff |
| --------------------- | :---------: | :--------------------: | :-----------------------: | :---: |
| View all staff        |     ✅      | ✅ In assigned stores  | ✅ In assigned locations  |  ❌   |
| Create super admin    |     ✅      |           ❌           |            ❌             |  ❌   |
| Create store admin    |     ✅      |           ❌           |            ❌             |  ❌   |
| Create location admin |     ✅      | ✅ For assigned stores |            ❌             |  ❌   |
| Create staff          |     ✅      | ✅ For assigned stores | ✅ For assigned locations |  ❌   |
| Edit staff            |     ✅      |  ✅ In assigned scope  |   ✅ In assigned scope    |  ❌   |
| Deactivate staff      |     ✅      |  ✅ In assigned scope  |   ✅ In assigned scope    |  ❌   |
| Reset password        |     ✅      |  ✅ In assigned scope  |   ✅ In assigned scope    |  ❌   |

---

## Example Scenarios

### Scenario 1: Store Admin

**Account:**

- Email: store.admin@vendingtech.com
- Role: Store Admin
- Assigned Stores: TechMart Taipei

**Can Do:**

- ✅ See all locations in TechMart Taipei (Main Lobby, 2nd Floor)
- ✅ See all machines in TechMart Taipei (machine_01 to machine_05)
- ✅ Edit inventory for all 5 machines
- ✅ View all transactions in TechMart Taipei
- ✅ Create location admins for Main Lobby or 2nd Floor
- ✅ Create staff for any location in TechMart Taipei

**Cannot Do:**

- ❌ See machines in other stores
- ❌ Create another store admin
- ❌ Delete stores or locations

---

### Scenario 2: Location Admin

**Account:**

- Email: location.admin@vendingtech.com
- Role: Location Admin
- Assigned Locations: Main Lobby

**Can Do:**

- ✅ See machines in Main Lobby only (machine_01, machine_02, machine_03)
- ✅ Edit inventory for machine_01, machine_02, machine_03
- ✅ View transactions in Main Lobby
- ✅ Create staff for Main Lobby
- ✅ Restock cells in Main Lobby machines

**Cannot Do:**

- ❌ See or edit machines in 2nd Floor (machine_04, machine_05)
- ❌ Create location admins
- ❌ View transactions from other locations

---

### Scenario 3: Staff

**Account:**

- Email: staff@vendingtech.com
- Role: Staff
- Assigned Locations: Main Lobby

**Can Do:**

- ✅ See machines in Main Lobby (machine_01, machine_02, machine_03)
- ✅ **Edit cell configuration** (change products, prices, descriptions, images)
- ✅ **Restock cells** (mark as available after physically restocking)
- ✅ View inventory (read-only for other purposes)
- ✅ View transactions (read-only)

**Cannot Do:**

- ❌ Create staff accounts
- ❌ Access machines in other locations
- ❌ Export transaction data
- ❌ Create or delete machines
- ❌ Edit location/store settings

---

## Access Control Implementation

### Backend Middleware

```typescript
// Check if staff can access a specific machine
async function canAccessMachine(
  staffId: string,
  machineId: string,
): Promise<boolean> {
  // Get staff role and assignments
  const staff = await getStaffWithRoleAndAccess(staffId)

  // Super admin = always true
  if (staff.role === 'super_admin') return true

  // Get machine's location and store
  const machine = await getMachineWithLocation(machineId)

  // Store admin: check if machine's store is in their assigned stores
  if (staff.role === 'store_admin') {
    return staff.storeAccess.includes(machine.location.storeId)
  }

  // Location admin or staff: check if machine's location is in their assigned locations
  if (staff.role === 'location_admin' || staff.role === 'staff') {
    return staff.locationAccess.includes(machine.locationId)
  }

  return false
}

// Check if staff can perform an action
async function hasPermission(
  staffId: string,
  action: string,
): Promise<boolean> {
  const staff = await getStaffWithRole(staffId)

  const permissions = {
    super_admin: ['*'], // All permissions
    store_admin: [
      'stores.edit',
      'locations.create',
      'locations.edit',
      'machines.create',
      'machines.edit',
      'inventory.edit',
      'inventory.restock',
      'transactions.view',
      'transactions.export',
      'staff.create',
      'staff.edit',
    ],
    location_admin: [
      'locations.edit',
      'machines.create',
      'machines.edit',
      'inventory.edit',
      'inventory.restock',
      'transactions.view',
      'staff.create',
      'staff.edit',
    ],
    staff: ['inventory.view', 'inventory.restock', 'transactions.view'],
  }

  const rolePermissions = permissions[staff.role]
  return rolePermissions.includes('*') || rolePermissions.includes(action)
}
```

---

## V1 Simplifications

For V1, we can simplify if needed:

### Option A: Keep All 4 Roles ✅ (Recommended)

- Provides realistic testing environment
- Easy to add features later
- Clear separation of concerns

### Option B: Simplify to 2 Roles

- **Admin** (Super Admin powers)
- **Staff** (View + Restock only)
- Faster to implement
- Less complexity for V1

**Recommendation:** Keep all 4 roles. The database schema already supports it, and the permission logic is straightforward with the helper functions above.

---

## Next Steps

Once the RBAC is implemented, test with these user stories:

1. **Super Admin** logs in → Should see all 5 machines
2. **Store Admin** logs in → Should see all 5 machines (all in same store)
3. **Location Admin** (Main Lobby) logs in → Should see only 3 machines
4. **Staff** (Main Lobby) logs in → Should see 3 machines, can only restock
5. **Location Admin** tries to edit machine in different location → Should get 403 Forbidden
6. **Staff** tries to change cell price → Should get 403 Forbidden
