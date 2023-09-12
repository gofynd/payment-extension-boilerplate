

class Base {

    constructor() {
        if (new.target === Base) {
            console.log('Base Class')
            throw new TypeError('Cannot instantiate abstract class.');
        }
    }

    async setAggregatorConfig() {
        throw new TypeError('`setAggregatorConfig` Abstract method has not been implemented.');
    }

    async createOrder() {
        throw new TypeError('`createOrder` Abstract method has not been implemented.');
    }

    async processCallback() {
        throw new TypeError('`processCallback` Abstract method has not been implemented.');
    }

    async processRefund() {
        throw new TypeError('`processRefund` Abstract method has not been implemented.');
    }

    async processWebhook() {
        throw new TypeError('`processWebhook` Abstract method has not been implemented.');
    }

    async getOrderDetails() {
        throw new TypeError('`paymentUpdateStatus` Abstract method has not been implemented.');
    }

    async paymentUpdateStatus() {
        throw new TypeError('`paymentUpdateStatus` Abstract method has not been implemented.');
    }
}

module.exports = Base
