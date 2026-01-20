# Implementation Plan - Store Form UI Updates

Update the `StoreForm` component to include missing fields (`store_id`, `city`, `district`) and align with the provided design.

## Proposed Changes

### 1. Update `StoreForm` UI

- **Add `store_id` field**: This will be a read-only field (greyed out) as it's auto-generated.
- **Add `city` and `district` fields**: Add these fields to the form.
- **Layout Adjustments**: Ensure the layout is clean and matches the "集團資訊" (Group Info) section in the screenshot.

### 2. Form Logic

- Update the `useForm` default values and `onSubmit` handler to include the new fields.
- The `store_id` will be derived from `props.storeId` when in `view` or `edit` mode.

## User Rules Followed

- **kebab-case** for new files (not needed here as editing existing).
- **TailwindCSS** for styling.
- **No `any` type**.
- **UTC for application layer** (not directly applicable to UI but kept in mind).
- **Zod** for validation (already using `storeFormSchema`).
- **Staff Engineer preference** for clear solutions.
