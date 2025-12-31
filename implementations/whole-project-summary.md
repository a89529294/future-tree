# IoT Vending Machine System - Complete Specification

## System Overview

A network of 50+ smart vending machines (max 1000) with **guest checkout** (no user login required). Users scan QR codes to purchase items, and staff manage operations through an admin portal.

---

## Architecture

### Technology Stack

| Component              | Technology                     | Purpose                                                                     |
| :--------------------- | :----------------------------- | :-------------------------------------------------------------------------- |
| **Compute**            | AWS EC2                        | Hosts Full-Stack Application                                                |
| **Web Server**         | Nginx                          | Reverse proxy                                                               |
| **Frontend Framework** | TanStack Start                 | Single application serving both Shop (guest users) and Admin Portal (staff) |
| **Database**           | AWS RDS (PostgreSQL)           | Relational data for Stores, Machines, Inventory, Transactions               |
| **Messaging**          | AWS IoT Core                   | MQTT broker for secure communication between backend and devices            |
| **Payment**            | LinePay via NewebPay           | Taiwan payment gateway integration                                          |
| **Email**              | AWS SES (Simple Email Service) | Transactional emails and alerts                                             |
| **Storage**            | AWS S3                         | Product images, store images                                                |

### Application Architecture

- **Single TanStack Start Application** serves both:
  - **Shop Interface:** `/shop?thingID=machine_XXX` (guest users, no login)
  - **Admin Portal:** `/admin/*` (staff only, requires authentication)
- Shared:
  - Database schema
  - Backend API routes
  - Authentication middleware
  - MQTT client connection
  - Session management
- Benefits:
  - Code reuse between shop and admin
  - Single deployment
  - Shared type definitions
  - Unified API layer

### Server Configuration

- **EC2 Instance:** Runs TanStack Start application + Nginx
- **Nginx Configuration:**

  ```nginx
  server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
  }

  server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    # Proxy all requests to TanStack Start
    location / {
      proxy_pass http://localhost:3000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_cache_bypass $http_upgrade;
    }
  }
  ```

---

## Your Responsibilities

### 1. Frontend Development

#### A. Shopping Page (Guest Checkout)

**URL Pattern:** `https://your-domain.com/shop?thingID=machine_01`

**Session Security (Server-Side Session Tracking):**

**Purpose:** Track shopping cart state and lock prices during active shopping sessions

**Important Note:** Since QR codes are static URLs, there is no technical way to differentiate between a user refreshing the page vs. rescanning the QR code. Users can access the shopping page anytime by scanning the QR or visiting the URL directly. Session tracking is purely for:

- Maintaining cart state across page refreshes
- Locking prices for 30 minutes to prevent price changes mid-shopping
- Analytics and tracking user shopping behavior

**How It Works:**

1. User scans QR → Lands on `/shop?thingID=machine_01`
2. Backend checks for `session_id` cookie
3. If cookie exists:
   - Look up session in database (shopping_sessions table)
   - If session found and valid → Restore cart and use locked prices
   - If session expired → Create new session (user can still shop)
4. If no cookie:
   - Create new session in database with 30-minute expiry
   - Lock current cell prices in session
   - Set cookie with session_id (httpOnly, secure, 30-min expiry)
   - Allow access

**Key Behavior:**

- User refreshes within 30 minutes → ✅ Cart and prices preserved
- User refreshes after 30+ minutes → ✅ Can still shop, but new session created (cart cleared, prices updated)
- User copies URL to new tab (same browser) → ✅ Same session, cart preserved
- User opens in incognito/different browser → ✅ New session created
- Session expires after purchase OR after 30 minutes of inactivity

**Cookie Implementation:**

```javascript
// Only store session ID in cookie
response.setCookie('session_id', sessionId, {
  httpOnly: true, // Prevents JavaScript access (security)
  secure: true, // HTTPS only
  maxAge: 30 * 60, // 30 minutes in seconds
  sameSite: 'strict', // CSRF protection
})
```

**Session Data Stored in Database:**

```javascript
{
  session_id: "uuid-abc-123",
  thing_id: "machine_01",
  created_at: 1678888888,
  expires_at: 1678890688,  // created_at + 30 minutes
  cell_prices: {           // Locked prices at session start
    1: 50,
    2: 30,
    3: 120,
    4: 50,
    5: 200
  },
  selected_cells: [1, 4]   // User's cart
}
```

**Features:**

- Read `thingID` from URL parameter
- Fetch and display available cells from that specific machine
- **Shopping UI Design:**
  - Grid/card layout showing all 5 cells
  - Each card displays:
    - Product image (large, prominent)
    - Product name (bold headline)
    - Description with items listed (bullet points or text)
    - Price (large, clear)
    - "Available" badge (green) or "Sold Out" badge (gray, disabled)
  - Multi-cell selection (checkboxes or toggle buttons)
  - Running total at bottom
  - "Checkout" button (disabled if no cells selected)
- Guest checkout flow (no login/registration)
- Payment form integration (LinePay via NewebPay)
- Success/failure screens
- Session timeout handling

#### B. Admin Portal (Staff Management)

**Authentication:** Staff login system with role-based access control

**Dashboard Features:**

- **Machine Status Overview:**
  - Online/Offline indicators (based on heartbeat)
  - Jammed machine alerts
  - Last heartbeat timestamp
  - Poll for updates every 60 seconds
- **Inventory Management:**
  - Select store → location → machine drill-down
  - View all 5 cells per machine in a grid/list view
  - **Per Cell Configuration UI:**
    - Product Name input field
    - Product Description textarea (list items included)
    - Price input (NTD)
    - Image upload/URL input
    - Toggle: Available (green) / Sold Out (red/gray)
  - **Bulk Operations:**
    - "Mark All as Sold Out" button
    - Copy configuration from another machine
  - **Product Template Library (Optional):**
    - Predefined product templates for quick assignment
    - Example: "Snack Box A" template auto-fills name, description, suggested price, image
    - Admin can override any field after applying template
- **Transaction Reports:**
  - Revenue by machine/location/store
  - Transaction history with filters:
    - Date range picker
    - Machine filter
    - Payment status filter
  - Export to CSV functionality
- **Maintenance & Alerts:**
  - Jammed machine dashboard
  - Manual flag clearing after physical maintenance
  - Transaction dispute review
  - Manual refund processing (no automatic refunds)

**Role-Based Views:**

- **Super Admin:** See all stores/locations/machines
- **Store Admin:** See only assigned store
- **Location Admin:** See only assigned location

### 2. Backend Development

#### A. Payment Processing (NewebPay + LinePay)

**Payment Gateway:** NewebPay (支付gateway for Taiwan market)
**Supported Methods:** Credit Card, LinePay (configurable per store)

**Payment Flow Overview:**

1. User completes checkout → Backend creates 'pending' transaction
2. Backend encrypts payment data with store's credentials
3. User redirects to NewebPay payment page
4. User pays (credit card or LinePay)
5. **NotifyURL webhook** (server-to-server) - Critical for business logic
6. Backend updates transaction, inventory, sends unlock command
7. **ReturnURL redirect** (browser) - Only for user experience

**Critical Implementation:**

```javascript
// Payment initialization
POST to NewebPay with:
- MerchantID (from stores.newebpay_merchant_id)
- MerchantOrderNo: request_id (unique transaction identifier)
- Amt: total amount in NTD (integer)
- ReturnURL: https://your-domain.com/payment/return (browser redirect)
- NotifyURL: https://your-domain.com/payment/notify (webhook - CRITICAL!)
- Encrypted TradeInfo (AES256 with store's hash_key and hash_iv)
- TradeSha (SHA256 hash for verification)

// NotifyURL Handler (CRITICAL - Use this for all business logic)
POST /payment/notify {
  // 1. Verify signature (prevent tampering)
  // 2. Decrypt NewebPay response
  // 3. Find transaction by MerchantOrderNo (our request_id)
  // 4. Check if already processed (handle duplicate webhooks)
  // 5. Update transaction status ('paid' or 'failed')
  // 6. If paid:
  //    - Update inventory (mark cells as unavailable)
  //    - Publish MQTT unlock command
  //    - Delete shopping session
  //    - Log success
  // 7. If MQTT fails:
  //    - Log to audit_logs with 'mqtt_unlock_failed' action
  //    - Still return HTTP 200 (payment succeeded, admin will handle unlock)
  // 8. Always return HTTP 200 to stop NewebPay retries
}

// ReturnURL Handler (User-facing only)
GET /payment/return {
  // Show success/failure page to user
  // DO NOT use this for critical operations
  // User can manipulate browser requests
}
```

**Security Requirements:**

- **Always verify signature** to prevent tampering
- **Check duplicate webhooks** (NewebPay retries if no HTTP 200)
- **Never trust ReturnURL** for business logic (use NotifyURL only)
- **Store credentials securely** in database (consider encryption at rest)
- Use HTTPS for NotifyURL and ReturnURL
- Validate payment amount matches expected total

**NewebPay Encryption/Decryption Implementation:**

