const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const cors = require("cors");

const usersRouter = require("./routes/users");

const app = express();
app.use(express.json());

// CORS для фронта и Swagger
app.use(cors({
  origin: "*", // или конкретный домен: ["https://thrivy.fun"]
}));

// Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// BasicAuth только для Swagger UI
app.use(
    "/docs",
    basicAuth({
      users: { [process.env.SWAGGER_USER]: process.env.SWAGGER_PASSWORD },
      challenge: true,
    }),
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
  );

// API (без авторизации)
app.use("/api", usersRouter);
module.exports = app;
