# Implementation Plan: Not Found Handling

## Summary

Investigate why the root `notFoundComponent` renders even when the route reports `{ isNotFound: true }`, then implement the correct TanStack Start/TanStack Router not-found handling so the intended UI appears.

## Scope

- Identify how `notFoundComponent` is configured and invoked.
- Verify how `isNotFound` is set in the route and how errors are propagated.
- Ensure the not-found handling uses the correct TanStack Start Router patterns.
- Implement and test a fix.

## Plan

1. Inspect `src/routes/__root.tsx` and the relevant store edit route to understand current error handling and `notFoundComponent` usage.
2. Identify how `isNotFound` is determined (server function, loader, or query) and how errors are thrown or returned.
3. Update route error handling to use the canonical TanStack Router not-found pattern (e.g., `notFound` error throwing or `notFoundComponent` configuration) so the correct UI renders.
4. Validate behavior by simulating a missing store and confirming the rendered UI.

## Notes

- No schema changes expected.
- Keep changes minimal and localized to routing/not-found handling.