```javascript
const crypto = require('crypto')

/**
 * Encrypt payment data for NewebPay
 * Uses AES-256-CBC encryption
 */
function encryptNewebPay(data, hashKey, hashIV) {
  // Convert data object to URL-encoded string
  const text = new URLSearchParams(data).toString()

  // Create cipher with hash key and IV
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(hashKey),
    Buffer.from(hashIV),
  )

  // Encrypt
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return encrypted
}

/**
 * Decrypt payment response from NewebPay
 */
function decryptNewebPay(encrypted, hashKey, hashIV) {
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(hashKey),
      Buffer.from(hashIV),
    )

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    // Parse URL-encoded string back to object
    const params = new URLSearchParams(decrypted)
    const result = {}
    for (const [key, value] of params) {
      result[key] = value
    }

    return result
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Invalid encrypted data from NewebPay')
  }
}

/**
 * Generate SHA256 signature for verification
 */
function generateNewebPaySignature(tradeInfo, hashKey, hashIV) {
  const raw = `HashKey=${hashKey}&${tradeInfo}&HashIV=${hashIV}`
  return crypto.createHash('sha256').update(raw).digest('hex').toUpperCase()
}

/**
 * Verify signature from NewebPay response
 */
function verifyNewebPaySignature(tradeInfo, tradeSha, hashKey, hashIV) {
  const expectedSha = generateNewebPaySignature(tradeInfo, hashKey, hashIV)
  return tradeSha === expectedSha
}
```

**Race Condition Prevention (Atomic Inventory Update):**

```javascript
// In NotifyURL handler, when payment succeeds
async function updateInventoryAtomic(machineId, selectedCells, transactionId) {
  try {
    // Atomic check-and-update: only update if still available
    const result = await db.query(
      `
      UPDATE inventory 
      SET stock_available = false 
      WHERE machine_id = $1 
      AND cell_number = ANY($2)
      AND stock_available = true
      RETURNING cell_number
    `,
      [machineId, selectedCells],
    )

    const updatedCells = result.rows.map((r) => r.cell_number)
    const unavailableCells = selectedCells.filter(
      (c) => !updatedCells.includes(c),
    )

    if (unavailableCells.length > 0) {
      // Some cells were sold to someone else!
      console.error(`Cells already sold: ${unavailableCells}`)

      // Calculate refund amount for unavailable cells
      const txnItems = await db.query(
        `SELECT cell_number, price_at_purchase 
         FROM transaction_items 
         WHERE transaction_id = $1 AND cell_number = ANY($2)`,
        [transactionId, unavailableCells],
      )

      const refundAmount = txnItems.rows.reduce(
        (sum, item) => sum + parseFloat(item.price_at_purchase),
        0,
      )

      // Update transaction with partial refund info
      await db.query(
        `
        UPDATE transactions 
        SET refund_amount = $1,
            refund_reason = 'Partial fulfillment - some cells sold out',
            payment_status = 'refunded'
        WHERE id = $2
      `,
        [refundAmount, transactionId],
      )

      // Log for admin review
      await db.query(
        `
        INSERT INTO audit_logs 
        (staff_id, action, resource_type, resource_id, details)
        VALUES (NULL, 'partial_fulfillment', 'transaction', $1, $2)
      `,
        [
          transactionId,
          JSON.stringify({
            unavailable_cells: unavailableCells,
            refund_amount: refundAmount,
            fulfilled_cells: updatedCells,
          }),
        ],
      )

      // Alert admin
      await sendEmailAlert({
        type: 'partial_fulfillment',
        transaction_id: transactionId,
        unavailable_cells: unavailableCells,
        refund_amount: refundAmount,
      })
    }

    return {
      success: updatedCells.length === selectedCells.length,
      fulfilled: updatedCells,
      unavailable: unavailableCells,
    }
  } catch (error) {
    console.error('Inventory update failed:', error)
    throw error
  }
}
```

**Failed Payment Handling:**

- Transaction created as 'pending'
- Payment fails at NewebPay
- NotifyURL updates status to 'failed' with failure_reason
- Inventory NOT decremented (remains available)
- User sees error message, can try again (new transaction)

**MQTT Failure Handling:**

- Payment succeeds, transaction marked as 'paid'
- Inventory decremented
- MQTT publish fails (AWS IoT down, network issue, device offline)
- Log to audit_logs: `action = 'mqtt_unlock_failed'`
- Admin portal shows alert: "Transaction #123 - Unlock failed"
- Admin can manually retry unlock or refund customer

#### B. Database Operations

**Transaction Logging:**

```javascript
// On successful payment verification (from NotifyURL)
1. Create transaction record:
   - machine_id
   - total_amount
   - payment_reference_id (from NewebPay)
   - payment_status: 'paid'
   - timestamp

2. Create transaction_items records for each cell purchased

3. Update inventory for purchased cells:
   - Set inventory.stock_available = false (mark as sold/empty)
   - This is "trust-based" - assumes user took items when door opened
```

**Machine Status Tracking:**

```javascript
// Heartbeat monitoring (every 60 seconds)
- Last heartbeat timestamp stored per machine
- If no heartbeat for 90+ seconds → mark as 'offline'
- Update machines.status field

// Door status handling
- Listen to state/{thing_id}/door messages
- If "jammed" → update machines.status = 'jammed'
- Log to maintenance_logs table for admin review
```

**Session Management:**

```javascript
// Session creation
async function createSession(thingID) {
  const currentPrices = await db.query(
    'SELECT cell_number, price FROM inventory WHERE machine_id = $1',
    [getMachineIdFromThingID(thingID)],
  )

  const cellPrices = {}
  currentPrices.forEach((cell) => {
    cellPrices[cell.cell_number] = cell.price
  })

  const sessionId = uuid()
  await db.query(
    `INSERT INTO shopping_sessions 
     (session_id, thing_id, created_at, expires_at, cell_prices) 
     VALUES ($1, $2, NOW(), NOW() + INTERVAL '30 minutes', $3)`,
    [sessionId, thingID, JSON.stringify(cellPrices)],
  )

  return sessionId
}

// Session validation
async function validateSession(sessionId) {
  const session = await db.query(
    'SELECT * FROM shopping_sessions WHERE session_id = $1',
    [sessionId],
  )

  if (!session || session.expires_at < Date.now()) {
    return { valid: false, error: 'Session expired' }
  }

  return { valid: true, session }
}

// Session cleanup (cron job runs every hour)
async function cleanupExpiredSessions() {
  await db.query('DELETE FROM shopping_sessions WHERE expires_at < NOW()')
}
```

#### C. MQTT Communication via AWS IoT Core

**Required AWS Setup:**

- EC2 instance IAM role with permissions:
  - `iot:Publish`
  - `iot:Subscribe`
  - `iot:Connect`
- Install AWS IoT SDK in your backend

**Publisher (Your Backend → Device):**

```javascript
// Immediately after NotifyURL confirms payment success
import {
  IoTDataPlaneClient,
  PublishCommand,
} from '@aws-sdk/client-iot-data-plane'

const client = new IoTDataPlaneClient({ region: 'us-east-1' })

const payload = {
  request_id: 'tx_12345678', // From your transaction ID
  cells: [1, 5], // Cells user purchased
  timestamp: Math.floor(Date.now() / 1000),
}

await client.send(
  new PublishCommand({
    topic: `cmd/${thingID}/unlock`,
    payload: JSON.stringify(payload),
    qos: 1, // At least once delivery
  }),
)
```

**Subscriber (Device → Your Backend):**

```javascript
// Subscribe to all machines using wildcards
const doorTopic = 'state/+/door';
const heartbeatTopic = 'state/+/heartbeat';

// Door status handler
function handleDoorStatus(topic, message) {
  const thingID = topic.split('/')[1];  // Extract from state/{thing_id}/door
  const data = JSON.parse(message);

  // data = { cell: 1, state: "open", timestamp: 1678888900 }
  // or    { cell: 1, state: "closed", timestamp: 1678888905 }
  // or    { cell: 1, state: "jammed", timestamp: 1678888910 }

  if (data.state === 'jammed') {
    // Update database
    await updateMachineStatus(thingID, 'jammed');
    // Log to maintenance_logs table
    await logMaintenanceAlert(thingID, data.cell, 'Door jammed');
  }

  // Log all door events for audit trail
  await logDoorEvent(thingID, data.cell, data.state, data.timestamp);
}

// Heartbeat handler
function handleHeartbeat(topic, message) {
  const thingID = topic.split('/')[1];
  const data = JSON.parse(message);

  // data = { status: "online", uptime: 3600, rssi: -65 }

  // Update last_heartbeat timestamp
  await updateMachineHeartbeat(thingID, Date.now());
  await updateMachineStatus(thingID, 'online');
}

// Background job: Check for stale heartbeats every 60 seconds
setInterval(async () => {
  const machines = await getAllMachines();
  const now = Date.now();

  for (const machine of machines) {
    const timeSinceHeartbeat = now - machine.last_heartbeat;
    if (timeSinceHeartbeat > 90000) {  // 90 seconds
      await updateMachineStatus(machine.thing_id, 'offline');
    }
  }
}, 60000);
```

#### D. Jammed Door Logic

**When receiving `"state": "jammed"` from device:**

1. Update `machines.status` = 'jammed' in database
2. Create maintenance alert in admin portal:
   - Machine ID
   - Cell number
   - Timestamp
   - Status: 'pending'
3. **No automatic refund** - requires staff review
4. Staff manually:
   - Reviews transaction
   - Physically inspects machine
   - Processes refund if needed via payment gateway
   - Clears 'jammed' flag in admin portal
   - Updates maintenance alert status to 'resolved'

**Admin Portal Jammed Machine View:**

- List of all jammed machines
- Transaction details related to jam
- Button to "Mark as Resolved" (requires reason note)
- Refund initiation link (opens payment gateway interface)

---

## Database Schema (PostgreSQL)

