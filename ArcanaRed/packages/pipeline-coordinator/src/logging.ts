let loggingEnabled = process.env.EXPLORER_DEBUG_LOGS === 'true';

export function logDebug(message: string, ...params: unknown[]): void {
  if (!loggingEnabled) return;
  const timestamp = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`[explorer-debug ${timestamp}] ${message}`, ...params);
}

export function setLoggingEnabled(enabled: boolean): void {
  loggingEnabled = enabled;
}

/**
 * Logger for multi-agent system
 */
export const logger = {
  info(message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO:`, message, ...args);
  },

  warn(message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN:`, message, ...args);
  },

  error(message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR:`, message, ...args);
  },

  debug(message: string, ...args: any[]): void {
    if (loggingEnabled) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] DEBUG:`, message, ...args);
    }
  },
};
