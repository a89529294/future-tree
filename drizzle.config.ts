import { defineConfig } from 'drizzle-kit'

import { dbConfig } from './src/db/config'

export default defineConfig({
  out: './drizzle',
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  dbCredentials: dbConfig,
})
