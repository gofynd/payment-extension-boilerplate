# Payment Extension Boilerplate for Fynd Platform

## Overview

This boilerplate provides a starting point for integrating payment gateways with the Fynd Platform, enabling merchants to process payments seamlessly. The integration facilitates the installation and activation of payment extensions, allowing for a smooth transaction process for both merchants and customers.

### How It Works

Merchants can easily install and activate the payment extension on their Fynd Platform. During checkout, customers will be presented with the payment options provided by the extension. Currently, the Fynd Platform supports standard checkout, where customers are redirected to the payment gateway's hosted page to complete their transactions.

## Building Your Payment Extension

Depending on your preferred technology stack, there are two main approaches to building a payment extension:

### Option 1: Using Node + React Payment Extension Template

For those preferring a Node and React stack, a pre-implemented template is available. This template includes OAuth extension, required endpoints, and frontend code for collecting payment gateway credentials from merchants.

### Option 2: Building From Scratch

If you opt to build your payment extension from scratch, follow these steps:

1. **Registering a Payment Extension:** Obtain your Extension API Key and Extension API Secret by creating a payment extension on the partner panel.
2. **Building Payment Extension:** Implement the necessary installation, activation, payment, and refund flows.
3. **Best Practices and Common Issues:** Familiarize yourself with best practices and troubleshoot common issues.
4. **Testing Payment Extension:** Ensure your extension works flawlessly for both merchant and customer flows.

## Registration Guide

Before diving into development, register your payment extension to get the necessary API keys:

1. Create your partner organization on Fynd Partners.
2. Navigate to the partner panel and select "Extensions" > "Create Extension."
3. Fill in the basic details, select "Payment" as the extension type, and set your distribution method to "public."
4. Obtain your Extension API Key and Extension API Secret, crucial for your extension's interaction with the Fynd Platform.

## Security and Best Practices

- **Verifying API Calls:** Use checksums generated with your Extension API Secret to secure communications between the Fynd Platform and your payment extension.
- **Idempotency:** Ensure your extension supports idempotency to prevent duplicate transactions and ensure a consistent buyer experience.

For more detailed examples and additional languages, refer to the provided guides.

## Flow diagrams

Forward payment
![QG1](https://cdn.pixelbin.io/v2/doc/original/moonlight/Extensions/payment_extension/payment_forward)

Get payment status
![QG1](https://cdn.pixelbin.io/v2/doc/original/moonlight/Extensions/payment_extension/get_payment_status.svg)

Refund payment
![QG1](https://cdn.pixelbin.io/v2/doc/original/moonlight/Extensions/payment_extension/payment_refund.png)

Get refund status
![QG1](https://cdn.pixelbin.io/v2/doc/original/moonlight/Extensions/payment_extension/get_refund_status.svg)
