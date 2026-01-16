# Implementation Plan: WebSocket Server Startup Control

## Goal

Ensure `initWebSocketServer()` only runs when invoked via the `pnpm websocket` script, and not when the module is imported by the app.

## Approach

1. Remove the eager `initWebSocketServer()` call from `src/websocket-server.ts`.
2. Add a small `startWebSocketServer()` (or similar) entrypoint function that calls `initWebSocketServer()`.
3. Update the `pnpm websocket` script to call the explicit entrypoint (e.g., `tsx src/websocket-server.ts --start` or a tiny runner file).
4. Keep `broadcastToClients` usable without auto-starting the server when imported by `src/iot/index.ts`.

## Files

- `src/websocket-server.ts`
- `package.json`

## Notes

- This avoids port conflicts when the app server imports the module.
- We can either:
  - Add a `main` guard in `src/websocket-server.ts` that checks `process.argv` or `import.meta.url` to start, **or**
  - Add a dedicated runner file (cleaner and more explicit) and point the script to it.

## Decision Needed

Choose one:

1. **Main guard** in `src/websocket-server.ts` (no new file).
2. **Dedicated runner file** `src/websocket-server-runner.ts` (clearer, but adds a file).
