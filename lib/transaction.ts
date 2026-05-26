import { Prisma } from '@prisma/client';

const RETRYABLE_ERROR_CODES = new Set(['P2034']);

export async function withTransactionRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error) || attempt === attempts) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 20));
    }
  }

  throw lastError;
}

function isRetryableError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && RETRYABLE_ERROR_CODES.has(error.code);
}
