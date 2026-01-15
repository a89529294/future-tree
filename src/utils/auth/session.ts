import { createServerOnlyFn } from '@tanstack/react-start'
import { useSession } from '@tanstack/react-start/server'

import type { SessionState } from './types-and-constants'
import { expiresInSeconds } from './types-and-constants'

export const useAppSession = createServerOnlyFn(() => {
  return useSession<SessionState>({
    name: 'staff-session',
    password: process.env.STAFF_COOKIE_SECRET!,
    maxAge: expiresInSeconds,
  })
})
