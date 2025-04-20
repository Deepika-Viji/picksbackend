const winston = require('winston');
const { combine, timestamp, printf, colorize } = winston.format;

// Create a custom format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message} `;
  
  if (Object.keys(metadata).length > 0) {
    msg += JSON.stringify(metadata);
  }
  
  return msg;
});

// Create the logger
const logger = winston.createLogger({
  level: 'info',
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ]
});

// For handling promise rejections
logger.rejections.handle(
  new winston.transports.File({ filename: 'logs/rejections.log' })
);

module.exports = logger;