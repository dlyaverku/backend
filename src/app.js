const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerSetup = require('./config/swagger');
const { sequelize } = require('./config/database');
const authRoutes = require('./routes/auth_routes');
const userRoutes = require('./routes/user_routes');
const eventRoutes = require('./routes/event_routes');
const errorMiddleware = require('./middleware/error');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// Swagger документация
swaggerSetup(app);

// Роуты
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

// Обработка ошибок
app.use(errorMiddleware);

// Подключение к базе данных и запуск сервера
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('База данных подключена успешно.');
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
  } catch (error) {
    console.error('Не удалось подключиться к базе данных:', error);
  }
}

startServer();

module.exports = app;