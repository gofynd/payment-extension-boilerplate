const logger = require('../common/logger');

const errorHandler = (err, req, res, next) => {
    logger.error('Error:', err);
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }

    // Default error
    res.status(500).json({
        success: false,
        error: 'Internal Server Error'
    });
};

module.exports = errorHandler;
