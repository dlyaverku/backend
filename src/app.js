const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../swagger");


const usersRouter = require("./routes/users");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/users", usersRouter);

module.exports = app;
