# Implementation Plan - Room Management Routes

This plan outlines the steps to add room management routes (create, view, edit) and integrate them into the existing branch detail page.

## Proposed Routes

- `/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/new`: Create room
- `/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/$roomNumber/`: View room
- `/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/$roomNumber/edit`: Edit room

## Proposed Changes

### 1. Component Enhancements

- **RoomList Component**:
  - Add a "Create New Room" button in the header area.
  - Make room cards clickable to navigate to the room view page.
  - Add navigation logic using `useNavigate` and `useParams`.

### 2. New Route Files

- **Create Room**: `src/routes/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/new.tsx`
- **View Room**: `src/routes/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/$roomNumber/index.tsx`
- **Edit Room**: `src/routes/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/$roomNumber/edit.tsx`

### 3. Room Form Component

- Create `src/routes/_authenticated/stores/$storeNumber/branches/$branchNumber/rooms/-components/room-form.tsx` to handle both create and edit modes (similar to `BranchForm`).

## Questions & Clarifications

1. For the room number/ID in the URL, should I use the UUID or a formatted room number (e.g., RM-00001)? The request mentions `RM-00001`.
2. Should the "Create New Room" button be inside the `RoomList` component or in the `BranchDetailComponent` (the parent)?
3. Do you have any specific fields for the room form besides name, description, and status?
