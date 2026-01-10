// src/start.ts
import { createStart } from '@tanstack/react-start'

export const startInstance = createStart(() => {
  return {
    // functionMiddleware: [devSleepMiddleware],
    functionMiddleware: [],
  }
})
