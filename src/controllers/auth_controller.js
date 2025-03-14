const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { Verification } = require('../models/Verification');
const { sendVerificationCode } = require('../services/email_service');
require('dotenv').config();

// Генерация кода верификации
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Отправка кода подтверждения
const sendVerificationCodeController = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email уже существует'
      });
    }

    // Генерируем код подтверждения
    const code = generateVerificationCode();
    
    // Устанавливаем время действия кода (10 минут)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Сохраняем код в базе данных
    await Verification.create({
      email,
      code,
      expiresAt,
      isUsed: false
    });

    // Отправляем код на email
    const emailResult = await sendVerificationCode(email, code);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Ошибка при отправке email',
        error: emailResult.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Код подтверждения отправлен на указанный email'
    });
  } catch (error) {
    next(error);
  }
};

// Проверка кода подтверждения и регистрация пользователя
const verifyAndRegisterController = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    // Ищем последнюю запись с кодом подтверждения для данного email
    const verification = await Verification.findOne({
      where: { email },
      order: [['createdAt', 'DESC']]
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Код подтверждения не найден'
      });
    }

    // Проверяем, не истек ли срок действия кода
    if (new Date() > verification.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Срок действия кода подтверждения истек'
      });
    }

    // Проверяем, не использован ли уже код
    if (verification.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Код подтверждения уже использован'
      });
    }

    // Проверяем правильность кода
    if (verification.code !== code) {
      return res.status(400).json({
        success: false,
        message: 'Неверный код подтверждения'
      });
    }

    // Проверяем, не существует ли уже пользователь с таким email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email уже существует'
      });
    }

    // Создаем нового пользователя
    const newUser = await User.create({
      email,
      name: "" // Пустое имя по умолчанию
    });

    // Помечаем код как использованный
    await verification.update({ isUsed: true });

    // Генерируем JWT токен
    const token = jwt.sign(
      { id: newUser.id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Регистрация успешно завершена',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendVerificationCodeController,
  verifyAndRegisterController
};