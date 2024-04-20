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

const log = require("loglevel");
const packageJSON = require("../../package.json");

const PACKAGE_VERSION = getPackageVersion();

function Logger(data) {
  const { level, message, ...others } = data;

  if (level === "TRACE") {
    log.trace(
      JSON.stringify({
        level: level,
        detail: message,
        ...others,
        time: getDateTime(),
        version: PACKAGE_VERSION,
      })
    );
  }

  if (level === "DEBUG") {
    log.debug(
      JSON.stringify({
        level: level,
        detail: message,
        ...others,
        time: getDateTime(),
        version: PACKAGE_VERSION,
      })
    );
  }

  if (level === "INFO") {
    log.info(
      JSON.stringify({
        level: level,
        detail: message,
        ...others,
        time: getDateTime(),
        version: PACKAGE_VERSION,
      })
    );
  }

  if (level === "WARN") {
    log.warn(
      JSON.stringify({
        level: level,
        detail: message,
        ...others,
        time: getDateTime(),
        version: PACKAGE_VERSION,
      })
    );
  }

  if (level === "ERROR") {
    log.error(
      JSON.stringify({
        level: level,
        detail: message,
        ...others,
        time: getDateTime(),
        version: PACKAGE_VERSION,
      })
    );
  }
}

function setLoggerLevel(level) {
  log.setLevel(level);
}

function getLoggerLevel() {
  return log.getLevel();
}

function getDateTime() {
  return new Date().toString();
}

function getPackageVersion() {
  return packageJSON.version;
}

module.exports = {
  log,
  Logger,
  setLoggerLevel,
  getLoggerLevel,
  logger
};



// module.exports = logger;
