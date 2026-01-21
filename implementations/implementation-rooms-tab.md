# Implementation Plan - Rooms Tab

Add a "Rooms" tab to the branch detail view to allow users to view and manage rooms within a specific branch.

## Proposed Changes

### 1. New Components

- Create `src/routes/_authenticated/stores/$storeNumber/branches/$branchNumber/-components/room-list.tsx`:
  - Display a list of rooms in a table or grid.
  - Include room name, description, and status.
  - Use dummy data for now as requested.

### 2. Update Branch Detail View

- Modify `src/routes/_authenticated/stores/$storeNumber/branches/$branchNumber/index.tsx`:
  - Import `Tabs`, `TabsContent`, `TabsList`, and `TabsTrigger` from `@/components/ui/tabs`.
  - Wrap the existing `BranchForm` in a `TabsContent` for "Branch Info".
  - Add a second `TabsContent` for "Rooms" containing the new `RoomList` component.
  - Match the dark theme aesthetics seen in the screenshot.

## Verification Plan

- [ ] Navigate to a branch detail page.
- [ ] Verify that two tabs are visible: "店家資訊" and "房間".
- [ ] Verify that "店家資訊" shows the existing branch form.
- [ ] Verify that "房間" shows the dummy room list.
- [ ] Check that the styling matches the current dark theme.
