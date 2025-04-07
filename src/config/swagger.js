const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const basicAuth = require('express-basic-auth');
require('dotenv').config();
const expressBasicAuth = require('express-basic-auth');


const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Thrivy API',
      version: '1.0.0',
      description: 'API для спортивного приложения',
      contact: {
        name: 'API Support'
      },
      servers: [
        {
          url: 'http://localhost:5000',
          description: 'Development server'
        }
      ]
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = (app) => {
  // Базовая аутентификация для Swagger UI
  app.use('/api-docs', basicAuth({
    users: {
        [process.env.SWAGGER_USER]: process.env.SWAGGER_PASSWORD
    },
    challenge: true
}));
  
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};