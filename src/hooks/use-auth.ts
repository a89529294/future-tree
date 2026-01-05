import { useRouteContext } from '@tanstack/react-router'

import type { SessionUser } from '@/utils/auth/types-and-constants'

/**
 * Hook to get the current authenticated user from route context.
 * Returns null if no user is logged in.
 */
export function useAuth(): SessionUser | null {
  const context = useRouteContext({ from: '__root__' })
  return context.user ?? null
}

/**
 * Hook to get the current authenticated user, throwing if not logged in.
 * Use this in authenticated routes where user is guaranteed.
 */
export function useRequiredAuth(): SessionUser {
  const user = useAuth()
  if (!user) {
    throw new Error('User is required but not logged in')
  }
  return user
}
