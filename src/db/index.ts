import { drizzle } from 'drizzle-orm/node-postgres'
import { createPool } from '@/db/config'
import * as schema from '@/db/schema'

// passing in schema enables the relational query API in your application code
export const db = drizzle(createPool(), { schema })
