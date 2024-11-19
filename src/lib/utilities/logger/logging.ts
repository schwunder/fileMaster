// ./core/logging.ts
import pino from 'pino';
import truncate from 'just-truncate';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
  level: 'info',
});

/**
 * Logs an info message.
 * @param message - The message to log.
 */
export function logInfo(message: string): void {
  logger.info(truncate(message, 500, '...'));
}

/**
 * Logs an error message.
 * @param message - The message to log.
 */
export function logError(message: string): void {
  logger.error(truncate(message, 500, '...'));
}
