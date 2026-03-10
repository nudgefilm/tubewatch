export interface SupabaseErrorLike {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export function isSupabaseErrorLike(error: unknown): error is SupabaseErrorLike {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as { message?: unknown };
  return typeof candidate.message === "string";
}

export interface StorageErrorLogContext {
  operation: string;
  table: string;
  error: unknown;
  extra?: Record<string, unknown>;
}

export function logStorageError(context: StorageErrorLogContext): void {
  const { operation, table, error, extra } = context;

  if (isSupabaseErrorLike(error)) {
    // eslint-disable-next-line no-console
    console.error("[Storage][Error]", {
      operation,
      table,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      extra,
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error("[Storage][Error:Unknown]", {
    operation,
    table,
    error,
    extra,
  });
}

