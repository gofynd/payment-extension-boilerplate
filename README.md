# Payment Extension Boilerplate

## Features
- Modular Structure: Organized project structure for easy maintenance and scalability.
- Built-in Examples: Included example payment gateway implementations for reference.
- Configurability: Easily configure payment settings and parameters.
- Logging: Integrated logging to help with debugging and monitoring.
- Testing: A suite of unit tests to ensure the reliability of your payment extension.

## Getting started

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
For detailed documentation on how to use and customize this boilerplate, please refer to the our official document..
