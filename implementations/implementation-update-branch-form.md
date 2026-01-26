# Implementation Plan - Update Branch Form with New Fields

I will update the `BranchForm` component to include the new fields added to the `branches` schema, including payment settings, invoice settings, and donation settings.

## Proposed Changes

### 1. Update `branches.ts` schema

- Update `branchFormSchema` in `@/db/schemas/resources/branches.ts` to include the new fields:
  - `paymentMerchantId`
  - `paymentHashKey`
  - `paymentHashIv`
  - `isPaymentEnabled`
  - `invoiceMerchantId`
  - `invoiceHashKey`
  - `invoiceHashIv`
  - `isInvoiceEnabled`
  - `defaultLoveCode`
  - `defaultTaxType`

### 2. Update `BranchForm` Component

- Update `BranchFormData` usage.
- Update `useForm` initialization with new default values and validation.
- Add UI sections for:
  - **金流設定 (Payment Settings)**: NewebPay Merchant ID, Hash Key, Hash IV, and a toggle for activation.
  - **發票設定 (Invoice Settings)**: ezPay Merchant ID, Hash Key, Hash IV, and a toggle for activation.
  - **發票捐贈與稅務 (Invoice Donation & Tax)**: Default Love Code and Default Tax Type (using a Radio Group).

### 3. UI Components

- Use `Switch` for boolean fields (`isPaymentEnabled`, `isInvoiceEnabled`).
- Use `RadioGroup` for `defaultTaxType` (implementing the Radio Group Factory Pattern if applicable, or using standard shadcn/ui components).

## Verification Plan

### Manual Testing

- Verify that the form correctly loads existing data for the new fields in 'view' and 'edit' modes.
- Verify that 'new' mode initializes the new fields with correct defaults.
- Verify validation for the new fields (e.g., length constraints).
- Verify that toggling `isPaymentEnabled` and `isInvoiceEnabled` works.
- Verify that the `defaultTaxType` radio group selection works.
