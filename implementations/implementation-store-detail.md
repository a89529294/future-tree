# Implementation Plan - Store Detail & Edit Page

Implement store detail and edit pages that allow viewing and editing store information.

## User Requirements

- Paths:
  - View: `/stores/$storeId` under `_authenticated`
  - Edit: `/stores/$storeId/edit` under `_authenticated`
- Fields: `name`, `address`, `phoneNumber` (from `stores` table in `schema.ts`)
- UI: A form with pre-populated fields using a common component.
- Priority: Desktop-first (authenticated admin area).
- Components: shadcn/ui (Input, Label, Card, Button).

## Proposed Changes

### 1. UI Components (shadcn/ui)

- Create `src/components/ui/label.tsx`
- Create `src/components/ui/card.tsx`

### 2. Common Form Component

- Create `src/components/stores/store-form.tsx`
  - Accepts `initialData` for pre-population.
  - Accepts `isReadOnly` prop to switch between View and Edit modes.

### 3. Route Files

- Create `src/routes/_authenticated/stores/$storeId.tsx` (View Mode)
- Create `src/routes/_authenticated/stores/$storeId/edit.tsx` (Edit Mode)

### 4. Data Handling

- Use mock store data based on `storeId`.

## Verification Plan

- Navigate to `/stores/[id]` and verify read-only form.
- Navigate to `/stores/[id]/edit` and verify editable form.
- Verify shared logic between the two pages.
