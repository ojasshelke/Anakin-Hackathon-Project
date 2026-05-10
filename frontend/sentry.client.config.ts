import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  tracesSampler: (samplingContext) => {
    // If the transaction is an error, sample it at 100%
    if (samplingContext.error) return 1.0;
    // Default sampling rate for normal traffic
    return 0.02;
  },
  debug: false,
});
