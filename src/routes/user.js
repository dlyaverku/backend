const express = require("express");
const router = express.Router();
const userController = require("../controllers/user_controller");       

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Получить список пользователей
 *     responses:
 *       200:
 *         description: Успешно
 */
router.get("/", userController.getAll);

module.exports = router;
