# Payment Extension Boilerplate

## Features
- Modular Structure: Organized project structure for easy maintenance and scalability
- Built-in Examples: Included example payment gateway implementations for reference
- Configurability: Easily configure payment settings and parameters
- Logging: Integrated logging to help with debugging and monitoring
- Testing: A suite of unit tests to ensure the reliability of your payment extension

## Project Structure
```
.
├── app/                      # Main application directory
│   ├── __tests__/           # Test files
│   ├── common/              # Common utilities and initializations
│   │   ├── customError.js
│   │   ├── logger.js
│   │   ├── mongo.init.js
│   │   ├── newrelic.init.js
│   │   ├── redis.init.js
│   │   └── sentry.init.js
│   ├── config.js            # Application configuration
│   ├── controllers/         # API controllers
│   │   ├── credsController.js    # Credentials and StatusMapper APIs
│   │   └── orderController.js    # Order and payments related APIs
│   ├── fdk/                 # FDK integration
│   ├── middleware/          # Express middleware
│   │   ├── errorHandler.js       # Error handling middleware
│   │   └── verifyChecksum.js     # Checksum verification middleware
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   │   ├── creds.router.js       # Credentials and StatusMapper routes
│   │   ├── health.router.js      # Health check routes
│   │   ├── order.router.js       # Order/payment routes
│   │   └── v1.router.js          # FDK connection routes
│   ├── services/            # Business logic
│   │   ├── aggregators/          # Payment gateway implementations
│   │   │   ├── aggregator.js     # Main payment gateway logic
│   │   │   └── base.js          # Base abstract class
│   │   └── processor.js          # Database operations
│   ├── utils/               # Utility functions
│   │   ├── aggregatorUtils.js    # Aggregator helper functions
│   │   ├── commonUtils.js        # Common utility functions
│   │   ├── dateUtils.js          # Date-related utilities
│   │   ├── encryptUtils.js       # Encryption and hashing utilities
│   │   └── signatureUtils.js     # Signature verification utilities
│   └── views/               # HTML templates
│       ├── htmlString.html       # HTML string renderer
│       ├── pollingLink.html      # Polling page template
│       └── redirector.html       # URL redirector template
├── frontend/                # Frontend application
├── docker-compose.yml      # Docker compose configuration
├── Dockerfile             # Docker configuration
├── package.json           # Project dependencies
└── README.md             # Project documentation
```

## Prerequisites
Before you begin, ensure you have met the following requirements:
- Node.js (v14 or higher)
- npm (v6 or higher)
- Docker and Docker Compose (for containerized deployment)

## Installation
1. Clone this repository:
    ```bash
    git clone https://github.com/gofynd/fdk-payment-extension-javascript
    ```
2. Navigate to the project directory:
    ```bash
    cd fdk-payment-extension-javascript
    ```
3. Install dependencies:
    ```bash
    npm install
    ```

## Configuration
1. Configure your payment settings by editing the `.env` file
2. Provide necessary API keys, endpoints, and credentials
3. Configure database connections in `app/config.js`

## Usage
1. Implement your payment logic within `app/services/aggregators/aggregator.js`
2. Customize the boilerplate according to your payment service requirements
   - Note: All functions in `aggregator.js` must return responses as specified in the function documentation
3. Start the application:
    ```bash
    npm start
    ```
4. For development with hot-reload:
    ```bash
    npm run dev
    ```

## Testing
Run the test suite:
```bash
npm test
```

## Docker Deployment
1. Build the Docker image:
    ```bash
    docker-compose build
    ```
2. Start the containers:
    ```bash
    docker-compose up
    ```

## Documentation
For detailed documentation on how to use and customize this boilerplate, please refer to our official documentation.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
