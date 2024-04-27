'use strict';

class InvalidExtensionConfig extends Error {
    constructor(message) {
        super(message);
    }
}


class ClusterMetaMissingEror extends Error {
    constructor(message) {
        super(message);
    }
}

class SessionNotFoundError extends Error {
    constructor(message) {
        super(message);
    }
}
class InvalidOAuthError extends Error {
    constructor(message) {
        super(message);
    }
}

class InvalidHMacError extends Error {
    constructor(message) {
        super(message);
    }
}

class InvalidWebhookConfig extends Error {
    constructor(message) {
        super(message);
    }
}

class WebhookRegistrationError extends Error {
    constructor(message) {
        super(message);
    }
}

class WebhookProcessError extends Error {
    constructor(message) {
        super(message);
    }
}

class WebhookHandlerNotFound extends Error {
    constructor(message) {
        super(message);
    }
}

class ServerResponseError extends Error {
    constructor(message) {
      super(message);
    }
  }

class OAuthCodeError extends Error {
    constructor(message) {
        super(message);
    }
  }

  class TokenIssueError extends Error{
    constructor(message){
        super(message);
  }
}


module.exports = {
    InvalidExtensionConfig,
    ClusterMetaMissingEror,
    SessionNotFoundError,
    InvalidOAuthError,
    InvalidHMacError,
    InvalidWebhookConfig,
    WebhookRegistrationError,
    WebhookProcessError,
    WebhookHandlerNotFound,
    ServerResponseError,
    OAuthCodeError,
    TokenIssueError
};