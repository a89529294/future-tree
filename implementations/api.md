# V1 API Specification

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

---

## Public APIs (No Auth Required)

### 1. Get Machine Inventory

**Endpoint:** `GET /api/shop/machine/:thingId`

**Description:** Fetch machine details and all 5 cells with their product info and availability.

**URL Parameters:**

- `thingId` (string, required): Machine identifier (e.g., "machine_01")

**Response (200 OK):**

```json
{
  "machine": {
    "id": "uuid",
    "thingId": "machine_01",
    "displayName": "Lobby Unit 1",
    "status": "online",
    "location": {
      "name": "Main Lobby",
      "store": "TechMart Taipei"
    }
  },
  "cells": [
    {
      "id": "uuid",
      "cellNumber": 1,
      "productName": "Snack Box A",
      "productDescription": "2 bags of chips, 1 chocolate bar, 1 cookie pack",
      "price": "50.00",
      "imageUrl": "https://picsum.photos/seed/snackA/400/400",
      "stockAvailable": true
    },
    {
      "id": "uuid",
      "cellNumber": 2,
      "productName": "Drink Bundle",
      "productDescription": "2 cans of Coke, 1 bottle of tea",
      "price": "30.00",
      "imageUrl": "https://picsum.photos/seed/drink/400/400",
      "stockAvailable": false
    }
    // ... cells 3-5
  ]
}
```

**Error Responses:**

- `404 Not Found`: Machine not found
- `500 Internal Server Error`: Server error

---

### 2. Create Transaction (Checkout)

**Endpoint:** `POST /api/shop/checkout`

**Description:** Create a transaction and initiate fake payment process.

**Request Body:**

```json
{
  "thingId": "machine_01",
  "selectedCells": [1, 3, 5],
  "userIpAddress": "123.45.67.89",
  "userAgent": "Mozilla/5.0..."
}
```

**Response (200 OK):**

```json
{
  "transactionId": "uuid",
  "totalAmount": "210.00",
  "paymentStatus": "pending",
  "items": [
    {
      "cellNumber": 1,
      "productName": "Snack Box A",
      "price": "50.00"
    },
    {
      "cellNumber": 3,
      "productName": "Healthy Mix",
      "price": "45.00"
    },
    {
      "cellNumber": 5,
      "productName": "Energy Bundle",
      "price": "80.00"
    }
  ]
}
```

**Error Responses:**

- `400 Bad Request`: Invalid input (e.g., empty selectedCells)
- `404 Not Found`: Machine not found
- `409 Conflict`: One or more selected cells are unavailable

```json
{
  "error": "Items unavailable",
  "unavailableCells": [3]
}
```

---

### 3. Process Payment (Fake)

**Endpoint:** `POST /api/shop/payment/process`

**Description:** Simulate payment processing with 2-second delay.

**Request Body:**

```json
{
  "transactionId": "uuid"
}
```

**Response (200 OK):** _(after 2 second delay)_

```json
{
  "success": true,
  "transactionId": "uuid",
  "paymentStatus": "paid",
  "unlockCommand": {
    "topic": "cmd/machine_01/unlock",
    "payload": {
      "request_id": "uuid",
      "cells": [1, 3, 5],
      "timestamp": 1678888888
    }
  }
}
```

**Side Effects:**

1. Update transaction status to "paid"
2. Mark inventory cells as unavailable (`stockAvailable = false`)
3. Log unlock command to console (for V1, no real MQTT)

**Error Responses:**

- `404 Not Found`: Transaction not found
- `400 Bad Request`: Transaction already processed

---

## Admin APIs (Auth Required)

**Authentication:** All admin endpoints require session cookie (automatically set after login via `useSession`). No need to manually pass headers - the browser handles it.

### 4. Login

**Endpoint:** `POST /api/admin/auth/login`

**Description:** Authenticate staff and get JWT token.

**Request Body:**

