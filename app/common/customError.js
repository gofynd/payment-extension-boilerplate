const { httpStatus } = require("../../constants");

class BadRequestError extends Error {
    constructor(message, code=httpStatus.BAD_REQUEST) {
        super(message);
        this.name = "BadRequestError";
        this.code = code;
        Error.captureStackTrace(this, BadRequestError);
    }
}

class NotFoundError extends Error {
    constructor(message, code=httpStatus.NOT_FOUND) {
        super(message);
        this.name = "NotFoundError";
        this.code = code;
        Error.captureStackTrace(this, NotFoundError);
    }
}

class AuthorizationError extends Error {
    constructor(message, code=httpStatus.UNAUTHORIZED) {
        super(message);
        this.name = "AuthorizationError";
        this.code = code;
        Error.captureStackTrace(this, AuthorizationError);
    }
}

module.exports = { BadRequestError, NotFoundError, AuthorizationError };