# Implementation Plan: Simplify Auth Utils

## Current Structure Analysis

### Files Overview

| File                     | Lines | Purpose                                              |
| ------------------------ | ----- | ---------------------------------------------------- |
| `types-and-constants.ts` | 69    | `SessionUser`, `ROLE_PERMISSIONS`                    |
| `common.ts`              | 125   | Pure `AuthRules` (no DB) - shared FE/BE              |
| `scopes.ts`              | 121   | Server-side data fetchers → delegates to `AuthRules` |
| `rbac.ts`                | 44    | `requireAuth()`, `requirePermission()`               |
| `client.ts`              | 62    | Client-side wrappers around `AuthRules`              |
| `acl.ts`                 | 417   | **20+ functions** with repetitive patterns           |
| `auth.ts`                | 132   | Login/logout/fetchStaff                              |
| `session.ts`             | 10    | Session helper                                       |
| `password.ts`            | 22    | Password hashing                                     |

**Total: ~1000 lines across 9 files**

---

## Problems Identified

### 1. Massive Duplication in `acl.ts`

Every function follows the exact same pattern:

```ts
export async function requireXxxYyy(id: string) {
  await requirePermission('xxx.yyy')        // Step 1: Role check
  const user = await requireAuth()           // Step 2: Get user (REDUNDANT!)
  const scope = getUserScope(user)           // Step 3: Get scope

  if (!(await canAccessXxx(scope, id))) {    // Step 4: Data access check
    throw new Error('...')
  }

  const entity = await db.query.xxx.findFirst({ ... })  // Step 5: Fetch entity
  if (!entity) throw new Error('Not found')

  return entity
}
```

**20+ functions** repeating this pattern with minor variations.

### 2. Redundant `requireAuth()` Calls

```ts
// In acl.ts:
await requirePermission('stores.view') // This calls requireAuth() internally!
const user = await requireAuth() // Called AGAIN - wasteful
```

### 3. Double DB Fetches

```ts
// In scopes.ts canAccessLocation:
const location = await db.query.locations.findFirst(...)  // Fetch #1

// In acl.ts requireLocationView:
if (!(await canAccessLocation(scope, locationId))) { ... }
const location = await db.query.locations.findFirst(...)  // Fetch #2 (same entity!)
```

### 4. Scattered Logic

- `common.ts` - Pure rules (for client sharing)
- `scopes.ts` - Server rules with DB
- `client.ts` - Client wrappers
- `rbac.ts` - Permission checks
- `acl.ts` - Combined checks

**5 files** doing related things with overlapping concerns.

### 5. Inconsistent Mental Model

Current code mixes concepts:

- "Permission" (role-based)
- "Scope" (data-based)
- "Access" (sometimes means both)

---

## Your Mental Model (Clear & Simple)

| Check           | Analogy          | Question                                  |
| --------------- | ---------------- | ----------------------------------------- |
| **Role Access** | Driver's License | "Are you allowed to perform this action?" |
| **Data Access** | Car Key          | "Can you access this specific resource?"  |

**Both must pass** for any operation.

---

## Proposed Simplification

### New Structure (4 core files instead of 6)

```
src/utils/auth/
├── types.ts              # Types & constants (unchanged)
├── rules.ts              # Pure rules - shared FE/BE (NEW: merged common.ts)
├── authorize.ts          # Server-side authorization (NEW: replaces acl.ts, scopes.ts, rbac.ts)
├── authorize.client.ts   # Client-side authorization (NEW: replaces client.ts)
├── session.ts            # Session helper (unchanged)
├── password.ts           # Password hashing (unchanged)
└── auth.ts               # Login/logout (unchanged)
```

### Core Design

#### 1. `rules.ts` - Pure Rules (Shared FE/BE)

```ts
// Role Access (Driver's License)
export function hasPermission(role: Role, action: Action): boolean

// Data Access (Car Key) - Pure functions, no DB
export const DataRules = {
  store: (scope: UserScope, storeId: string) => boolean,
  location: (scope: UserScope, location: { id: string; storeId: string }) =>
    boolean,
  machine: (
    scope: UserScope,
    machine: { locationId: string; storeId: string },
  ) => boolean,
  // etc.
}
```

