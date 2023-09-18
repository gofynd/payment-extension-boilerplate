exports.httpStatus = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    FOUND: 302,
    TEMP_REDIRECT: 307,
    REDIRECT: 308,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    NOT_ALLOWED: 405,
    SERVER_ERROR: 500,
}

exports.httpErrorTitle = {
    400: "Request Validation failed",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method not allowd",
    500: "Internal Server Error",
}

