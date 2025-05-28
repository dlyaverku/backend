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


app.use((req, res, next) => {
  // Пропускаем auth роуты и swagger
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api-docs')) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.split(' ')[1];
  const tokenFromQuery = req.query.token;
  
  const token = tokenFromHeader || tokenFromQuery;
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Token required. Use ?token=YOUR_TOKEN in URL or Authorization header' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }
    req.user = user;
    next();
  });
});


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
app.listen(PORT, '0.0.0.0', () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
  } catch (error) {
    console.error('Не удалось подключиться к базе данных:', error);
  }
}

app.get('/', (req, res) => {
  res.send('Thrivy backend работает!');
});


startServer();

module.exports = app;
