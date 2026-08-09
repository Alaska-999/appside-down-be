import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const LEVEL_COLORS: Record<string, string> = {
  error: '31',
  warn: '33',
  info: '32',
  debug: '90',
  verbose: '36',
};

function colorLevel(level: string): string {
  const code = LEVEL_COLORS[level] ?? '37';
  return `\x1b[${code}m${level.toUpperCase().padStart(5)}\x1b[0m`;
}

function formatStack(stack: unknown): string {
  const text = Array.isArray(stack) ? stack.join('\n') : String(stack);
  return text
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n');
}

export function createAppLogger(appName: string) {
  return WinstonModule.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
          winston.format.printf(({ timestamp, level, message, context, stack, trace }) => {
            const ctxLabel = context ? ` \x1b[33m[${context}]\x1b[0m` : '';
            const errorInfo = stack ?? trace;
            const stackBlock = errorInfo ? `\n${formatStack(errorInfo)}` : '';
            return `\x1b[35m[${appName}]\x1b[0m ${timestamp}  ${colorLevel(String(level))}${ctxLabel}  ${message}${stackBlock}`;
          }),
        ),
      }),
    ],
  });
}

export function statusColor(statusCode: number): string {
  const color = statusCode >= 500 ? '31' : statusCode >= 400 ? '33' : '32';
  return `\x1b[${color}m${statusCode}\x1b[0m`;
}
