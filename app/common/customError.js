class BadRequestError extends Error {
    constructor(message, code=400) {
        super(message);
        this.name = 'BadRequestError';
        this.code = code;
    }
}

class NotFoundError extends Error {
    constructor(message, code=404) {
        super(message);
        this.name = 'NotFoundError';
        this.code = code;
    }
}

class UnauthorizedError extends Error {
    constructor(message, code=401) {
        super(message);
        this.name = 'UnauthorizedError';
        this.code = code;
    }
}

module.exports = { BadRequestError, NotFoundError, UnauthorizedError };