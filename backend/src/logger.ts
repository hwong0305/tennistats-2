import fs from 'node:fs';
import path from 'node:path';
import { createLogger, format, transports } from 'winston';

const logFilePath = process.env.LOG_FILE || 'logs/app.log';
const logDir = path.dirname(logFilePath);

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.File({ filename: logFilePath }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({ level, message, timestamp, ...meta }) => {
          const metaText = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${level}: ${message}${metaText}`;
        })
      )
    })
  ],
});

export default logger;
