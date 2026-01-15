# Implementation Plan: Test Page Input + Rating Radio

## Summary

Add a required `thingId` input and a required 1–5 radio group to the test page, then log the submitted values instead of making a real submit request.

## Files

- `src/routes/_authenticated/test.tsx`

## Steps

1. Add form state for `thingId` and `rating` using `useForm` from `@tanstack/react-form` (patterned after `StoreForm`).
2. Add a labeled input for `thingId` with required validation.
3. Add a radio group for `rating` (1–5) with required validation.
4. Add a submit button; on submit, `console.log` the validated values.
5. Keep layout minimal and consistent with existing components.

## Notes

- Use existing `Field`, `FieldLabel`, `FieldError`, and `Input` components for consistency.
- Use the existing radio group component from the UI library if available; otherwise, implement a simple set of labeled radio inputs.
