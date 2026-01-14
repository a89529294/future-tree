# AGENTS.md

This document provides guidelines for agentic coding agents working in this repository.

## Project Overview

This is a vending machine management system built with:

- **Framework**: TanStack Start (React Router + SSR)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Database**: PostgreSQL with Drizzle ORM
- **Language**: TypeScript with strict mode
- **Package Manager**: pnpm

## Build/Lint/Test Commands

```bash
# Development
pnpm dev                  # Start dev server on port 3000
pnpm preview              # Preview production build

# Building
pnpm build                # Build for production
pnpm prod                 # Build and start production server (port 3002)

# Database
pnpm db:push              # Push schema changes to database
pnpm db:push:prod         # Push schema changes in production mode
pnpm db:seed              # Seed database with test data
pnpm db:seed:prod         # Seed database in production mode
pnpm db:studio            # Open Drizzle Studio

# Linting & Formatting
pnpm lint                 # Run ESLint
pnpm format               # Check formatting with Prettier
pnpm check                # Format and fix lint issues (format + lint --fix)

# Testing
pnpm test                 # Run all tests (vitest run)
pnpm test src/routes/__tests__/example.test.tsx  # Run tests in specific file
pnpm test -- --reporter=verbose  # Run with verbose output
```

## Code Style Guidelines

### Imports

- Use path aliases (`@/*` for `src/*`) for all imports
- Sort imports automatically with ESLint `simple-import-sort` plugin
- Import order: external packages → internal imports → types

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { staff } from '@/db/schemas'
import type { LoginUser } from './types-and-constants'
```

### Formatting

- No semicolons at line ends
- Single quotes for strings
- Trailing commas enabled
- Run `pnpm check` before committing

### Types

- Enable strict TypeScript mode (`strict: true` in tsconfig)
- No `any` - use `unknown` or specific types
- Use `interface` for object types, `type` for unions/primitives
- Use Zod for runtime validation with Drizzle (`drizzle-zod`)
- Export types explicitly for public API

### Naming Conventions

- **Variables/functions**: camelCase (`fetchStaff`, `isActive`)
- **Constants**: SCREAMING_SNAKE_CASE for config constants
- **Database columns**: snake_case in schema, camelCase in TypeScript
- **React components**: PascalCase (`DashboardComponent`)
- **Files**: kebab-case for components, camelCase for utilities
- **Table names**: plural snake_case (`branches`, `staff_permissions`)
- **Column names**: descriptive, snake_case in DB
- **Table prefix**: singular for main entities (`branch`, `store`, `machine`)

### Database Schema (Drizzle ORM)

- Schema files located in `src/db/schemas/resources/` for main entities
- Use `pgTable` for PostgreSQL tables
- Columns: Use `uuid().defaultRandom().primaryKey()` for IDs
- Timestamps: Use `timestamp(..., { withTimezone: true })` with `defaultNow()`
- Define relations using `relations()` from `drizzle-orm`
- Use enums for fixed sets (roles, status values) in `src/db/schemas/enums.ts`
- Denormalize `branchId` and `storeId` on child tables for query performance

### React Components

- Use TanStack Router file-based routing in `src/routes/`
- Component files: one component per file, export as default
- Use `createFileRoute()` for route definitions
- Prefer functional components with hooks
- Use shadcn/ui components via `pnpm dlx shadcn@latest add <component>`
- Use Tailwind CSS classes for styling (no CSS modules)
- Wrap route components with `ErrorBoundary` for error handling

### Server Functions (TanStack Start)

- Server functions in `src/data/` for each entity (e.g., `src/data/stores.ts`)
- Use `createServerFn()` for all server-side operations
- Use `.inputValidator()` with Zod schema for input validation
- Use `.handler()` for implementation
- All DB queries should be in server functions
- Export query options, hooks (`useQuery`, `useMutation`) from data files

### Error Handling

- Throw `Error` with user-facing Chinese messages for validation
- Use `try/catch` for async database operations
- Let errors propagate to error boundaries
- Use `ErrorBoundary` component for route-level error handling

### Authentication & Authorization

- Use server functions (`createServerFn`) for auth operations
- Use `useAppSession()` for session management
- Implement RBAC with roles: `super_admin`, `store_admin`, `branch_admin`, `staff`
- Authorization utilities in `src/utils/auth/authorize.ts`
- Use `useCanAccess` hook for permission checks
- Never expose sensitive data in client bundles

### Git Workflow

- Create feature branches for changes
- Run `pnpm check` before committing
- Lint must pass for all PRs

### Additional Notes

- Use `tsx` for TypeScript execution (not ts-node)
- Environment variables in `.env` file (not committed)
- Nitro server output in `.output/` directory
- Drizzle config in `drizzle.config.ts`
- Vite config in `vite.config.ts`
- Use `twMerge` and `clsx` via `cn()` utility for Tailwind class merging
- UI components in `src/components/ui/`
- Data access layer in `src/data/` (server functions + React Query hooks)
