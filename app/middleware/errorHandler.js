const errorHandler = (err, req, res, next) => {
    if (err) {
        console.log(`[ERR] Stack trace: ${err.stack}`);
        res.status(500).json({
            success: false,
            title: "Internal Server Error",
            message: err.message,
        });
    }
};

module.exports = errorHandler;