#### 2. `authorize.ts` - Server Authorization (Single Entry Point)

```ts
// Generic authorization function
export async function authorize<T extends ResourceType>(
  action: Action,
  resourceType: T,
  resourceId: string,
): Promise<ResourceData[T]> {
  // 1. Get user (single call)
  const user = await requireAuth()

  // 2. Role check (driver's license)
  if (!hasPermission(user.role, action)) {
    throw new PermissionError(action)
  }

  // 3. Fetch resource (single DB call)
  const resource = await fetchResource(resourceType, resourceId)

  // 4. Data access check (car key)
  if (!canAccessResource(user, resourceType, resource)) {
    throw new AccessError(resourceType)
  }

  return resource
}

// Usage:
const store = await authorize('stores.view', 'store', storeId)
const location = await authorize('locations.edit', 'location', locationId)
```

#### 3. `authorize.client.ts` - Client Authorization

```ts
// Same logic, but requires pre-fetched data
export function canPerform(
  user: SessionUser,
  action: Action,
  resourceType: ResourceType,
  resourceData: ResourceData, // Client must have this already
): boolean {
  // 1. Role check
  if (!hasPermission(user.role, action)) return false

  // 2. Data access check
  return canAccessResource(user, resourceType, resourceData)
}
```

---

## Benefits

| Before                       | After                            |
| ---------------------------- | -------------------------------- |
| 20+ repetitive ACL functions | 1 generic `authorize()` function |
| Double DB fetches            | Single fetch per check           |
| 6 interrelated files         | 4 focused files                  |
| ~800 lines of auth logic     | ~200 lines estimated             |
| Scattered permission checks  | Single source of truth           |
| FE/BE logic partially shared | `rules.ts` fully shared          |

---

## Migration Strategy

### Phase 1: Create New Files

1. Create `rules.ts` (merge `common.ts` logic)
2. Create `authorize.ts` (generic pattern)
3. Create `authorize.client.ts` (client wrapper)

### Phase 2: Migrate Consumers

1. Find all usages of `acl.ts` functions
2. Replace with new `authorize()` calls
3. Update client-side checks

### Phase 3: Cleanup

1. Delete `acl.ts`, `scopes.ts`, `rbac.ts`, `common.ts`, `client.ts`
2. Update exports

---

## Questions Before Proceeding

1. **Resource types to support**: Store, Location, Machine, Inventory, Transaction, Staff - any others?

2. **Action naming convention**: Keep `resource.action` format (e.g., `stores.view`)? Or simplify to `view`, `edit`, `create`, `delete`?

3. **Error handling**: Current code throws generic `Error`. Want custom error types (e.g., `PermissionError`, `NotFoundError`, `AccessError`)?

4. **Return type preference**: Current functions return the fetched entity. Keep this pattern?

5. **Create operations**: These check parent access (e.g., `requireLocationCreate` checks store access). Need to handle these differently?

---

## ✅ COMPLETED - Final Structure

### Files After Refactoring

| File                     | Lines | Purpose                                                       |
| ------------------------ | ----- | ------------------------------------------------------------- |
| `types-and-constants.ts` | 69    | Types & role permissions (unchanged)                          |
| `rules.ts`               | ~200  | **Pure rules** - shared FE/BE (`hasPermission` + `DataRules`) |
| `authorize.ts`           | ~400  | **Server-side** - authorize functions with DB access          |
| `authorize.client.ts`    | ~140  | **Client-side** - pure checks using pre-fetched data          |
| `auth.ts`                | 132   | Login/logout/fetchStaff (unchanged)                           |
| `session.ts`             | 10    | Session helper (unchanged)                                    |
| `password.ts`            | 22    | Password hashing (unchanged)                                  |

**Deleted:** `acl.ts`, `scopes.ts`, `rbac.ts`, `common.ts`, `client.ts`

### Usage Examples

#### Server-side (authorize.ts)

```ts
import {
  authorizeStore,
  authorizeLocation,
  authorizeMachine,
} from '@/utils/auth/authorize'

// Single function does both checks:
// 1. Role check (driver's license)
// 2. Data access check (car key)
// Returns the fetched entity or throws

const store = await authorizeStore('stores.view', storeId)
const location = await authorizeLocation('locations.edit', locationId)
const machine = await authorizeMachine('machines.delete', machineId)

// For create operations (check parent access):
const parentStore = await authorizeLocationCreate(storeId)
const parentLocation = await authorizeMachineCreate(locationId)
```

