# Logging

The app uses a structured server-side logger for **user events** and **errors**. Logs are JSON lines written to stdout/stderr so they work with Vercel and any log aggregator.

## Where to see logs

| Environment | Where to look |
|-------------|----------------|
| **Local** | The terminal where you run `npm run dev` or `npm start`. Each log line is a single JSON object. |
| **Vercel** | [Vercel Dashboard](https://vercel.com) → your project → **Logs** tab → **Runtime Logs**. Filter by deployment or time range. You can also add a [Log Drain](https://vercel.com/docs/observability/log-drains) (e.g. Datadog, Axiom) to send logs elsewhere. |

## What we log

- **User events:** `login_success`, `login_failed`, `register_success`, `register_failed`, `auth_required`, `admin_required`, `client_required`
- **Errors:** Any 500-level API error (with optional `err` payload), plus explicit `logger.error()` calls

Each log entry includes:

- `time` – ISO timestamp  
- `level` – `info`, `warn`, or `error`  
- `message` – short description  
- Optional fields: `event`, `userId`, `email`, `role`, `path`, `status`, `err`, etc.

## Using the logger

Import from `@/lib/logger` and call:

- `logger.info(message, payload?)` – user events, normal operations  
- `logger.warn(message, payload?)` – recoverable issues  
- `logger.error(message, payload?)` – errors (also written to stderr)

Example:

```ts
import { logger } from "@/lib/logger";

logger.info("Client assigned program", {
  event: "program_assigned",
  userId: session.user.id,
  clientId: client.id,
  programId: program.id,
});
```

For API route errors, use `apiError(message, status, err)` from `@/lib/api-helpers`; 5xx responses with `err` are logged automatically.