```json
{
  "email": "admin@vendingtech.com",
  "password": "admin123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@vendingtech.com",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "super_admin"
  }
}
```

**Note:** Session is automatically set via httpOnly cookie. No token to store in localStorage.

**Error Responses:**

- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account is inactive

---

### 5. Get Current Staff Info

**Endpoint:** `GET /api/admin/auth/me`

**Description:** Get current logged-in staff details.

**Response (200 OK):**

```json
{
  "id": "uuid",
  "email": "admin@vendingtech.com",
  "firstName": "Super",
  "lastName": "Admin",
  "role": "super_admin",
  "permissions": {
    "stores": [],
    "locations": []
  },
  "lastLoginAt": "2024-01-15T10:30:00Z"
}
```

---

### 6. Get Machines (Filtered by Role)

**Endpoint:** `GET /api/admin/machines`

**Description:** Get list of machines visible to current staff based on role.

**Query Parameters:**

- `storeId` (uuid, optional): Filter by store
- `locationId` (uuid, optional): Filter by location
- `status` (string, optional): Filter by status (online, offline, maintenance)

**Response (200 OK):**

```json
{
  "machines": [
    {
      "id": "uuid",
      "thingId": "machine_01",
      "displayName": "Lobby Unit 1",
      "status": "online",
      "lastHeartbeat": "2024-01-15T10:25:00Z",
      "location": {
        "id": "uuid",
        "name": "Main Lobby",
        "storeId": "uuid",
        "storeName": "TechMart Taipei"
      },
      "cellsAvailable": 3,
      "cellsTotal": 5
    }
    // ... more machines
  ]
}
```

---

### 7. Get Machine Inventory (Admin View)

**Endpoint:** `GET /api/admin/machines/:machineId/inventory`

**Description:** Get detailed inventory for a specific machine (all 5 cells).

**Response (200 OK):**

```json
{
  "machine": {
    "id": "uuid",
    "thingId": "machine_01",
    "displayName": "Lobby Unit 1",
    "status": "online"
  },
  "inventory": [
    {
      "id": "uuid",
      "cellNumber": 1,
      "productName": "Snack Box A",
      "productDescription": "2 bags of chips, 1 chocolate bar, 1 cookie pack",
      "price": "50.00",
      "imageUrl": "https://...",
      "stockAvailable": true,
      "lastRestocked": "2024-01-15T08:00:00Z"
    }
    // ... cells 2-5
  ]
}
```

**Error Responses:**

- `403 Forbidden`: Staff doesn't have access to this machine
- `404 Not Found`: Machine not found

---

### 8. Update Cell Inventory

**Endpoint:** `PUT /api/admin/inventory/:inventoryId`

**Description:** Update a single cell's configuration.

**Request Body:**