```sql
-- 1. Stores (The Chains)
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Locations (Specific Sites)
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    store_id INT REFERENCES stores(id),
    name VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Machines (The Physical Devices)
CREATE TABLE machines (
    id SERIAL PRIMARY KEY,
    location_id INT REFERENCES locations(id),
    thing_id VARCHAR(255) UNIQUE NOT NULL, -- e.g., "machine_01"
    status VARCHAR(50) DEFAULT 'online', -- 'online', 'offline', 'jammed'
    last_heartbeat BIGINT, -- Unix timestamp in milliseconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Products (Global Catalog) - OPTIONAL REFERENCE
-- This table can be used as a template library for admins
-- But actual cell configuration is stored directly in inventory table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    suggested_price DECIMAL(10, 2),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Inventory (Cell Configuration per Machine)
-- IMPORTANT: Each machine has exactly 5 cells
-- Each cell is "all or nothing" - when opened, user gets everything inside
-- Admins can configure each cell independently via admin portal
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    machine_id INT REFERENCES machines(id),
    cell_number INT NOT NULL, -- 1 to 5 (each machine has 5 cells)

    -- Cell Configuration (Admin can change these anytime)
    product_name VARCHAR(255), -- e.g., "Snack Box A", "Drink Bundle"
    product_description TEXT, -- e.g., "Includes: 2 chips, 1 chocolate, 1 cookie"
    price DECIMAL(10, 2), -- Price for this specific cell
    image_url TEXT, -- Product image displayed on shopping page

    -- Availability
    stock_available BOOLEAN DEFAULT false, -- true = has items, false = empty/sold
    last_restocked TIMESTAMP,

    UNIQUE(machine_id, cell_number)
);

-- 6. Staff / Admins (Internal Only)
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20), -- 'super_admin', 'store_admin', 'location_admin'
    store_id INT REFERENCES stores(id), -- NULL for super_admin
    location_id INT REFERENCES locations(id), -- NULL for super_admin and store_admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Transactions (Sales Log)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    machine_id INT REFERENCES machines(id),
    total_amount DECIMAL(10, 2),
    payment_reference_id VARCHAR(255), -- NewebPay TradeNo
    payment_status VARCHAR(20), -- 'pending', 'paid', 'failed', 'refunded'
    request_id VARCHAR(255) UNIQUE, -- Your internal transaction ID
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Transaction Items (Sold Items Detail)
-- Snapshot of cell configuration at time of purchase
CREATE TABLE transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INT REFERENCES transactions(id),
    cell_number INT,
    product_name VARCHAR(255), -- Snapshot: what was displayed at purchase time
    product_description TEXT, -- Snapshot: what items were listed
    price_at_purchase DECIMAL(10, 2), -- Snapshot: price at purchase time
    image_url TEXT -- Snapshot: image at purchase time
);

-- 9. Maintenance Logs (For Jammed Machines)
CREATE TABLE maintenance_logs (
    id SERIAL PRIMARY KEY,
    machine_id INT REFERENCES machines(id),
    cell_number INT,
    issue_type VARCHAR(50), -- 'jammed', 'low_stock', 'other'
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'resolved'
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by INT REFERENCES staff(id),
    resolution_notes TEXT
);

-- 10. Door Events Log (Audit Trail)
CREATE TABLE door_events (
    id SERIAL PRIMARY KEY,
    machine_id INT REFERENCES machines(id),
    cell_number INT,
    event_type VARCHAR(20), -- 'open', 'closed', 'jammed'
    transaction_id INT REFERENCES transactions(id), -- Can be NULL for manual operations
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Shopping Sessions (Server-Side Session Storage)
CREATE TABLE shopping_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    thing_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    cell_prices JSONB, -- Locked prices: {"1": 50, "2": 30, ...}
    selected_cells INT[], -- User's cart (optional)
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_machines_thing_id ON machines(thing_id);
CREATE INDEX idx_machines_status ON machines(status);
CREATE INDEX idx_inventory_machine_id ON inventory(machine_id);
CREATE INDEX idx_transactions_machine_id ON transactions(machine_id);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX idx_transactions_payment_status ON transactions(payment_status);
CREATE INDEX idx_maintenance_logs_status ON maintenance_logs(status);
CREATE INDEX idx_door_events_machine_id ON door_events(machine_id);
CREATE INDEX idx_shopping_sessions_expires_at ON shopping_sessions(expires_at);
CREATE INDEX idx_shopping_sessions_thing_id ON shopping_sessions(thing_id);
```

---

## Complete Shopping Flow

1. **User scans QR code** → Opens `https://domain.com/shop?thingID=machine_01`
2. **Backend validates session:**
   - Check for valid session cookie
   - If no cookie or expired → Create new session with 30-min cookie
   - If valid → Proceed
3. **Backend fetches inventory** for that machine → Returns available products with stock counts
4. **User selects items** (e.g., Cell 1, Cell 5)
5. **User clicks "Checkout"**
6. **Backend creates pending transaction:**
   - Insert into `transactions` table (status: 'pending')
   - Insert into `transaction_items` table
   - Generate unique `request_id`
7. **Backend generates NewebPay payment request:**
   - Encrypt payment data (AES256)
   - Generate signature (SHA256)
   - Redirect user to NewebPay payment page
8. **User completes payment on NewebPay**
9. **NewebPay sends webhook to NotifyURL (Server-to-Server):**
   - Backend decrypts payload
   - Verifies signature
   - Updates transaction status to 'paid'
   - **Immediately publishes MQTT unlock command:**
     ```
     Topic: cmd/machine_01/unlock
     Payload: {"request_id": "tx_123", "cells": [1, 5], "timestamp": 1678888888}
     ```
   - Decrements `stock_count` in `inventory` table (trust-based)
   - Returns HTTP 200 to NewebPay
10. **Device receives unlock command** → Activates solenoids for cells 1 & 5
11. **Device reports back:**
    - Success: Publishes `state/machine_01/door` with `{"cell": 1, "state": "open"}`
    - Failure: Publishes `state/machine_01/door` with `{"cell": 1, "state": "jammed"}`
12. **Backend logs door events** and handles jammed status if needed
13. **User redirected to ReturnURL** → Shows success page

---

## Admin Portal Flow

### Staff Login

1. Staff enters email/password
2. Backend validates credentials against `staff` table
3. Create session with role and access scope
4. Redirect to appropriate dashboard based on role

### Dashboard Views (Role-Based)

**Super Admin:**

- See all stores, locations, machines
- Full access to all features

**Store Admin:**

- See only `store_id` matching their assignment
- All locations and machines under that store
- Limited to store-level operations

**Location Admin:**

- See only `location_id` matching their assignment
- Only machines at that location
- Limited to location-level operations

## Admin Portal Features & Workflows

### Authentication & Session Management

**Login:**

- Email + password authentication
- Sessions last 8 hours (auto-logout after inactivity)
- Multi-device login allowed (staff can use desktop + tablet simultaneously)
- Last login timestamp tracked

**Password Management:**

- Auto-generated passwords: 12 characters (uppercase, lowercase, numbers, special chars)
- Example: `Xy9#mK2pL!qR`
- Only admins can reset passwords (staff cannot change their own)
- Password shown ONCE after generation/reset

---

### Dashboard by Role

#### Super Admin Dashboard

**Overview Cards:**

- Total Stores / Locations / Machines
- System-wide revenue (today / this week / this month)
- Active transactions today
- Machines offline/jammed count

**Widgets:**

- **Top Performing Machines** (by revenue, last 7 days)
- **Recent Transactions** (last 10, across all stores)
- **Pending Maintenance Alerts** (jammed machines, MQTT failures)
- **System Health** (machines online vs offline chart)

**Quick Actions:**

- Create Store
- Create Store Admin
- View All Transactions
- System Settings

---

#### Store Admin Dashboard

**Overview Cards:**

- My Stores count
- Total Machines across my stores
- Revenue for my stores (today / this week / this month)
- Machines needing attention

**Widgets:**

- **Machines Status** (online/offline/jammed per location)
- **Recent Transactions** (for my stores)
- **Inventory Alerts** (low stock warnings)
- **Top Selling Products** (across my stores)

**Quick Actions:**

- Create Location
- Create Location Admin / Staff
- View Reports for My Stores
- Manage Product Templates

---

#### Location Admin Dashboard

**Overview Cards:**

- My Locations count
- Total Machines at my locations
- Revenue for my locations (today / this week)
- Machines online count

**Widgets:**

- **Machines List** (with status indicators)
- **Recent Transactions** (for my locations)
- **Maintenance Alerts** (for my machines)
- **Today's Sales by Machine**

**Quick Actions:**

- Create Staff
- Restock Machines
- View Inventory Status
- Resolve Maintenance Issues

---

#### Staff Dashboard

**Overview Cards:**

- My Locations
- Machines I manage
- Today's transactions (read-only)

**Widgets:**

- **Machines Status** (simple list)
- **Pending Maintenance** (issues I can resolve)
- **Recent Activity Log** (my actions)

**Quick Actions:**

- Restock Machine
- Mark Maintenance Resolved
- View Machine Status

**Auto-Refresh:** All dashboards poll every 60 seconds for updates

---

### Store Management (Super Admin Only)

#### Store List View

**Columns:**

- Store Name
- Contact Info (email, phone)
- Locations Count
- Machines Count
- Status (Active / Inactive)
- Payment Setup (✅ Configured / ⚠️ Missing NewebPay credentials)
- Actions: [Edit] [Deactivate] [View Details]

