import { Pool } from 'pg'

export const dbConfig = {
  host: process.env.DB_HOST!,
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD!,
  database: 'postgres',
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : false,
}

export function createPool(): Pool {
  return new Pool(dbConfig)
}
