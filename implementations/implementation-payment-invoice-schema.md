# Payment & Invoice Schema Implementation Plan

## Overview

This implementation adds database schema support for:

1. **NewebPay (藍新金流)** - Payment gateway integration
2. **ezPay (簡單付)** - Electronic invoice system

**CRITICAL**: This involves money. All changes must be carefully reviewed before deployment.

---

## User Clarifications (Confirmed)

1. **Credentials at BRANCH level** - Each branch gets its own merchantId/hashKey/hashIV
2. **No buyer info needed** - Vending machine system, users scan QR code
3. **Auto-donation** - All invoices donated to charity via love code
4. **Love code format** - 3-7 digits (e.g., `885521`, `86888`), NOT `/88888888`
5. **Electronic only** - PrintFlag = 'N'
6. **Skip refunded status** - Defer to future implementation (complex system)

---

## Current State Analysis

### Existing `branches` table

- Basic branch info (name, address, phone)
- No payment/invoice credentials

### Existing `transactions` table

- Basic payment fields: `totalAmount`, `paymentStatus`, `paymentReferenceId`
- `transactionStatusEnum`: `pending`, `paid`, `failed`
- No invoice linkage

### Existing `transactionItems` table

- Product snapshots at purchase time
- Has `productName`, `priceAtPurchase`
- Good foundation for invoice line items

---

## Proposed Changes

### 1. Update `enums.ts`

Add new enums for invoice handling:

```typescript
// Invoice status for tracking the lifecycle
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'pending', // Waiting to be issued (successful payment, no invoice yet)
  'issued', // Successfully issued by ezPay
  'failed', // Failed to issue (will retry)
  'voided', // Invoice was voided/cancelled
])

// Tax type per Taiwan regulations
export const taxTypeEnum = pgEnum('tax_type', [
  'taxable', // 1 - 應稅 (5%)
  'zero_tax', // 2 - 零稅率
  'tax_free', // 3 - 免稅
])
```

Note: Removed `invoiceCategoryEnum` since all invoices are B2C with auto-donation.

### 2. Update `branches.ts`

Add payment and invoice credentials. These are **branch-level** settings because each branch has its own merchant account.

```typescript
// ====== NewebPay Payment Settings ======
paymentMerchantId: varchar('payment_merchant_id', { length: 50 }),
paymentHashKey: varchar('payment_hash_key', { length: 64 }),   // AES key
paymentHashIv: varchar('payment_hash_iv', { length: 32 }),     // AES IV
isPaymentEnabled: boolean('is_payment_enabled').default(false).notNull(),

// ====== ezPay Invoice Settings ======
// Note: ezPay uses DIFFERENT credentials than NewebPay
invoiceMerchantId: varchar('invoice_merchant_id', { length: 50 }),
invoiceHashKey: varchar('invoice_hash_key', { length: 64 }),   // AES-256 key
invoiceHashIv: varchar('invoice_hash_iv', { length: 32 }),     // AES-256 IV
isInvoiceEnabled: boolean('is_invoice_enabled').default(false).notNull(),

// ====== Invoice Donation Settings ======
// Love code (愛心碼) for auto-donation, 3-7 digits
// Examples: 885521 (兒童福利聯盟), 86888 (麥當勞叔叔之家)
defaultLoveCode: varchar('default_love_code', { length: 7 }),
defaultTaxType: taxTypeEnum('default_tax_type').default('taxable').notNull(),
```

**SECURITY CONSIDERATION**:

- Hash keys should be encrypted at rest in production
- Consider using environment variables or a secrets manager
- These fields should NOT be exposed to client-side code

### 3. Update `transactions.ts`

Add fields to support NewebPay callback data and invoice linkage.
**Note**: No buyer info needed since all invoices are auto-donated.

```typescript
// ====== NewebPay Response Fields ======
// These fields store data returned from NewebPay webhook (NotifyURL)
newebpayTradeNo: varchar('newebpay_trade_no', { length: 50 }),     // 藍新交易序號
newebpayPaymentType: varchar('newebpay_payment_type', { length: 20 }), // CREDIT, WEBATM, etc.
newebpayPayTime: timestamp('newebpay_pay_time', { withTimezone: true }), // 支付完成時間
newebpayIp: varchar('newebpay_ip', { length: 45 }),  // 付款人IP

// ====== Amounts for Tax Calculation ======
// Taiwan VAT is 5%, totalAmount = amt + taxAmt
amt: decimal('amt', { precision: 10, scale: 2 }),         // 銷售額 (未稅)
taxAmt: decimal('tax_amt', { precision: 10, scale: 2 }), // 稅額

// ====== Invoice Linkage ======
invoiceId: uuid('invoice_id').references(() => invoices.id),
```