**[+ Create Store] Button**

#### Create/Edit Store Form

**Fields:**

- Store Name: [Text input] (required)
- Contact Email: [Email input] (optional)
- Contact Phone: [Text input] (optional)
- Address: [Textarea] (optional)
- Store Image: [File upload to S3] (optional)
- Status: [Dropdown] Active / Inactive (default: Active)

**Payment Gateway Configuration (collapsible section):**

- NewebPay Merchant ID: [Text input]
- NewebPay Hash Key: [Text input, masked]
- NewebPay Hash IV: [Text input, masked]
- Mode: [Radio buttons] Sandbox / Production (default: Sandbox)
- Payment Methods: [Checkboxes] Credit Card (✅) / LinePay (✅)

**Validation:**

- Store name required
- NewebPay credentials optional (can configure later)
- If credentials provided, validate format

**Deletion Rules:**

- Cannot delete store if it has locations
- Must move/delete all locations first
- Show error: "Cannot delete store with existing locations"

---

### Location Management

#### Location List View (filtered by user role)

**Columns:**

- Location Name
- Store
- Address
- Machines Count
- Status (Active / Inactive)
- Actions: [Edit] [Deactivate] [View Machines]

**Filters:**

- Store (dropdown - super admin sees all, store admin sees theirs)
- Status (All / Active / Inactive)

**[+ Create Location] Button**

#### Create/Edit Location Form

**Fields:**

- Store: [Dropdown] (filtered by permissions)
- Location Name: [Text input] (required)
- Address: [Textarea]
- Contact Phone: [Text input]
- Operating Hours: [Text input] (e.g., "9:00-22:00" or JSON editor)
- Latitude: [Number input] (optional, for maps)
- Longitude: [Number input] (optional)
- Status: [Dropdown] Active / Inactive (default: Active)

**Deletion Rules:**

- Cannot delete location if it has machines
- Must remove/relocate all machines first

---

### Machine Management

#### Machine List View (filtered by user permissions)

**Columns:**

- Thing ID
- Display Name
- Location
- Status (🟢 Online / 🔴 Offline / 🟡 Jammed)
- Last Heartbeat (time ago)
- Cells Available (e.g., "3/5")
- Actions: [View] [Edit] [Manage Inventory] [Deactivate]

**Filters:**

- Location (dropdown)
- Status (All / Online / Offline / Jammed)
- Search by Thing ID or Display Name

**Status Indicators:**

- 🟢 Online: Last heartbeat < 90 seconds ago
- 🔴 Offline: Last heartbeat > 90 seconds ago
- 🟡 Jammed: Has pending maintenance issues

**[+ Add Machine] Button**

#### Add Machine Form

**Fields:**

- Location: [Dropdown] (filtered by permissions)
- Thing ID: [Text input] (required, unique, e.g., "machine_01")
  - Validation: Must match Thing created in AWS IoT Core
  - Help text: "This must match the Thing ID in AWS IoT Core"
- Display Name: [Text input] (e.g., "Lobby Machine", "2nd Floor Unit")
- Notes: [Textarea] (admin comments, maintenance history)

**On Submit:**

1. Create machine record
2. **DO NOT** auto-create inventory rows (admin must configure cells manually)
3. Initial status: 'offline' (until first heartbeat received)
4. Show success message with link to [Manage Inventory]

#### Edit Machine

- Can update: Display Name, Notes, Location
- Cannot update: Thing ID (immutable)

#### Deactivate Machine

- Sets `is_active = false`
- Machine hidden from shopping page
- Still visible in admin (with "Inactive" badge)
- Historical transactions preserved
- Can reactivate later

**Deletion:** Not allowed (preserve transaction history)

---

### Inventory Management

#### Inventory Page

**Navigation:** Machines → [Select Machine] → Manage Inventory

**Layout: Table View**

| Cell | Product Name     | Description          | Price   | Image | Stock Status | Last Restocked | Actions          |
| ---- | ---------------- | -------------------- | ------- | ----- | ------------ | -------------- | ---------------- |
| 1    | Snack Box A      | 2 chips, 1 chocolate | 50 NTD  | 🖼️    | ✅ Available | 2h ago         | [Edit] [Restock] |
| 2    | (Not configured) | -                    | -       | -     | ❌ Empty     | -              | [Configure]      |
| 3    | Drink Bundle     | 2 Coke, 1 Tea        | 30 NTD  | 🖼️    | ❌ Sold Out  | 1 day ago      | [Edit] [Restock] |
| 4    | (Not configured) | -                    | -       | -     | ❌ Empty     | -              | [Configure]      |
| 5    | Premium Box      | Imported snacks      | 200 NTD | 🖼️    | ✅ Available | 3h ago         | [Edit] [Restock] |

**Bulk Actions (top of table):**

- [Mark All as Sold Out] - Quick disable for maintenance
- [Copy from Another Machine] - Duplicate configuration
- [Apply Template to All Cells] - Batch configure

#### Configure/Edit Cell Modal

**Form Fields:**

- **Product Name:** [Text input] (required)
- **Description:** [Textarea] (list items included)
- **Price:** [Number input] NTD (required, min: 0.01)
  - Validation: Must be greater than 0
- **Image:**
  - [File Upload] → Uploads to S3
  - Shows preview after upload
  - Stores: `image_url` (S3 URL), `image_filename`
- **Stock Status:** [Toggle Switch] Available ✅ / Sold Out ❌

**[Apply Template] Button** (opens template selector)

**Actions:**

- [Save Changes] - Update inventory record
- [Save & Mark as Restocked] - Update + set `last_restocked = NOW()`
- [Cancel]

**Backend Updates:**

```sql
UPDATE inventory
SET product_name = $1,
    product_description = $2,
    price = $3,
    image_url = $4,
    image_filename = $5,
    stock_available = $6,
    last_restocked = CASE WHEN $7 THEN NOW() ELSE last_restocked END
WHERE machine_id = $8 AND cell_number = $9;
```

#### Quick Restock Action

**From table row, click [Restock]:**

1. Confirmation modal: "Mark Cell X as restocked?"
2. Backend: `UPDATE inventory SET stock_available = true, last_restocked = NOW()`
3. Log to audit_logs: `action = 'inventory_restocked'`
4. Show success toast

#### Copy Configuration from Another Machine

**Flow:**

1. Click [Copy from Another Machine]
2. Modal: Select source machine (dropdown filtered by same store/location)
3. Preview: Shows source machine's 5 cells configuration
4. Options:
   - [Copy All Cells] - Overwrites all 5 cells
   - [Select Cells to Copy] - Choose specific cells
5. Confirmation: "This will overwrite current configuration"
6. Submit → Copies product_name, description, price, image_url (NOT stock_available)

---

### Product Template Management

#### Template List View (Store-specific)

**Navigation:** Settings → Product Templates

**Columns:**

- Template Name
- Suggested Price
- Thumbnail
- Used in X machines (calculated)
- Created Date
- Actions: [Edit] [Delete] [Preview]

**[+ Create Template] Button**

#### Create/Edit Template Form

**Fields:**

