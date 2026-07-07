import { DrizzleError, DrizzleQueryError } from 'drizzle-orm'
import { DatabaseError } from 'pg'

type ErrorHandler = (error: DatabaseError) => {
  message: string
  constraint: string | null
}

const PostgresErrorHandlers: Record<string, ErrorHandler> = {
  '23505': (error) => ({
    message: 'A duplicate entry was found for a unique field.',
    constraint: error.constraint ?? null,
  }),
  '23503': (error) => ({
    message:
      'A foreign key violation occurred. The record you are trying to link does not exist.',
    constraint: error.constraint ?? null,
  }),
  '22P02': () => ({
    message:
      'The data provided is in an invalid format (e.g., not a valid UUID).',
    constraint: null,
  }),
  '23514': (error) => ({
    message: 'A check constraint was violated.',
    constraint: error.constraint ?? null,
  }),
  '23502': (error) => ({
    message: `A required field is missing. The column '${error.column}' cannot be null.`,
    constraint: error.column ?? null,
  }),
  '42703': (error) => ({
    message: 'An undefined column was referenced in the query.',
    constraint: error.column ?? null,
  }),
  '42601': () => ({
    message: "There's a syntax error in the database query.",
    constraint: null,
  }),
  '25000': () => ({
    message:
      'Transaction failed: a data integrity issue occurred within a database transaction.',
    constraint: null,
  }),
  '08006': () => ({
    message: 'Database connection failed. The database may be unavailable.',
    constraint: null,
  }),
  '42P01': () => ({
    message: 'A referenced table does not exist in the database.',
    constraint: null,
  }),
  '40001': () => ({
    message:
      'Transaction serialization failure. Please retry the transaction as it could not be completed due to concurrent modifications.',
    constraint: null,
  }),
  default: (error) => ({
    message: `A database error occurred: ${error.message}`,
    constraint: null,
  }),
}

export function getDbErrorMessage(error: unknown) {
  if (
    error instanceof DrizzleQueryError &&
    error.cause instanceof DatabaseError
  ) {
    const originalError = error.cause
    const handler =
      PostgresErrorHandlers[originalError.code ?? 'default'] ??
      PostgresErrorHandlers.default

    return { ...handler(originalError), originalError: error }
  }

  if (error instanceof DrizzleError) {
    return {
      message: error.message || 'An unexpected error occurred.',
      constraint: null,
      originalError: error,
    }
  }

  return null
}

export function withDbErrors<TArgs, TResult>(
  handler: (args: TArgs) => Promise<TResult>,
  context: string = 'Database operation failed',
): (args: TArgs) => Promise<TResult> {
  return async (args: TArgs) => {
    try {
      return await handler(args)
    } catch (error) {
      const dbError = getDbErrorMessage(error)

      if (dbError) {
        console.error(context, {
          message: dbError.message,
          constraint: dbError.constraint,
          originalError: error,
        })
        throw new Error(`DB: ${dbError.message}, ${dbError.originalError}`)
      }

      throw error
    }
  }
}
