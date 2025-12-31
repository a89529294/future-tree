import 'dotenv/config'

import { drizzle } from 'drizzle-orm/node-postgres'

import { createPool } from '@/db/config'

export const db = drizzle(createPool())
