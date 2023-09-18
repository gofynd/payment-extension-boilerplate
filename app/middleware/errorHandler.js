const { httpStatus, httpErrorTitle } = require("../../constants");

const errorHandler = (err, req, res, next) => {
    if (err){
        console.log(err);
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
