const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Thrivy Backend API",
      version: "1.0.0",
      description: "API документация для беговых гонок",
    },
    servers: [
      { url: "https://backend.thrivy.fun/api" }
    ]
  },
  apis: ["./src/routes/*.js"], // аннотации в роутерах
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };
