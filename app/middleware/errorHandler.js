const logger = require("../common/logger");
const { httpStatus, httpErrorTitle } = require("../../constants");

const errorHandler = (err, req, res, next) => {
    if (err) {
        // AxiosErrors are formatted and logged in makeRequest function
        if (err.name !== "AxiosError") {
            logger.error(`[ERR] Request Failed with message ${err.message}`);
        }
        logger.error(`[ERR] Stack trace: ${err.stack}`);
        const statusCode = err.code ? err.code : (res.statusCode ? res.statusCode : httpStatus.SERVER_ERROR);
        res.status(statusCode).json({
            success: false,
            title: httpErrorTitle[statusCode] || "Internal Server Error",
            message: err.message,
            // stackTrace: err.stack
        });
    }
};

module.exports = errorHandler;
