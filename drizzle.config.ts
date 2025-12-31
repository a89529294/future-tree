import 'dotenv/config'

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD!,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false,
    },
  },
})
