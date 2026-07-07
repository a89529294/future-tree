# Authentication & Authorization System

## Overview

This project uses a cookie-based session authentication system built on TanStack Start, with server-side session tracking in PostgreSQL. It implements role-based access control (RBAC) with four roles and granular permissions.

---

## Architecture

```
Client Browser                    Server                      Database
     |                              |                           |
     |--- POST /login (email/pwd) -->|                           |
     |                              |--- Query staff ----------->|
     |                              |<-- Staff record -----------|
     |                              |--- Hash password ----------|
     |                              |--- Validate ---------------|
     |                              |--- Insert loggedInStaff ->|
     |<-- Set-Cookie (session) -----|                           |
     |                              |                           |
     |--- Request + Cookie -------->|                           |
     |                              |--- fetchStaff() ---------->|
     |                              |--- Check loggedInStaff --->|
     |<-- Response + User data -----|                           |
```

---

## Core Components

### 1. Authentication (`authenticate.ts`)

| Function | Purpose |
|----------|---------|
| `loginFn` | Validates credentials, creates session, inserts `loggedInStaff` record |
| `logoutFn` | Clears session cookie, deletes `loggedInStaff` record |
| `fetchStaff` | Validates session, returns `SessionUser` or null |

**Login Flow:**
1. Find staff by email
2. Check `isActive` flag
3. Verify password hash (PBKDF2)
4. Fetch staff with relations (role, scopes, permissions)
5. Determine `scopeType` based on role
6. Update session with user data
7. Delete existing `loggedInStaff` entry (single session enforcement)
8. Insert new `loggedInStaff` with expiry
9. Update `lastLoginAt`

**Session Validation Flow:**
1. Check session cookie exists
2. If no cookie/user: cleanup expired entries, return null
3. Query `loggedInStaff` for session record
4. If no record: clear session, return null
5. Return user data from session

### 2. Session Management (`session.ts`)

- Uses TanStack Start's `useSession` with cookie storage
- Cookie name: `staff-session`
- Cookie is encrypted with `STAFF_COOKIE_SECRET` env var
- Session duration: **5 days** (`expiresInSeconds = 60 * 60 * 24 * 5`)

### 3. Password Hashing (`password.ts`)

- Algorithm: PBKDF2 with SHA-256
- Iterations: 100,000
- Key length: 64 bytes
- Salt: From `SALT` environment variable

### 4. Server-Side Session Tracking (`loggedInStaff` table)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `staff_id` | UUID | Foreign key to `staff`, unique |
| `expires_at` | TIMESTAMPTZ | Session expiry time |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Purpose:**
- Single session per user (unique constraint on `staff_id`)
- Server-side session invalidation capability
- Session expiry tracking independent of cookie

---

## Roles & Permissions

### Roles

| Role | Scope Type | Description |
|------|------------|-------------|
| `super_admin` | global | Full system access |
| `store_admin` | store | Access to assigned stores |
| `branch_admin` | branch | Access to assigned branches |
| `staff` | branch | Limited read/write access |

### Permission Types

```typescript
// Resource permissions (CRUD)
'stores.create' | 'stores.read' | 'stores.update' | 'stores.delete'
'branches.create' | 'branches.read' | 'branches.update' | 'branches.delete'
'rooms.create' | 'rooms.read' | 'rooms.update' | 'rooms.delete'
'machines.create' | 'machines.read' | 'machines.update' | 'machines.delete'
'inventory.create' | 'inventory.read' | 'inventory.update' | 'inventory.delete' | 'inventory.restock'
'transactions.create' | 'transactions.read' | 'transactions.update' | 'transactions.delete' | 'transactions.export'
'staff.create' | 'staff.read' | 'staff.update' | 'staff.delete'
```

### Role Default Permissions

| Permission | super_admin | store_admin | branch_admin | staff |
|------------|:-----------:|:-----------:|:------------:|:-----:|
| All CRUD | All | - | - | - |
| stores.read | - | Yes | Yes | Yes |
| stores.update | - | Yes | - | - |
| branches.* | - | Yes | Yes* | Yes (read only) |
| machines.* | - | Yes | Yes | Yes (read only) |
| inventory.* | - | Yes | Yes | Yes (read/update/restock) |
| transactions.* | - | Yes | Yes | Yes (read only) |
| staff.* | - | Yes | Yes (read/create/update) | - |

---

## Data Types

### SessionUser

```typescript
type SessionUser = {
  id: string           // Staff UUID
  email: string        // Staff email
  firstName: string
  lastName: string
  role: Role           // 'super_admin' | 'store_admin' | 'branch_admin' | 'staff'
  scopeType: 'global' | 'store' | 'branch'  // Access level
  permissions: string[]  // From staff_permissions table
  scopes: string[]       // Store numbers or branch numbers
  isActive: boolean
  sessionId?: string     // Optional, for loggedInStaff sync
}
```

### LoginUser (Input)

```typescript
type LoginUser = {
  email: string
  password: string
}
```

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `SALT` | Password hashing salt |
| `STAFF_COOKIE_SECRET` | Session cookie encryption key |

---

## Route Integration

### Root Route (`__root.tsx`)

```typescript
beforeLoad: async () => {
  const user = await fetchStaff()
  return { user }
}
```

Every route has access to `context.user` via TanStack Router's context.

### Login Route (`/admin/login.tsx`)

- Uses `beforeLoad` to redirect authenticated users to `/dashboard`
- Calls `loginFn` on form submission
- Invalidates router after login to refresh context

---

## Security Considerations

1. **Password Storage**: PBKDF2 with 100k iterations - slow to crack
2. **Session Cookie**: Encrypted, HTTP-only (handled by TanStack Start)
3. **Single Session**: Unique constraint prevents concurrent logins
4. **Server Validation**: `fetchStaff` checks DB record exists before allowing access
5. **Expiry Sync**: Both cookie and `loggedInStaff.expiresAt` track session end

---

## Missing Features (Potential Improvements)

- No route-level authorization middleware (routes manually check `context.user`)
- No permission-based UI gating (components don't hide based on permissions)
- No logout button in UI (logoutFn exists but no route/component uses it)
- No password reset functionality
- No two-factor authentication
