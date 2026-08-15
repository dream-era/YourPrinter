/**
 * Sentry & Performance Telemetry Helper for YourPrinter
 */

export interface ErrorReportOptions {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  user?: { id?: string; email?: string; role?: string };
}

/**
 * Log runtime errors to Sentry monitoring console
 */
export function captureException(error: Error | unknown, options?: ErrorReportOptions): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error(`[Sentry Monitor] Error captured:`, {
    message: errorMessage,
    tags: options?.tags,
    user: options?.user?.email,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track transaction latency for server actions and API routes
 */
export function startTransaction(name: string, op: string) {
  const startTime = Date.now();

  return {
    finish: () => {
      const duration = Date.now() - startTime;
      console.log(`[Telemetry] Transaction "${name}" (${op}) finished in ${duration}ms`);
    },
  };
}
