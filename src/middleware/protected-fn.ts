import { createMiddleware, createServerFn } from '@tanstack/react-start'

import { requireAuth } from '@/data/utils/authorize'

const authnMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ next }) => {
    const user = await requireAuth()
    return next({
      context: { user },
    })
  },
)

const getDbErrorMessage = (e: unknown) => {
  return {
    message: '',
    constraint: '',
  }
}

const dbErrorMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ next }) => {
    try {
      return await next()
    } catch (error) {
      const dbError = getDbErrorMessage(error)

      if (dbError) {
        console.error('DB Error', {
          message: dbError.message,
          constraint: dbError.constraint,
          originalError: error,
        })
        throw new Error(dbError.message)
      }

      throw error
    }
  },
)

export const protectedServerFn = createServerFn({ method: 'GET' }).middleware([
  authnMiddleware,
  dbErrorMiddleware,
])