#### Client-side (authorize.client.ts)

```ts
import {
  canAccessStore,
  canAccessMachine,
  hasPermission,
} from '@/utils/auth/authorize.client'

// Pure functions - require pre-fetched data
const canView = canAccessStore(user, 'stores.view', storeId)
const canEdit = canAccessMachine(user, 'machines.edit', { locationId, storeId })

// Direct permission check
const canCreateLocation = hasPermission(user.role, 'locations.create')
```

### Key Design Decisions

1. **Separate authorize functions per resource** - cleaner than one generic function, better TypeScript types
2. **`authorizeXxxCreate` pattern** - checks parent access (creating location needs store access)
3. **Single DB fetch** - no more double fetches like old `acl.ts`
4. **`rules.ts` is pure** - can be imported by both server and client code
5. **`authorize.client.ts` needs pre-fetched data** - client must already have entity data to check access

---

## ✅ DECIDED: Roles as Templates + Individual Permissions

### Final Design

- **Role** = template that provides default permissions (label for quick assignment)
- **Staff permissions** = explicit list of permissions for each staff member
- When assigning a role, copy its default permissions to `staff_permissions`
- Can add/remove individual permissions afterward

### Schema

```sql
-- Simple: each row = one permission for one staff member
-- Add row = grant permission, Delete row = revoke permission
CREATE TABLE staff_permissions (
  id UUID PRIMARY KEY,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  permission VARCHAR(50) NOT NULL,    -- e.g., 'machines.delete'
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES staff(id),
  UNIQUE(staff_id, permission)        -- No duplicates
);
```

### SessionUser

```ts
type SessionUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'super_admin' | 'store_admin' | 'location_admin' | 'staff' // Label only
  permissions: Array<string> // Actual permissions from staff_permissions table
  storeAccess: Array<string>
  locationAccess: Array<string>
  isActive: boolean
}
```

### How Permission Check Works

```ts
// OLD: Check role's static permissions
hasPermission(user.role, 'machines.delete') // Looks up ROLE_PERMISSIONS[role]

// NEW: Check user's actual permissions array
hasPermission(user.permissions, 'machines.delete') // Direct array check
```

### Super Admin

- Starts with all permissions (like other roles)
- Can be tweaked if needed (manual DB operation, no UI planned)

---

## ✅ DECIDED: Simplified Client-Side Authorization

### Current State

We have `authorize.client.ts` with functions like:

- `canAccessStore(user, action, storeId)`
- `canAccessLocation(user, action, location)`
- `canAccessMachine(user, action, machine)`
- etc.

These duplicate logic from `authorize.ts` but without DB access.

### Key Insight: TanStack Start's `createServerFn`

From TanStack Start docs:

```tsx
// createServerFn: RPC pattern - server execution, client callable
const fetchUser = createServerFn().handler(async () => await db.users.find())

// Usage from client component:
const user = await fetchUser() // ✅ Network request to server
```

**This means:** Client can call server functions directly. They result in HTTP requests, but the logic stays on the server.

### Two Approaches to Consider

#### Approach A: Keep `authorize.client.ts` (Current)

**Use case:** Instant UI decisions without network latency

```tsx
// Client checks session data directly - no network call
const canEdit = canAccessMachine(user, 'machines.edit', { locationId, storeId })
{
  canEdit && <EditButton />
}
```

**Pros:**

- Zero latency for UI decisions
- Works offline (if session is cached)
- Good for show/hide UI elements

**Cons:**

- Duplicated logic between client and server
- Risk of client/server getting out of sync
- Client-side checks are bypassable (security theater for mutations)

#### Approach B: Use `createServerFn` for All Auth Checks

**Use case:** Single source of truth on server

```tsx
// Define on server
export const checkCanEditMachine = createServerFn()
  .validator((d: { machineId: string }) => d)
  .handler(async ({ data }) => {
    try {
      await authorizeMachine('machines.edit', data.machineId)
      return { canEdit: true }
    } catch {
      return { canEdit: false }
    }
  })

// Call from client - results in HTTP request
const { canEdit } = await checkCanEditMachine({ machineId })
```

