const { createLogger, format, transports } = require('winston');
const config = require('../config');

const options = {
  level: config.log_level || 'info',
  handleExceptions: true,
  json: true,
  colorize: true,
};

const logger = createLogger({
  level: config.log_level || 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(({ timestamp, level, message, meta }) => {
      return `${timestamp} ${level} ${message} ${
        meta ? JSON.stringify(meta) : ''
      }`;
    }),
    format.colorize()
  ),
  defaultMeta: { service: 'payment-extension' },
});

// logger.stream = {
//   write(message, encoding) {
//     // use the 'info' log level so the output will be picked up by both transports (file and console)
//     console.info(message);
//   },
// };

if (['development'].includes(config.env)) {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  );
} else {
  logger.add(
    new transports.Console({
      transports: [new transports.Console(options)],
    })
  );
}

module.exports = logger;
