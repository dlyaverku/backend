const express = require("express");
const cors = require("cors");
const { swaggerUi, swaggerSpec } = require("./config/swagger");

const app = express();
app.use(cors());
app.use(express.json());

// Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Роуты
app.use("/api/users", require("./routes/user"));
app.use("/api/races", require("./routes/race"));

module.exports = app;
