import 'dotenv/config'

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  dbCredentials: {
    host: 'future-tree.c1yk6eyoi9ir.ap-east-2.rds.amazonaws.com',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD!, // Don't put password in URL
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false,
    },
  },
})
