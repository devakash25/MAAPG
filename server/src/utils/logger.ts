import { env } from '../config/environment';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const colors: Record<LogLevel, string> = {
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[35m',
};

const reset = '\x1b[0m';

const timestamp = () => new Date().toISOString();

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`${colors.info}[${timestamp()}] INFO:${reset} ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`${colors.warn}[${timestamp()}] WARN:${reset} ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`${colors.error}[${timestamp()}] ERROR:${reset} ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (env.NODE_ENV === 'development') {
      console.debug(`${colors.debug}[${timestamp()}] DEBUG:${reset} ${message}`, ...args);
    }
  },
};

export default logger;
