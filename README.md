# Payment Extension Boilerplate

## Features
- Modular Structure: Organized project structure for easy maintenance and scalability.
- Built-in Examples: Included example payment gateway implementations for reference.
- Configurability: Easily configure payment settings and parameters.
- Logging: Integrated logging to help with debugging and monitoring.
- Testing: A suite of unit tests to ensure the reliability of your payment extension.

## Getting started

##### Directory structure
```
.
├── app
│   ├── __tests__
│   │   └── unit
│   │       ├── global
│   │       │   └── test-teardown-globals.js
│   │       ├── routes
│   │       │   └── healthz.router.spec.js
│   │       └── utils
│   │           └── server.js
│   ├── common
│   │   ├── customError.js
│   │   ├── logger.js
│   │   ├── mongo.init.js
│   │   ├── newrelic.init.js
│   │   ├── redis.init.js
│   │   └── sentry.init.js
│   ├── config.js
│   ├── controllers
│   │   ├── credsController.js => Credentials and StatusMapper API controllers
│   │   └── orderController.js => order and payments related API controllers
│   ├── fdk
│   │   └── index.js
│   ├── jest.config.js
│   ├── jest.init.js
│   ├── middleware
│   │   ├── errorHandler.js => error handler middleware that take care to print error.
│   │   └── verifyChecksum.js => checksum middle logic you can implement in this
│   ├── models
│   │   └── models.js => manage Database schema definations
│   ├── routes
│   │   ├── creds.router.js => URL manager for credentials and statusMapper APIs
│   │   ├── health.router.js => URL manager for health check API
│   │   ├── order.router.js => URL manager for Order/payment APIs
│   │   └── v1.router.js => router for FDK connection.
│   ├── server.js
│   ├── services
│   │   ├── aggregators
│   │   │   ├── aggregator.js => Main PG logic file here all the PG related logic should me implemented.
│   │   │   └── base.js => base file that have abstract methods that are required to impleted
│   │   └── processor.js => this file have all the implementation of database operations. Order API's request and responses pass through this file.
│   ├── utils
│   │   ├── aggregatorUtils.js => Aggregator helper functions are written.
│   │   ├── commonUtils.js
│   │   ├── dateUtils.js => date related helper functions are written
│   │   ├── encryptUtils.js => encryption, decryption or any hashing functions are written. You can write based on your PG requirements
│   │   └── signatureUtils.js
│   └── views
│       ├── htmlString.html => HTML file that render HTML Strings. You can use this file for redirection purpose.
│       ├── pollingLink.html => Continues polling page if required to poll. This check the payment status if success and redirect to success_url other poll continous.
│       └── redirector.html => This file help to simple use to redirect the URL to provided URL.
```
##### Prerequisites
Before you begin, ensure you have met the following requirements:

- Node.js: Make sure Node.js is installed on your development machine.
- Package Manager: We recommend using npm as your package manager.


## Installation
1. Clone this repository:
    ```
    git clone https://github.com/gofynd/fdk-payment-extension-javascript
    ```
2. Navigate to the project directory:
    ```
    cd fdk-payment-extension-javascript
    ```
3. Install dependencies:
    ```
    npm install
    ```

## Configuration
1. Configure your payment settings by editing the `app/config.js` file.
2. Provide necessary API keys, endpoints, or credentials.

## Usage
1. Implement your payment logic within the `app/services/aggregators/aggregator.js`
2. Customize and extend the boilerplate according to your specific payment service requirements.
    Note: All functions in `aggregator.js` must return same response as mentioned in each function docstring.
3. Run your extension:
    ```
    npm start
    ```

## Documentation
For detailed documentation on how to use and customize this boilerplate, please refer to the our official document.
