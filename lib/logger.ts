/**
 * Structured server-side logger. Logs go to stdout/stderr and appear in:
 * - Local: terminal where `npm run dev` or `npm start` runs
 * - Vercel: Project → Logs → Runtime Logs (and in any log drain you add)
 *
 * Use for user events (login, register, key actions) and errors.
 */

export type LogLevel = "info" | "warn" | "error";

export type LogPayload = Record<string, unknown> & {
  event?: string;
  userId?: string;
  email?: string;
  role?: string;
  path?: string;
  status?: number;
  message?: string;
  err?: unknown;
};

function format(level: LogLevel, message: string, payload?: LogPayload): string {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...payload,
  };
  return JSON.stringify(entry);
}

function write(level: LogLevel, message: string, payload?: LogPayload): void {
  const line = format(level, message, payload);
  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(line);
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

export const logger = {
  info(message: string, payload?: LogPayload): void {
    write("info", message, payload);
  },

  warn(message: string, payload?: LogPayload): void {
    write("warn", message, payload);
  },

  error(message: string, payload?: LogPayload): void {
    write("error", message, payload);
  },
};
