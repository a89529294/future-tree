# Add Subscribe Form Section to Test Page

## Objective

Add a new form section to `/src/routes/_authenticated/test.tsx` that allows users to subscribe to door state updates by entering a `thingId` and submitting.

## Current Structure

The test page currently has one form for unlocking doors using `publishUnlock`. We'll add a second form below it for subscribing to door states.

## Implementation Plan

1. **Import the subscribe function**: Update the import from `@/iot` to include `subscribeToDoorState` alongside `publishUnlock`.

2. **Create a new form schema**: Define a Zod schema for the subscribe form with just `thingId` validation.

3. **Add a new form component**: Create a new form in the `TestPage` component with:
   - A single input field for `thingId`
   - Submit button
   - On submit, call `subscribeToDoorState({ data: { thingId } })`

4. **Handle submission**: Use TanStack Form for validation and submission, similar to the existing form. On success, log or handle the response (e.g., show success message).

5. **UI Layout**: Add the new form as a separate section below the existing form, with appropriate spacing and labels.

## Files to Modify

- `/src/routes/_authenticated/test.tsx`: Add imports, form schema, and new form JSX.

## Dependencies

- Ensure `@/iot` exports `subscribeToDoorState`
- No new dependencies needed

## Acceptance Criteria

- New form appears on the test page
- Form validates `thingId` (required, trimmed)
- On submit, calls `subscribeToDoorState` with the provided `thingId`
- Form resets after submission
- No breaking changes to existing functionality

## Potential Risks

- Ensure the subscribe function is properly exported from `@/iot`
- Handle any errors from the server function gracefully
