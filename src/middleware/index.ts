import { createMiddleware } from '@tanstack/react-start'

export const devSleepMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    if (process.env.NODE_ENV === 'development') {
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
    return next()
  },
)
