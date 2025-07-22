const winston = require('winston');
const { combine, timestamp, printf, colorize, align } = winston.format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD hh:mm:ss A' }),
    align(),
    logFormat
  ),
  transports: [
    new winston.transports.Console({ format: combine(colorize(), logFormat) }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.File({ filename: 'logs/failed-login.log', level: 'warn' }),
    new winston.transports.File({ filename: 'logs/tenant-events.log', level: 'info' }),
    new winston.transports.File({ filename: 'logs/jobs.log', level: 'info' }),
    new winston.transports.File({ filename: 'logs/mongo-slow.log', level: 'warn' }),
  ],
});

const morganMiddleware = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = { logger, morganMiddleware };
