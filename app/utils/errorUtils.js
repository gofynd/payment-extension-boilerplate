class BadRequestError extends Error {
    constructor(message) {
        super(message);
        this.name = "BadRequestError";
        this.code = 400;
        Error.captureStackTrace(this, BadRequestError);
    }
}

class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "NotFoundError";
        this.code = 404;
        Error.captureStackTrace(this, NotFoundError);
    }
}

class AuthorizationError extends Error {
    constructor(message) {
        super(message);
        this.name = "AuthorizationError";
        this.code = 401;
        Error.captureStackTrace(this, AuthorizationError);
    }
}

module.exports = { BadRequestError, NotFoundError, AuthorizationError };