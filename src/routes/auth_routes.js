const express = require('express');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { 
  sendVerificationCodeController, 
  verifyAndRegisterController 
} = require('../controllers/auth_controller');

const router = express.Router();

/**
 * @swagger
 * /api/auth/send-code:
 *   post:
 *     summary: Отправка кода подтверждения на email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Код успешно отправлен
 *       400:
 *         description: Ошибка валидации или пользователь уже существует
 *       500:
 *         description: Ошибка сервера
 */
router.post(
  '/send-code',
  [
    body('email')
      .isEmail()
      .withMessage('Введите корректный email')
      .normalizeEmail(),
    validateRequest
  ],
  sendVerificationCodeController
);

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Проверка кода подтверждения и регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *       400:
 *         description: Ошибка валидации или неверный код
 *       404:
 *         description: Код подтверждения не найден
 *       500:
 *         description: Ошибка сервера
 */
router.post(
  '/verify',
  [
    body('email')
      .isEmail()
      .withMessage('Введите корректный email')
      .normalizeEmail(),
    body('code')
      .isLength({ min: 6, max: 6 })
      .withMessage('Код должен состоять из 6 цифр')
      .isNumeric()
      .withMessage('Код должен содержать только цифры'),
    validateRequest
  ],
  verifyAndRegisterController
);

module.exports = router;