- Store: [Dropdown] (auto-filled based on user's permissions)
- Template Name: [Text input] (required)
- Description: [Textarea]
- Suggested Price: [Number input] NTD
- Image: [File upload to S3]

**Deletion:**

- Warning if template is used in machines: "This template is used in X machines"
- Allow deletion (doesn't affect existing inventory, just removes template)

#### Apply Template to Cell

**From inventory edit modal:**

1. Click [Apply Template]
2. Modal shows list of templates (filtered by store)
3. Preview on hover (shows name, description, image, price)
4. Click template → Auto-fills form fields
5. Admin can still edit before saving
6. [Apply] button → Closes template selector, returns to edit form

---

### Transaction Management

#### Transaction List View

**Columns:**

- Transaction ID (clickable)
- Date & Time
- Machine (Thing ID + Display Name)
- Items (e.g., "Cells: 1, 3")
- Amount (NTD)
- Status Badge:
  - 🟢 Paid (green)
  - 🔴 Failed (red)
  - 🟠 Refunded (orange)
  - ⏳ Pending (gray)
- Actions: [View Details] [Refund]

**Filters (top of page):**

- Date Range: [Date picker] (default: last 7 days)
  - Presets: Today / Last 7 days / Last 30 days / This Month / Custom
- Machine: [Dropdown] (filtered by permissions)
- Status: [Dropdown] All / Paid / Failed / Refunded / Pending
- Search: [Text input] (by request_id or payment_reference_id)

**Export:**

- [Export to CSV] button (exports filtered results)

**Pagination:** 50 transactions per page

#### Transaction Detail View

**Overview Card:**

- Transaction ID
- Request ID
- Date & Time
- Machine (with link to machine page)
- Total Amount
- Payment Status (large badge)
- Payment Method (Credit Card / LinePay)
- Payment Reference ID (NewebPay's TradeNo)

**Items Purchased:**
| Cell | Product | Price | Status |
|------|---------|-------|--------|
| 1 | Snack Box A | 50 NTD | ✅ Opened |
| 3 | Drink Bundle | 30 NTD | 🟡 Jammed |

**Customer Information:**

- IP Address (for fraud detection)
- User Agent (browser/device info)
- Session ID (link to session if still exists)

**Related Events:**

- **Door Events:**
  - Cell 1: Opened at 14:30:15
  - Cell 1: Closed at 14:30:45
  - Cell 3: Jammed at 14:30:20 (⚠️ Failed to open)

- **Maintenance Logs:**
  - Cell 3: Jammed door - Status: Pending
  - Link to maintenance log

- **MQTT Events:**
  - Unlock command sent at 14:30:10
  - If failed: "MQTT unlock failed" with error details

**Refund History (if refunded):**

- Refunded Amount: 30 NTD (partial)
- Refunded At: 2024-01-15 15:00
- Refunded By: admin@example.com
- Reason: Door jammed
- Notes: "Cell 3 failed to open, refunded customer for that cell only"

**Actions (shown based on status):**

- **If status = 'paid':** [Process Refund] button
- **If MQTT failed (check audit_logs):** [Retry Unlock] button
- **If status = 'pending' for > 1 hour:** [Cancel Transaction] button (mark as failed)

#### Process Refund Workflow

**Step 1: Refund Type Selection**
Modal opens with two options:

- 🔵 **Full Refund** (entire transaction amount)
- 🟡 **Partial Refund** (select specific cells)

**If Partial Refund Selected:**

- Show checklist of cells from this transaction
- Select which cells to refund
- Calculate refund amount (sum of selected cell prices)

**Step 2: Refund Details Form**

- **Refund Amount:** [Display only] 30 NTD (calculated)
- **Reason:** [Dropdown] (required)
  - Item not received
  - Door jammed
  - Customer complaint
  - Wrong item
  - Machine malfunction
  - Other
- **Notes:** [Textarea] (optional, admin comments)

**Step 3: Confirmation**

- Summary display:

  ```
  Transaction: #12345
  Original Amount: 100 NTD
  Refund Amount: 30 NTD
  Reason: Door jammed

  This action cannot be undone.
  Note: You must process the actual refund via NewebPay merchant portal separately.
  ```

- [Confirm Refund] button

**Step 4: Processing**

```javascript
// Backend
await db.query(
  `
  UPDATE transactions 
  SET payment_status = 'refunded',
      refunded_at = NOW(),
      refunded_by = $1,
      refund_amount = $2,
      refund_reason = $3
  WHERE id = $4
`,
  [currentStaffId, refundAmount, reason, transactionId],
)

// Log to audit
await db.query(
  `
  INSERT INTO audit_logs 
  (staff_id, action, resource_type, resource_id, details)
  VALUES ($1, 'transaction_refunded', 'transaction', $2, $3)
`,
  [
    currentStaffId,
    transactionId,
    JSON.stringify({
      refund_amount: refundAmount,
      reason: reason,
      notes: notes,
      cells_refunded: selectedCells,
    }),
  ],
)
```

**Step 5: Success Message**

```
✅ Transaction marked as refunded
⚠️ Important: Process the actual refund via NewebPay merchant portal:
   1. Login to NewebPay
   2. Navigate to Transactions
   3. Find TradeNo: 20240115001
   4. Process refund of 30 NTD
```

---

### Maintenance Management

#### Maintenance Dashboard

**Navigation:** Maintenance → All Issues

**Filters:**

- Status: [Tabs] All / Pending / Resolved
- Issue Type: [Dropdown] All / Jammed / Other
- Date Range: [Date picker]
- Machine: [Dropdown] (filtered by permissions)

**List View:**
| Priority | Machine | Cell | Issue | Reported | Transaction | Status | Assigned To | Actions |
|----------|---------|------|-------|----------|-------------|--------|-------------|---------|
| 🔴 High | Lobby Machine | 3 | Door jammed | 2h ago | #12345 | Pending | - | [Resolve] [View] |
| 🟡 Medium | 2F Unit | - | MQTT failure | 1 day ago | #12340 | Pending | John | [Resolve] [View] |
| 🟢 Low | Cafe Machine | 2 | Manual report | 3 days ago | - | Resolved | Jane | [View] |

**Priority Calculation:**

- 🔴 High: Jammed after payment (has transaction_id)
- 🟡 Medium: MQTT failures, other issues with transaction
- 🟢 Low: Manual reports, no transaction impact

**[+ Report Issue] Button** (manual issue creation)

#### Report Issue Form (Manual)

**Fields:**

- Machine: [Dropdown]
- Cell Number: [Dropdown] 1-5 or "N/A"
- Issue Type: [Dropdown] Jammed / Network Issue / Hardware Failure / Other
- Description: [Textarea] (required)
- [Submit]

**Backend:**

```sql
INSERT INTO maintenance_logs
(machine_id, cell_number, issue_type, description, status, reported_at)
VALUES ($1, $2, $3, $4, 'pending', NOW());
```

#### Resolve Maintenance Issue

**Modal/Page:**

- **Issue Details:** (display only)
  - Machine, Cell, Issue Type, Description
  - Reported Date
  - Related Transaction (if any)

- **Resolution Form:**
  - **Resolution Notes:** [Textarea] (required)
    - "What did you do to fix this issue?"
    - Minimum 10 characters
  - **[Mark as Resolved]** button

**Backend:**

```javascript
// Update maintenance log
await db.query(
  `
  UPDATE maintenance_logs 
  SET status = 'resolved',
      resolved_at = NOW(),
      resolved_by = $1,
      resolution_notes = $2
  WHERE id = $3
`,
  [currentStaffId, notes, maintenanceLogId],
)

// Check if machine should be set back to 'online'
const pendingIssues = await db.query(
  `
  SELECT COUNT(*) FROM maintenance_logs 
  WHERE machine_id = $1 AND status = 'pending'
`,
  [machineId],
)

if (pendingIssues.rows[0].count === 0) {
  // No more pending issues, check heartbeat
  const machine = await db.query(
    'SELECT last_heartbeat FROM machines WHERE id = $1',
    [machineId],
  )

  const timeSinceHeartbeat = Date.now() - machine.rows[0].last_heartbeat

  if (timeSinceHeartbeat < 90000) {
    // Machine is online, update status
    await db.query('UPDATE machines SET status = $1 WHERE id = $2', [
      'online',
      machineId,
    ])
  }
}

// Log to audit
await db.query(
  `
  INSERT INTO audit_logs 
  (staff_id, action, resource_type, resource_id, details)
  VALUES ($1, 'maintenance_resolved', 'maintenance_log', $2, $3)
`,
  [currentStaffId, maintenanceLogId, JSON.stringify({ notes })],
)
```

**Success Message:**

```
✅ Maintenance issue resolved
Machine status updated to: Online
```

---

### Staff Management

#### Staff List View (filtered by permissions)

**Super Admin sees:** All staff
**Store Admin sees:** Location admins and staff for their stores
**Location Admin sees:** Staff for their locations

**Columns:**

- Email
- Role (colored badge: Super Admin, Store Admin, Location Admin, Staff)
- Assigned To (store/location names)
- Status (🟢 Active / 🔴 Inactive)
- Last Login (time ago)
- Created By
- Actions: [Edit] [Reset Password] [Deactivate] [View Activity]

**Filters:**

- Role: [Dropdown] All / Super Admin / Store Admin / Location Admin / Staff
- Status: [Dropdown] All / Active / Inactive
- Search: [Text input] (by email)

**[+ Create Staff Account] Button**

#### Create Staff Account

**Form:**

1. **Email:** [Email input] (required, must be unique)
   - Validation: Valid email format, not already in system

2. **Role:** [Dropdown] (required)
   - Super Admin (only super admin can create)
   - Store Admin
   - Location Admin
   - Staff

3. **Assign to Stores:** [Multi-select dropdown]
   - Only shown if role = Store Admin or Location Admin
   - Store Admin: Can manage multiple stores
   - Filtered by current user's permissions

4. **Assign to Locations:** [Multi-select dropdown]
   - Only shown if role = Location Admin or Staff
   - Can assign to multiple locations
   - Filtered by selected stores (if applicable)

5. **[Create Account]** button

**Backend Process:**

```javascript
// 1. Generate random password
const password = generatePassword(12) // Xy9#mK2pL!qR
const hashedPassword = await bcrypt.hash(password, 10)

// 2. Create staff record
const staff = await db.query(
  `
  INSERT INTO staff 
  (email, password_hash, role_id, is_active, created_by)
  VALUES ($1, $2, (SELECT id FROM roles WHERE name = $3), true, $4)
  RETURNING id
`,
  [email, hashedPassword, roleName, currentStaffId],
)

// 3. Assign to stores (if applicable)
if (selectedStores.length > 0) {
  for (const storeId of selectedStores) {
    await db.query(
      'INSERT INTO staff_stores (staff_id, store_id) VALUES ($1, $2)',
      [staff.rows[0].id, storeId],
    )
  }
}

// 4. Assign to locations (if applicable)
if (selectedLocations.length > 0) {
  for (const locationId of selectedLocations) {
    await db.query(
      'INSERT INTO staff_locations (staff_id, location_id) VALUES ($1, $2)',
      [staff.rows[0].id, locationId],
    )
  }
}

// 5. Log to audit
await db.query(
  `
  INSERT INTO audit_logs 
  (staff_id, action, resource_type, resource_id, details)
  VALUES ($1, 'staff_created', 'staff', $2, $3)
`,
  [currentStaffId, staff.rows[0].id, JSON.stringify({ email, role: roleName })],
)
```

**Success Modal:**

```
✅ Staff account created successfully

Email: newuser@example.com
Role: Location Admin
Temporary Password: Xy9#mK2pL!qR

⚠️ Important:
- Copy this password now (it won't be shown again)
- Communicate this password securely to the new user
- User cannot change this password themselves

[Copy Password] [Close]
```

#### Edit Staff Account

**Editable Fields:**

- Email
- Role
- Store assignments
- Location assignments
- Status (Active / Inactive)

**Non-editable:**

- Password (use Reset Password instead)
- Created By
- Created Date

#### Reset Password

**From staff list, click [Reset Password]:**

**Confirmation Modal:**

```
Reset password for user@example.com?

A new random password will be generated.
The current password will be invalidated immediately.
You must communicate the new password to this user.

[Cancel] [Reset Password]
```

**Backend:**

```javascript
// Generate new password
const newPassword = generatePassword(12)
const hashedPassword = await bcrypt.hash(newPassword, 10)

// Update password
await db.query(
  'UPDATE staff SET password_hash = $1, updated_at = NOW() WHERE id = $2',
  [hashedPassword, staffId],
)

// Log action
await db.query(
  `
  INSERT INTO audit_logs 
  (staff_id, action, resource_type, resource_id, details)
  VALUES ($1, 'password_reset', 'staff', $2, $3)
`,
  [
    currentStaffId,
    staffId,
    JSON.stringify({
      reset_by: currentStaffEmail,
      reset_for: targetStaffEmail,
    }),
  ],
)
```

**Success Modal:**

```
✅ Password reset successful

New Password: Kp8!xR3nM#vQ

⚠️ Copy this password now (it won't be shown again)

[Copy Password] [Close]
```

---

### Reports & Analytics

#### Sales Reports

**Navigation:** Reports → Sales

**Report Types (Tabs):**

1. Daily Summary
2. Top Products
3. Machine Performance
4. Hourly Pattern

#### 1. Daily Sales Summary

**Filters:**

- Date Range: [Date picker]
- Group By: [Dropdown] Store / Location / Machine / None
- Store: [Dropdown] (if grouping by location/machine)
- Location: [Dropdown] (if grouping by machine)

**Metrics Display:**

- Total Revenue (large number with currency)
- Transaction Count
- Average Transaction Value
- Success Rate (paid transactions / total transactions %)

**Table View:**
| Date | Revenue | Transactions | Avg Value | Success Rate |
|------|---------|--------------|-----------|--------------|
| 2024-01-15 | 5,000 NTD | 100 | 50 NTD | 95% |
| 2024-01-14 | 4,500 NTD | 90 | 50 NTD | 93% |

**Chart:** Line chart showing revenue over time

**[Export to CSV]** button

#### 2. Top Products Report

**Filters:**

- Date Range
- Store/Location (filtered by permissions)
- Sort By: Revenue / Quantity Sold / Frequency

**Table:**
| Product Name | Quantity Sold | Total Revenue | Avg Price | % of Sales |
|--------------|---------------|---------------|-----------|------------|
| Snack Box A | 150 | 7,500 NTD | 50 NTD | 30% |
| Drink Bundle | 120 | 3,600 NTD | 30 NTD | 15% |

**Chart:** Bar chart showing top 10 products

#### 3. Machine Performance Report

**Filters:**

- Date Range
- Store/Location
- Sort By: Revenue / Transaction Count / Failure Rate

**Table:**
| Machine | Location | Revenue | Transactions | Failures | Failure Rate | Uptime % |
|---------|----------|---------|--------------|----------|--------------|----------|
| machine_01 | Lobby | 3,000 NTD | 60 | 2 | 3.3% | 99% |
| machine_02 | 2F | 2,500 NTD | 50 | 5 | 10% | 95% |

**Metrics:**

- Failure Rate = (Jammed doors / Total transactions) %
- Uptime % = (Online time / Total time) %

**Chart:** Horizontal bar chart comparing machine revenue

#### 4. Hourly Sales Pattern

**Purpose:** Identify peak hours for restocking schedule

**Filters:**

- Date Range
- Day of Week: [Checkboxes] Mon-Sun
- Store/Location

**Table:**
| Hour | Transactions | Revenue | Avg per Transaction |
|------|--------------|---------|---------------------|
| 09:00 | 5 | 250 NTD | 50 NTD |
| 10:00 | 12 | 600 NTD | 50 NTD |
| 11:00 | 20 | 1,000 NTD | 50 NTD |
| 12:00 | 35 | 1,750 NTD | 50 NTD | ← Peak

**Chart:** Line/bar chart showing transactions by hour

**Insights:**

- Peak hours highlighted in green
- Lowest hours highlighted in gray
- Recommendation: "Best time to restock: 09:00-10:00"

## Permission Checking & Access Control Implementation

### Permission Helper Functions

```javascript
/**
 * Check if staff has a specific permission
 */
async function hasPermission(staffId, permissionName) {
  const result = await db.query(
    `
    SELECT EXISTS (
      SELECT 1 FROM staff s
      JOIN role_permissions rp ON s.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE s.id = $1 
      AND s.is_active = true
      AND p.name = $2
    ) as has_permission
  `,
    [staffId, permissionName],
  )

  return result.rows[0].has_permission
}

/**
 * Check if staff can access a specific machine
 */
async function canAccessMachine(staffId, machineId) {
  const staff = await db.query(
    `
    SELECT s.*, r.name as role
    FROM staff s
    JOIN roles r ON s.role_id = r.id
    WHERE s.id = $1 AND s.is_active = true
  `,
    [staffId],
  )

  if (!staff.rows[0]) return false

  const role = staff.rows[0].role

  // Super admin can access everything
  if (role === 'super_admin') return true

  // Get machine's location and store
  const machine = await db.query(
    `
    SELECT m.location_id, l.store_id
    FROM machines m
    JOIN locations l ON m.location_id = l.id
    WHERE m.id = $1
  `,
    [machineId],
  )

  if (!machine.rows[0]) return false

  const { location_id, store_id } = machine.rows[0]

  // Store admin: check if machine's store is in their assigned stores
  if (role === 'store_admin') {
    const hasAccess = await db.query(
      `
      SELECT EXISTS (
        SELECT 1 FROM staff_stores
        WHERE staff_id = $1 AND store_id = $2
      ) as has_access
    `,
      [staffId, store_id],
    )

    return hasAccess.rows[0].has_access
  }

  // Location admin or staff: check if machine's location is in their assigned locations
  if (role === 'location_admin' || role === 'staff') {
    const hasAccess = await db.query(
      `
      SELECT EXISTS (
        SELECT 1 FROM staff_locations
        WHERE staff_id = $1 AND location_id = $2
      ) as has_access
    `,
      [staffId, location_id],
    )

    return hasAccess.rows[0].has_access
  }

  return false
}

/**
 * Check if staff can access a specific store
 */
async function canAccessStore(staffId, storeId) {
  const staff = await db.query(
    `
    SELECT r.name as role
    FROM staff s
    JOIN roles r ON s.role_id = r.id
    WHERE s.id = $1 AND s.is_active = true
  `,
    [staffId],
  )

  if (!staff.rows[0]) return false

  // Super admin can access everything
  if (staff.rows[0].role === 'super_admin') return true

  // Check if store is in assigned stores
  const hasAccess = await db.query(
    `
    SELECT EXISTS (
      SELECT 1 FROM staff_stores
      WHERE staff_id = $1 AND store_id = $2
    ) as has_access
  `,
    [staffId, storeId],
  )

  return hasAccess.rows[0].has_access
}

/**
 * Middleware: Require permission
 */
function requirePermission(permissionName) {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const allowed = await hasPermission(req.user.id, permissionName)

    if (!allowed) {
      return res.status(403).json({
        error: 'Permission denied',
        required: permissionName,
      })
    }

    next()
  }
}

/**
 * Middleware: Require machine access
 */
function requireMachineAccess() {
  return async (req, res, next) => {
    const machineId =
      req.params.machineId || req.params.id || req.body.machine_id

    if (!machineId) {
      return res.status(400).json({ error: 'Machine ID required' })
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const allowed = await canAccessMachine(req.user.id, machineId)

    if (!allowed) {
      return res.status(403).json({
        error: 'You do not have access to this machine',
      })
    }

    next()
  }
}
```

### Example: Protected Admin Endpoints

```javascript
// Transaction refund - requires permission AND transaction access
app.post(
  '/api/admin/transactions/:id/refund',
  authenticateStaff,
  requirePermission('transaction.refund'),
  async (req, res) => {
    const { id } = req.params
    const { refund_amount, reason, notes } = req.body

    // Get transaction
    const txn = await db.query('SELECT * FROM transactions WHERE id = $1', [id])

    if (!txn.rows[0]) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // Check if staff can access this transaction's machine
    if (!(await canAccessMachine(req.user.id, txn.rows[0].machine_id))) {
      return res.status(403).json({
        error: 'You cannot access this transaction',
      })
    }

    // Proceed with refund...
  },
)

// Inventory update - requires permission AND machine access
app.put(
  '/api/admin/inventory/:id',
  authenticateStaff,
  requirePermission('inventory.update'),
  async (req, res) => {
    const { id } = req.params

    // Get inventory item
    const inventory = await db.query(
      'SELECT machine_id FROM inventory WHERE id = $1',
      [id],
    )

    if (!inventory.rows[0]) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    // Check machine access
    if (!(await canAccessMachine(req.user.id, inventory.rows[0].machine_id))) {
      return res.status(403).json({
        error: 'You cannot access this machine',
      })
    }

    // Proceed with update...
  },
)

// Staff creation - requires permission AND scope check
app.post(
  '/api/admin/staff',
  authenticateStaff,
  requirePermission('staff.create'),
  async (req, res) => {
    const { email, role, store_ids, location_ids } = req.body

    // Store admins can only create location admins and staff
    const creator = await db.query(
      `
      SELECT r.name as role FROM staff s
      JOIN roles r ON s.role_id = r.id
      WHERE s.id = $1
    `,
      [req.user.id],
    )

    if (creator.rows[0].role === 'store_admin') {
      if (role === 'super_admin' || role === 'store_admin') {
        return res.status(403).json({
          error:
            'Store admins cannot create super admins or other store admins',
        })
      }

      // Verify store_ids are within their access
      for (const storeId of store_ids || []) {
        if (!(await canAccessStore(req.user.id, storeId))) {
          return res.status(403).json({
            error: `You cannot assign staff to store ${storeId}`,
          })
        }
      }
    }

    // Proceed with staff creation...
  },
)
```

---

## Backup & Disaster Recovery Strategy

### Database Backups (AWS RDS)

**Automated Backups:**

```
RDS Configuration:
- Backup retention period: 7 days
- Backup window: 02:00-03:00 UTC (off-peak hours)
- Automatic backup: Enabled
- Multi-AZ deployment: Recommended for production
```

**Manual Snapshots:**

```
Before major changes:
- Database schema updates
- Large data migrations
- System upgrades

Retention: 30 days for monthly snapshots
```

**Point-in-Time Recovery:**

- Enabled by default with automated backups
- Can restore to any point within retention period
- Useful for recovering from accidental data deletion

### S3 Backups

**Versioning:**

```bash
# Enable versioning on S3 bucket
aws s3api put-bucket-versioning \
  --bucket your-vending-images-bucket \
  --versioning-configuration Status=Enabled
```

**Lifecycle Policy:**

```json
{
  "Rules": [
    {
      "Id": "Archive old versions",
      "Status": "Enabled",
      "NoncurrentVersionTransitions": [
        {
          "NoncurrentDays": 30,
          "StorageClass": "GLACIER"
        }
      ],
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 90
      }
    }
  ]
}
```

### Transaction Data Archival

**Monthly Export to S3:**

```javascript
// Cron job: Run on 1st of each month
async function archiveTransactions() {
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  const year = lastMonth.getFullYear()
  const month = String(lastMonth.getMonth() + 1).padStart(2, '0')

  // Export transactions to JSON
  const transactions = await db.query(
    `
    SELECT 
      t.*,
      json_agg(ti.*) as items
    FROM transactions t
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    WHERE DATE_TRUNC('month', t.timestamp) = $1
    GROUP BY t.id
  `,
    [`${year}-${month}-01`],
  )

  const data = JSON.stringify(transactions.rows, null, 2)

  // Upload to S3
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: `archives/transactions_${year}_${month}.json`,
      Body: data,
      ContentType: 'application/json',
      StorageClass: 'GLACIER', // Cheaper for long-term storage
    }),
  )

  console.log(`📦 Archived transactions for ${year}-${month}`)
}
```

### Disaster Recovery Plan

**Recovery Time Objective (RTO):** 4 hours  
**Recovery Point Objective (RPO):** 1 hour (last backup)

**Recovery Steps:**

1. **Database:** Restore from latest RDS snapshot or point-in-time
2. **S3 Images:** Already durable (11 9's durability), enable versioning
3. **Application:** Redeploy from Git repository
4. **IoT Core:** Things and policies preserved (no data loss)
5. **Verification:** Run health checks and test critical flows

**Backup Checklist:**

- [ ] RDS automated backups enabled
- [ ] Monthly manual RDS snapshots
- [ ] S3 versioning enabled
- [ ] Monthly transaction data export to S3
- [ ] Git repository backup (GitHub/GitLab)
- [ ] Environment variables documented and backed up securely
- [ ] AWS IoT Core policies documented
- [ ] Test restore procedure quarterly

---

## My Profile & Notification Settings (All Users)

### My Profile Page

**Display:**

- Email (login)
- Role
- Assigned Stores/Locations
- Account Created Date
- Last Login
- Activity Summary (transactions processed, machines managed, etc.)

**Actions:**

- [View My Activity Log] (shows audit_logs for this user)
- [Configure Notifications] (opens notification preferences modal)

**Note:** Users cannot change their own password or email (admin must do it)

### Notification Preferences

**Settings Modal:**

```
Notification Preferences

Email Notifications
├─ Email Address: [john@example.com] (use login email)
│  OR
├─ Custom Email: [john.personal@gmail.com] (optional)
│
├─ Enabled: [✓]
│
└─ Alert Types:
   ├─ Machine Offline: [✓]
   ├─ Door Jammed: [✓]
   ├─ Payment Errors: [✓]
   ├─ Maintenance Resolved: [ ]
   └─ Daily Summary: [ ]

Browser Notifications
├─ Enabled: [✓] [Request Permission]
│
└─ Alert Types:
   ├─ New Maintenance Issue: [✓]
   ├─ Machine Back Online: [✓]
   ├─ Transaction Refunded: [ ]
   └─ Staff Account Changes: [ ]

[Save Preferences]
```

**Implementation:**

```javascript
// Update preferences endpoint
app.put(
  '/api/profile/notification-preferences',
  authenticateStaff,
  async (req, res) => {
    const {
      email_enabled,
      browser_enabled,
      machine_offline,
      door_jammed,
      payment_errors,
      daily_summary,
      maintenance_resolved,
    } = req.body

    await db.query(
      `
      INSERT INTO notification_preferences 
      (staff_id, email_enabled, browser_enabled, machine_offline, 
       door_jammed, payment_errors, daily_summary, maintenance_resolved)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (staff_id) 
      DO UPDATE SET
        email_enabled = EXCLUDED.email_enabled,
        browser_enabled = EXCLUDED.browser_enabled,
        machine_offline = EXCLUDED.machine_offline,
        door_jammed = EXCLUDED.door_jammed,
        payment_errors = EXCLUDED.payment_errors,
        daily_summary = EXCLUDED.daily_summary,
        maintenance_resolved = EXCLUDED.maintenance_resolved,
        updated_at = NOW()
    `,
      [
        req.user.id,
        email_enabled,
        browser_enabled,
        machine_offline,
        door_jammed,
        payment_errors,
        daily_summary,
        maintenance_resolved,
      ],
    )

    return res.json({ success: true })
  },
)
```

### Transaction Reports

1. Admin selects filters:
   - Date range
   - Machine/Location/Store
   - Payment status
2. Backend queries `transactions` and `transaction_items` tables
3. Display results with pagination
4. Export to CSV functionality

### Maintenance Alerts

1. Admin opens "Maintenance" tab
2. System shows all machines with status = 'jammed'
3. Admin clicks on machine → Views:
   - Recent transactions
   - Door event logs
   - Cell number that jammed
4. Admin physically inspects machine
5. Admin marks as resolved:
   - Updates `maintenance_logs.status` = 'resolved'
   - Updates `machines.status` = 'online'
   - Optionally processes refund via payment gateway

---

## Hardware Vendor Communication

### Send them this Interface Control Document (ICD):

---

# IoT Hardware Communication Specification

## 1. Connection Overview

- **Protocol:** MQTT over TLS/SSL (Port 443)
- **Broker:** AWS IoT Core
- **Identifier:** Each device must use its unique `Thing ID` (Client ID) when connecting
- **Variable:** `{thing_id}` refers to the unique ID assigned to the specific machine (e.g., `machine_01`, `machine_02`, ... `machine_50`)

---

## 2. Subscribe Topics (Commands received by Machine)

The machine **must subscribe** to the following topic to receive unlock commands from the server.

| Topic Name              | Direction        | QoS   | Description                      |
| :---------------------- | :--------------- | :---- | :------------------------------- |
| `cmd/{thing_id}/unlock` | Server → Machine | **1** | Command to unlock specific cells |

### Payload Structure (JSON)

The server will send a JSON payload indicating which cells to open.

**Example Payload (Unlocking Cell 3 and Cell 5):**

```json
{
  "request_id": "tx_12345678",
  "cells": [3, 5],
  "timestamp": 1678888888
}
```

**Field Definitions:**

- `request_id` (String): A unique ID for this command. Used for logging and tracking.
- `cells` (Array of Integers): The list of cell numbers (integers) to unlock immediately. Valid range: 1-5.
- `timestamp` (Integer): Unix epoch time of the command.

---

## 3. Publish Topics (Status sent by Machine)

The machine **must publish** status updates to the following topics.

### A. Door/Sensor Status

**Topic:** `state/{thing_id}/door`  
**Direction:** Machine → Server  
**QoS:** 1 (At least once)

**Trigger Conditions:**

1. **Immediately after receiving unlock command** - Report "open" once door opens successfully
2. **When door is closed** - Report "closed" when user closes the door
3. **If unlock fails** - Report "jammed" if door doesn't open within timeout

**Payload Structure:**

```json
{
  "cell": 3,
  "state": "open",
  "timestamp": 1678888900
}
```

**Allowed `state` values:**

- `open`: Door is physically open (sensor confirms)
- `closed`: Door is physically closed (sensor confirms)
- `jammed`: Motor ran, but sensor reports door did not open within 5 seconds

### B. Heartbeat (Keep-Alive)

**Topic:** `state/{thing_id}/heartbeat`  
**Direction:** Machine → Server  
**QoS:** 0 (At most once)  
**Frequency:** Every 60 seconds

**Purpose:** Allows the backend to detect if the machine goes offline.

**Payload Structure:**

```json
{
  "status": "online",
  "uptime": 3600,
  "rssi": -65
}
```

**Field Definitions:**

- `status`: Must be `"online"`
- `uptime`: Seconds since device boot
- `rssi`: (Optional) WiFi signal strength in dBm

---

## 4. Required Hardware Logic & Behavior

To ensure the system works correctly, the firmware must implement the following logic:

### 1. Unlock Sequence

1. Receive message on `cmd/{thing_id}/unlock`
2. Parse the `cells` array
3. For each cell in the list:
   - Activate the solenoid/motor for that cell
   - **Wait** for the physical sensor to trigger "Open"
   - **Timeout:** If the door does not report "Open" within **5 seconds**, assume it is jammed
4. **Report Result:**
   - If successful: Publish `state` `"open"` to `state/{thing_id}/door`
   - If failed: Publish `state` `"jammed"` to `state/{thing_id}/door`
5. **When user closes door:**
   - Sensor detects closure
   - Publish `state` `"closed"` to `state/{thing_id}/door`

### 2. Security Policy Enforcement

- Device must only connect to AWS IoT using the certificates and private keys provided for that specific `thing_id`
- Device must **not** attempt to subscribe to wildcard topics (e.g., `cmd/#`)
- Each device can only listen to its own `cmd/{thing_id}/unlock` topic

### 3. Network Reconnection

- If WiFi drops, device must automatically reconnect to AWS IoT broker
- Device must resubscribe to `cmd/{thing_id}/unlock` without requiring physical restart
- Implement exponential backoff for reconnection attempts

### 4. Error Handling

- If MQTT message parsing fails, log error locally and continue operation
- If motor activation fails, report "jammed" status
- Maintain local buffer of failed messages for debugging

---

## 5. Summary of Topics for Hardware Vendor

| Action                     | Topic                        | Payload Example                       | When                    |
| :------------------------- | :--------------------------- | :------------------------------------ | :---------------------- |
| **Server Unlock Command**  | `cmd/machine_01/unlock`      | `{"cells": [1], "request_id": "abc"}` | After payment confirmed |
| **Machine Reports Open**   | `state/machine_01/door`      | `{"cell": 1, "state": "open"}`        | Door opens successfully |
| **Machine Reports Closed** | `state/machine_01/door`      | `{"cell": 1, "state": "closed"}`      | User closes door        |
| **Machine Reports Jammed** | `state/machine_01/door`      | `{"cell": 1, "state": "jammed"}`      | Door fails to open      |
| **Machine Heartbeat**      | `state/machine_01/heartbeat` | `{"status": "online"}`                | Every 60 seconds        |

---

## Security & Reliability

### IoT Policy (AWS IoT Core)

- Machines can only subscribe to `cmd/{thing_id}/#`
- Machines cannot listen to commands meant for other machines
- Each device has unique certificates and private keys
- Certificates must be securely stored on device (not in plain text)

### API Security

- **Critical:** The "Purchase" API endpoint must verify payment with NewebPay NotifyURL webhook
- Never trust frontend payment confirmation
- Always validate NewebPay signature to prevent tampering
- Use HTTPS for all communication

### Sensor Handling

- Hardware monitors door sensors continuously
- If door fails to open after command → publishes "jammed" status immediately
- Backend flags machine in Admin Dashboard for manual maintenance
- Staff manually reviews and processes refunds if needed
- No automatic refunds to prevent abuse

---

## Provisioning Setup (One-Time)

### Prerequisites

- AWS Account with IoT Core enabled
- Domain name with SSL certificate
- NewebPay merchant account with credentials

### Setup Steps

1. **AWS IoT Core Setup:**
   - Create 50 Things with unique `thing_id` (machine_01 to machine_50)
   - Generate certificates and private keys for each Thing
   - Create IoT Policy allowing:
     ```json
     {
       "Effect": "Allow",
       "Action": ["iot:Connect", "iot:Subscribe"],
       "Resource": ["arn:aws:iot:region:account:client/${iot:Connection.Thing.ThingName}",
                    "arn:aws:iot:region:account:topicfilter/cmd/${iot:Connection.Thing.ThingName}/*"]
     },
     {
       "Effect": "Allow",
       "Action": ["iot:Publish"],
       "Resource": ["arn:aws:iot:region:account:topic/state/${iot:Connection.Thing.ThingName}/*"]
     }
     ```
   - Attach policy to each Thing

2. **Database Setup:**
   - Run SQL schema creation scripts
   - Insert 50 rows into `machines` table with corresponding `thing_id` values
   - Create initial `stores` and `locations` data
   - Create admin staff accounts

3. **QR Code Generation:**
   - Generate 50 QR codes pointing to: `https://your-domain.com/shop?thingID=machine_XX`
   - Print QR codes with machine ID labels
   - Laminate for durability

4. **Hardware Provisioning:**
   - Flash certificates/keys onto each Android device
   - Configure WiFi credentials
   - Test MQTT connection to AWS IoT Core
   - Verify subscribe/publish functionality
   - Attach QR code stickers to physical machines

5. **Backend Configuration:**
   - Set environment variables:
     - NewebPay credentials (MerchantID, HashKey, HashIV)
     - AWS IoT Core endpoint
     - Database connection string
   - Configure NotifyURL and ReturnURL with NewebPay
   - Test payment flow end-to-end

---

## Key Implementation Reminders

### Payment Flow

1. User completes payment on frontend
2. User redirected to NewebPay
3. **Backend receives NotifyURL webhook** (critical security step)
4. Backend verifies signature and decrypts payload
5. **Immediately on verification success:** Publish MQTT unlock command
6. No timeout between payment success and unlock command
7. ReturnURL is for user experience only, not for business logic

### Inventory Management

- **Trust-based system:** Assume all items in cell are taken once door opens
- Each cell is binary: Available (has items) or Sold Out (empty)
- Set `stock_available = false` immediately after successful payment
- Staff physically restocks cell, then marks as "Available" in admin portal
- No partial inventory tracking - each cell is all-or-nothing

### Machine Status Tracking

- Use heartbeat messages (every 60 seconds) to determine online/offline
- If no heartbeat for 90+ seconds → mark as offline
- Jammed status requires manual staff intervention to clear
- Maintain audit trail of all door events

### Session Management

- 30-minute session-based shopping cart persistence
- Server-side session storage in PostgreSQL (shopping_sessions table)
- Prices locked at session creation (prevents price changes during active shopping)
- Cart items preserved across page refreshes within session lifetime
- Session expires after 30 minutes OR after successful purchase
- Automatic cleanup of expired sessions via cron job
- Cookie only stores session_id (actual cart data in database)
- **Important:** Users can always access the shopping page (QR codes are static) - sessions are only for cart/price management, not access control

---

## Quick Reference: Your MQTT Topics

**You Publish To:**

- `cmd/{thing_id}/unlock` - Send unlock commands after payment

**You Subscribe To:**

- `state/+/door` - Receive door status from all machines (wildcard)
- `state/+/heartbeat` - Receive heartbeats from all machines (wildcard)

**Polling Intervals:**

- Admin portal polls for machine status: Every 60 seconds
- Backend checks for stale heartbeats: Every 60 seconds
- Heartbeat from devices: Every 60 seconds

---

## Testing Checklist

### Before Launch

- [ ] Test complete payment flow with real NewebPay sandbox
- [ ] Verify NotifyURL receives webhooks correctly
- [ ] Test webhook duplicate handling (NewebPay retry scenarios)
- [ ] Test payment with both credit card and LinePay methods
- [ ] Test payment failure scenarios (declined card, insufficient balance)
- [ ] Verify signature validation blocks tampered webhooks
- [ ] Test race condition: two users buying same cell simultaneously
- [ ] Test MQTT unlock commands on all 50 machines
- [ ] Verify door sensors report correct status
- [ ] Test MQTT failure scenario and audit log creation
- [ ] Test jammed door detection and maintenance log creation
- [ ] Test session expiry (wait 30+ minutes and try to access)
- [ ] Test session behavior across different browsers/incognito
- [ ] Test price locking during active sessions
- [ ] Verify session cleanup cron job works correctly
- [ ] Test all staff roles (super, store, location admins, staff)
- [ ] Test RBAC permissions for each role
- [ ] Test staff account creation and password reset flows
- [ ] Test inventory restocking workflow
- [ ] Test product template creation and application
- [ ] Test heartbeat timeout detection (machine goes offline)
- [ ] Load test with concurrent purchases (10+ users)
- [ ] Verify all database indexes are created
- [ ] Test QR code scanning on various devices
- [ ] Verify SSL certificates are valid and auto-renewing
- [ ] Test S3 image upload and retrieval
- [ ] Test with stores in both sandbox and production mode
- [ ] Verify AWS IoT policies are correctly configured
- [ ] Test audit logs track all admin actions
- [ ] Test transaction refund workflow end-to-end

### Production Monitoring

- Monitor NewebPay webhook delivery success rate
- Monitor MQTT message delivery rates
- Monitor machine heartbeat status
- Monitor session creation/expiry rates
- Monitor S3 storage usage and costs
- Set up alerts for:
  - Multiple machines offline simultaneously
  - High rate of jammed doors
  - Payment webhook failures
  - Database connection issues
  - High number of expired sessions (potential UX issue)
  - S3 upload/download failures
- Regular backup of transaction data
- Monitor PostgreSQL performance and query times
