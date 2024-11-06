const Sentry = require('../common/sentry');

const errorHandler = (err, req, res, next) => {
  if (err) {
    console.error(`[ERR] Stack trace: ${err.stack}`);
    Sentry.captureException(err);
    res.status(500).json({
      success: false,
      title: 'Internal Server Error',
      message: err.message,
    });
    next(err);
  }
};

module.exports = errorHandler;
