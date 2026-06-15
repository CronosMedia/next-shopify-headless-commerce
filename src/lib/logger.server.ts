import 'server-only'

type LogLevel = 'error' | 'warn'

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {name: error.name, message: error.message}
  }

  return undefined
}

function writeLog(level: LogLevel, event: string, error?: unknown) {
  const serializedError = serializeError(error)
  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...(serializedError ? {error: serializedError} : {}),
  }

  process.stderr.write(`${JSON.stringify(entry)}\n`)
}

export const serverLogger = {
  error(event: string, error?: unknown) {
    writeLog('error', event, error)
  },
  warn(event: string, error?: unknown) {
    writeLog('warn', event, error)
  },
}
