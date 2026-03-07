/**
 * Swagger API Documentation Configuration
 * Auto-generates OpenAPI 3.0 docs from JSDoc comments
 */

const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mani Me API',
      version: '1.0.0',
      description: `
## UK-to-Ghana Parcel Delivery Platform API

This API powers the Mani Me parcel delivery service, handling:
- **Shipment Management** - Book, track, and manage parcels
- **Driver Operations** - Pickup assignments and status updates
- **Payments** - Stripe integration with pre-authorization
- **Shop Orders** - Packaging and grocery purchases
- **Notifications** - Push notifications via Expo

### Authentication
Most endpoints require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <jwt_token>
\`\`\`

### Base URL
- Production: \`https://mani-me.onrender.com/api\`
- Local: \`http://localhost:4000/api\`
      `,
      contact: {
        name: 'Mani Me Support',
        email: 'support@manime.co.uk',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'https://mani-me.onrender.com/api',
        description: 'Production server',
      },
      {
        url: 'http://localhost:4000/api',
        description: 'Local development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /auth/login',
        },
      },
      schemas: {
        // Common response schemas
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
                statusCode: { type: 'integer' },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        // User schema
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            phone: { type: 'string', example: '+447123456789' },
            role: { type: 'string', enum: ['customer', 'driver', 'admin'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // Shipment schema
        Shipment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            tracking_number: { type: 'string', example: 'MM-2026-001234-ABC' },
            sender_name: { type: 'string', example: 'John Doe' },
            sender_phone: { type: 'string', example: '+447123456789' },
            pickup_address: { type: 'string' },
            pickup_city: { type: 'string', example: 'London' },
            pickup_postcode: { type: 'string', example: 'SW1A 1AA' },
            receiver_name: { type: 'string' },
            receiver_phone: { type: 'string', example: '+233501234567' },
            delivery_address: { type: 'string' },
            delivery_city: { type: 'string', example: 'Accra' },
            parcel_size: {
              type: 'string',
              enum: ['small_box', 'medium_box', 'large_box', 'extra_large_box', 'barrel'],
            },
            shipment_status: {
              type: 'string',
              enum: [
                'booked', 'pending_pickup', 'driver_assigned', 'driver_en_route',
                'picked_up', 'at_warehouse_uk', 'in_transit', 'customs',
                'in_ghana', 'out_for_delivery', 'delivered', 'cancelled',
              ],
            },
            payment_status: {
              type: 'string',
              enum: ['pending', 'authorized', 'paid', 'refunded', 'cancelled'],
            },
            total_cost: { type: 'number', example: 75.00 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // Auth schemas
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'user@example.com' },
            password: { type: 'string', example: 'password123' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'phone'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            password: { type: 'string', minLength: 8 },
            phone: { type: 'string', example: '+447123456789' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        // Payment schemas
        PaymentIntent: {
          type: 'object',
          properties: {
            clientSecret: { type: 'string' },
            paymentIntentId: { type: 'string' },
            amount: { type: 'integer', description: 'Amount in pence' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Shipments', description: 'Shipment management' },
      { name: 'Drivers', description: 'Driver operations' },
      { name: 'Payments', description: 'Payment processing' },
      { name: 'Shop', description: 'Packaging shop orders' },
      { name: 'Grocery', description: 'Grocery shop orders' },
      { name: 'Admin', description: 'Admin dashboard endpoints' },
    ],
  },
  // Use absolute path to ensure it works regardless of working directory
  apis: [path.join(__dirname, '../routes/*.js')],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
