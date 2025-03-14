const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
require('dotenv').config();

/**
 * Middleware для проверки JWT токена
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Требуется токен авторизации'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Неверный формат токена'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      
      // Проверяем существование пользователя
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Пользователь не найден'
        });
      }

      // Добавляем информацию о пользователе в запрос
      req.user = {
        id: user.id,
        email: user.email
      };
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Недействительный токен авторизации'
      });
    }
    console.log('Authenticated user ID:', req.user.id);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate
};