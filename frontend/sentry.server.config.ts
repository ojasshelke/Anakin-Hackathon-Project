import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  tracesSampler: (samplingContext) => {
    if (samplingContext.error) return 1.0;
    return 0.02;
  },
  debug: false,
});