**Pros:**

- Single source of truth
- No code duplication
- Always up-to-date with server state

**Cons:**

- Network latency for every check
- Not ideal for rapid UI decisions (e.g., showing 50 items with different permissions)

### Proposed Hybrid Approach

| Check Type                                 | Where                     | Why                                                 |
| ------------------------------------------ | ------------------------- | --------------------------------------------------- |
| **Permission only** (sidebar/nav)          | Client - session data     | Zero latency, permissions rarely change mid-session |
| **Data access** (can I access THIS store?) | Client - session data     | storeAccess/locationAccess in session is sufficient |
| **Before mutation** (edit/delete)          | Server - `createServerFn` | Security must be server-side                        |

#### What We Actually Need on Client

For FE show/hide decisions, we only need to check the **session cookie** which contains:

```ts
SessionUser = {
  permissions: ['stores.view', 'machines.edit', ...],
  storeAccess: ['store-uuid-1', 'store-uuid-2'],
  locationAccess: ['loc-uuid-1', 'loc-uuid-2'],
}
```

**Simple client checks:**

```tsx
// Permission check (can user do this action at all?)
const canViewStores = user.permissions.includes('stores.view')

// Data access check (can user access this specific resource?)
const canAccessThisStore = user.storeAccess.includes(storeId)
const canAccessThisLocation = user.locationAccess.includes(locationId)

// Combined
const canEditThisStore =
  user.permissions.includes('stores.edit') && user.storeAccess.includes(storeId)
```

This is simpler than the current `authorize.client.ts` which has complex `DataRules` logic.

### Questions

1. **Do we need `authorize.client.ts` at all?**
   - Could we just use simple session checks for FE?
   - Keep server-side `authorize.ts` for actual security?

2. **What about nested resources (machines, inventory)?**
   - Machine belongs to location → belongs to store
   - Option A: Include `machineAccess` in session (might get large)
   - Option B: FE fetches machine with its location/store, then checks `locationAccess`
   - Option C: Use `createServerFn` for machine-level checks

3. **Performance for lists?**
   - If showing 100 machines, do we check access for each?
   - Or do we trust the server to only return accessible machines?

### Final Implementation

**Deleted:**

- `authorize.client.ts` - complex `DataRules` logic was overkill for client

**Simplified hooks (`src/hooks/use-permission.ts`):**

```ts
// Permission checks
usePermission(action) // user.permissions.includes(action)
usePermissions(actions) // all permissions
useAnyPermission(actions) // any permission

// Data access checks
useCanAccessStore(storeId) // user.storeAccess.includes(storeId)
useCanAccessLocation(locationId) // user.locationAccess.includes(locationId)

// Combined checks
useCanDoOnStore(action, storeId) // permission + store access
useCanDoOnLocation(action, locationId) // permission + location access
```

**Simplified `<Can>` component:**

```tsx
// Permission only
<Can action="stores.view">...</Can>

// Permission + store access
<Can action="stores.edit" storeId={store.id}>...</Can>

// Permission + location access
<Can action="locations.edit" locationId={location.id}>...</Can>
```

**Nested resources (machines, inventory):**

- Server handles filtering - queries only return accessible resources
- FE trusts server to return only what user can access

---

## ✅ DECIDED: Complete Permission List (CRUD for all resources)

```ts
const ALL_PERMISSIONS = [
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
```

---

## 📋 Implementation Plan

### Phase 1: Schema Changes

- [ ] Add `staffPermissions` table to `schema.ts`

### Phase 2: Types & Constants

- [ ] Add complete permission list with CRUD for all resources
- [ ] Update `SessionUser` to include `permissions` array
- [ ] Update `ROLE_PERMISSIONS` to use new complete list

### Phase 3: Backend Auth Updates

- [ ] Update `rules.ts` to check `permissions` array
- [ ] Update `auth.ts` to load permissions from `staff_permissions` table
- [ ] Update `authorize.ts` and `authorize.client.ts`

### Phase 4: Frontend Helpers

- [ ] Create `usePermission` hook
- [ ] Create `useCanAccess` hook
- [ ] Create `<Can>` component
