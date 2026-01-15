# Implementation Plan: Database Error Utilities + Example Usage

## Summary

Add a reusable database error utility that maps PostgreSQL error codes from Drizzle to readable messages, then apply it in one server function (`updateBranch`) with a `try...catch` example.

## Changes

1. **Add utility file** `src/data/db-error-utils.ts`
   - Implement `getDbErrorMessage` with a lookup table for PostgreSQL error codes.
   - Use `DrizzleQueryError`, `DrizzleError` from `drizzle-orm` and `DatabaseError` from `pg`.
2. **Update example usage** in `src/data/branches.ts`
   - Wrap the `updateBranch` handler body in `try...catch`.
   - Use `getDbErrorMessage` in the catch block.
   - Log the original error and throw a user-friendly `Error` message.

## Notes

- Keep TypeScript strict: no `any`.
- Follow existing import order (external → internal → types).

## Open Questions

- Should the utility live under `src/data/` or `src/utils/`? (I will place it in `src/data/` unless you prefer otherwise.)
