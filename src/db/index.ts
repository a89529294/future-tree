import 'dotenv/config'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD!,
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false,
  },
})

export const db = drizzle(pool)
