# Implementation Plan: Store Not Found Error Handling

## Goal

Ensure the store edit route shows the `errorComponent` (or a proper not-found UI) when a non-existent store ID is requested, instead of rendering a blank page and throwing a pending query rejection.

## Context

The route currently uses `useStore(deferredStoreId)` and defines an `errorComponent`, but the not-found error is happening during SSR dehydration and ends up aborting the request before the error UI renders.

## Plan

1. Inspect the edit route and the store query to identify where the `NotFoundError` is thrown and how the query is hydrated/handled during SSR.
2. Update the store query or route loader to map not-found errors into a route-level error (or a `notFound` response) that TanStack Router can render via `errorComponent`.
3. Add a focused regression guard (either an error boundary pattern or a query `throwOnError`/`suspense` adjustment) so missing stores always render a friendly not-found UI on both server and client.
4. Verify the edit route renders the not-found UI without blank screen or aborted request logs.

## Notes

- Keep changes minimal and consistent with existing TanStack Start patterns in this repo.
- Avoid `any` and keep types strict.
