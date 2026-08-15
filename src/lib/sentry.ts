import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/env";

export function initSentry() {
  if (env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: false,
    });
  }
}
