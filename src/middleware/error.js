/**
 * Глобальный обработчик ошибок
 */
const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack);
  
    // Устанавливаем статус ошибки или используем 500 (Internal Server Error)
    const statusCode = err.statusCode || 500;
  
    // Форматируем ответ
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Произошла внутренняя ошибка сервера',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  };
  
  module.exports = errorMiddleware;