```json
{
  "productName": "Snack Box A",
  "productDescription": "Updated description",
  "price": "55.00",
  "imageUrl": "https://...",
  "stockAvailable": true
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "inventory": {
    "id": "uuid",
    "cellNumber": 1,
    "productName": "Snack Box A",
    "productDescription": "Updated description",
    "price": "55.00",
    "imageUrl": "https://...",
    "stockAvailable": true,
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**

- `403 Forbidden`: Staff doesn't have permission
- `404 Not Found`: Inventory item not found
- `400 Bad Request`: Invalid input (e.g., negative price)

---

### 9. Restock Cell

**Endpoint:** `POST /api/admin/inventory/:inventoryId/restock`

**Description:** Mark a cell as restocked (set stockAvailable = true, update lastRestocked timestamp).

**Request Body:** _(optional, can be empty)_

```json
{
  "notes": "Restocked with fresh items"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "inventory": {
    "id": "uuid",
    "cellNumber": 1,
    "stockAvailable": true,
    "lastRestocked": "2024-01-15T10:35:00Z"
  }
}
```

---

### 10. Get Transactions

**Endpoint:** `GET /api/admin/transactions`

**Description:** Get list of transactions (filtered by staff permissions).

**Query Parameters:**

- `machineId` (uuid, optional): Filter by machine
- `status` (string, optional): Filter by payment status
- `startDate` (ISO date, optional): Filter transactions after this date
- `endDate` (ISO date, optional): Filter transactions before this date
- `page` (number, default: 1): Pagination
- `limit` (number, default: 50): Items per page

**Response (200 OK):**

```json
{
  "transactions": [
    {
      "id": "uuid",
      "createdAt": "2024-01-15T10:30:00Z",
      "machine": {
        "thingId": "machine_01",
        "displayName": "Lobby Unit 1"
      },
      "totalAmount": "210.00",
      "paymentStatus": "paid",
      "items": [
        {
          "cellNumber": 1,
          "productName": "Snack Box A",
          "price": "50.00"
        }
        // ... more items
      ]
    }
    // ... more transactions
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 120,
    "totalPages": 3
  }
}
```

---

### 11. Get Transaction Details

**Endpoint:** `GET /api/admin/transactions/:transactionId`

**Description:** Get detailed information about a single transaction.

**Response (200 OK):**

```json
{
  "id": "uuid",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:02Z",
  "machine": {
    "id": "uuid",
    "thingId": "machine_01",
    "displayName": "Lobby Unit 1",
    "location": {
      "name": "Main Lobby",
      "store": "TechMart Taipei"
    }
  },
  "totalAmount": "210.00",
  "paymentStatus": "paid",
  "paymentReferenceId": "fake_ref_12345",
  "userIpAddress": "123.45.67.89",
  "userAgent": "Mozilla/5.0...",
  "items": [
    {
      "cellNumber": 1,
      "productName": "Snack Box A",
      "productDescription": "2 bags of chips, 1 chocolate bar, 1 cookie pack",
      "priceAtPurchase": "50.00",
      "imageUrl": "https://..."
    }
    // ... more items
  ]
}
```

**Error Responses:**

- `403 Forbidden`: Staff doesn't have access to this transaction
- `404 Not Found`: Transaction not found

---

## Permission Rules (RBAC)

### Super Admin

- ✅ View all stores, locations, machines
- ✅ Manage all inventory
- ✅ View all transactions
- ✅ Create/edit stores, locations, staff

### Store Admin

- ✅ View assigned store(s) and all locations within
- ✅ View all machines in assigned stores
- ✅ Manage inventory in assigned stores
- ✅ View transactions in assigned stores
- ✅ Create location admins and staff for their stores
- ❌ Cannot access other stores

### Location Admin

- ✅ View assigned location(s) only
- ✅ View machines in assigned locations
- ✅ Manage inventory in assigned locations
- ✅ View transactions in assigned locations
- ✅ Create staff for their locations
- ❌ Cannot access other locations

### Staff

- ✅ View assigned location(s) only
- ✅ View machines in assigned locations
- ✅ Restock inventory (mark as available)
- ✅ View transactions (read-only)
- ❌ Cannot edit cell configuration (price, name, description)
- ❌ Cannot create other staff accounts

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {
    // Optional additional details
  }
}
```

**Common Error Codes:**

- `UNAUTHORIZED`: Not authenticated
- `FORBIDDEN`: Authenticated but no permission
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input
- `CONFLICT`: Resource conflict (e.g., item already sold)
- `INTERNAL_ERROR`: Server error

---

## V1 Simplifications (What's NOT Included)

❌ Real payment processing (NewebPay integration)  
❌ Real MQTT communication (AWS IoT Core)  
❌ Session management for shopping cart  
❌ Price locking during shopping  
❌ Product templates  
❌ Maintenance logs  
❌ Door event logs  
❌ Email notifications  
❌ S3 file uploads (just paste URLs)  
❌ Password reset flow  
❌ Advanced reports/analytics  
❌ Refund processing

These will be added in future versions.