### 4. Create NEW `invoices.ts`

New table to track electronic invoices issued via ezPay.
**Simplified for auto-donation**: No buyer info, no carrier fields (all donated).

```typescript
export const invoices = pgTable('invoices', {
  id: uuid().defaultRandom().primaryKey(),

  // Denormalized references for query performance
  storeId: uuid('store_id')
    .references(() => stores.id, { onDelete: 'cascade' })
    .notNull(),
  branchId: uuid('branch_id')
    .references(() => branches.id, { onDelete: 'cascade' })
    .notNull(),
  transactionId: uuid('transaction_id')
    .references(() => transactions.id, { onDelete: 'cascade' })
    .notNull()
    .unique(), // One invoice per transaction

  // ====== ezPay Response Data ======
  invoiceNumber: varchar('invoice_number', { length: 20 }), // 發票號碼 (e.g., "AB12345678")
  randomNum: varchar('random_num', { length: 4 }), // 隨機碼 (4 digits)
  invoiceTransNo: varchar('invoice_trans_no', { length: 50 }), // ezPay交易序號

  // ====== Invoice Details ======
  status: invoiceStatusEnum('status').default('pending').notNull(),
  taxType: taxTypeEnum('tax_type').default('taxable').notNull(),

  // ====== Amounts (snapshot at invoice time) ======
  amt: decimal('amt', { precision: 10, scale: 2 }).notNull(), // 銷售額 (未稅)
  taxAmt: decimal('tax_amt', { precision: 10, scale: 2 }).notNull(), // 稅額
  totalAmt: decimal('total_amt', { precision: 10, scale: 2 }).notNull(), // 總金額

  // ====== Donation (捐贈) ======
  // All invoices auto-donated to charity
  loveCode: varchar('love_code', { length: 7 }).notNull(), // 愛心碼 (3-7 digits)

  // ====== Error Tracking ======
  lastError: text('last_error'), // Store error message if issuance failed
  retryCount: integer('retry_count').default(0).notNull(),

  // ====== Timestamps ======
  issuedAt: timestamp('issued_at', { withTimezone: true }), // When ezPay confirmed
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
```

### 5. Update `index.ts`

- Import and export new `invoices` table
- Import new enums
- Add `invoicesRelations`
- Update `transactionsRelations` to include invoice

---

## Data Flow Recap

```
┌─────────────────────────────────────────────────────────────────┐
│ PAYMENT FLOW (NewebPay)                                         │
├─────────────────────────────────────────────────────────────────┤
│ 1. Create transaction (status: pending)                         │
│ 2. User pays on NewebPay                                        │
│ 3. Webhook updates transaction (status: paid)                   │
│    → Stores newebpayTradeNo, newebpayPayTime, etc.              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ INVOICE FLOW (ezPay) - Background Job                           │
├─────────────────────────────────────────────────────────────────┤
│ 1. Find transactions: status=paid AND invoiceId IS NULL         │
│ 2. Call ezPay API to issue invoice                              │
│ 3. Create invoice record with invoiceNumber, randomNum          │
│ 4. Link invoice to transaction                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Checklist

- [ ] Hash keys stored in DB (consider encryption at rest)
- [ ] Hash keys NEVER exposed to frontend
- [ ] All monetary calculations use `decimal` not `float`
- [ ] Invoice CheckCode verified on every ezPay response
- [ ] Payment amount verified against DB on webhook
- [ ] Idempotency: Check if transaction already processed before updating
- [ ] All timestamps use `withTimezone: true` (TIMESTAMPTZ)

---

## Implementation Status

- [x] User clarifications confirmed
- [x] Update `enums.ts` with new enums (`invoiceStatusEnum`, `taxTypeEnum`)
- [x] Update `branches.ts` with payment/invoice credentials
- [x] Update `transactions.ts` with NewebPay fields
- [x] Create `invoices.ts`
- [x] Update `index.ts` with relations and exports
- [ ] Create Zod schemas for validation (deferred - can be added when building API endpoints)
- [ ] Run `pnpm db:push` to apply schema changes to database
