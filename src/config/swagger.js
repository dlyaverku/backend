const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Thrivy Backend API",
      version: "1.0.0",
      description: "API documentation for Thrivy running app",
    },
    servers: [{ url: "http://localhost:3000" }],
  },
  apis: ["./src/routes/*.js"], // берём описание прямо из роутов
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
