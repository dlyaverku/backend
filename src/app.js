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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
app.listen(PORT, '0.0.0.0', () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
  } catch (error) {
    console.error('Не удалось подключиться к базе данных:', error);
  }
}



app.get('/', (req, res) => {
  const uptime = process.uptime();
  const load = os.loadavg();
  const memoryUsage = process.memoryUsage();
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Thrivy Backend</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background-color: #f9fafb;
        color: #111;
      }
      .sidebar {
        width: 250px;
        height: 100vh;
        background-color: #1f2937;
        color: white;
        position: fixed;
        top: 0;
        left: 0;
        display: flex;
        flex-direction: column;
        padding: 20px;
      }
      .sidebar a {
        color: #9ca3af;
        text-decoration: none;
        margin: 10px 0;
        font-size: 16px;
      }
      .sidebar a:hover {
        color: white;
      }
      .main {
        margin-left: 270px;
        padding: 30px;
      }
      .card {
        background-color: white;
        padding: 20px;
        margin-bottom: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      h2 {
        margin-top: 0;
      }
    </style>
  </head>
  <body>
    <div class="sidebar">
      <h2>Thrivy</h2>
      <a href="#status">Статус</a>
      <a href="https://backend.thrivy.fun/api-docs/" target="_blank">Swagger API</a>
    </div>
    <div class="main">
      <div class="card" id="status">
        <h2>Статус сервера</h2>
        <p>✅ Thrivy backend работает!</p>
      </div>
      <div class="card">
        <h2>Метрики</h2>
        <ul>
          <li><strong>Uptime:</strong> ${Math.floor(uptime)} сек</li>
          <li><strong>Load Average (1m):</strong> ${load[0].toFixed(2)}</li>
          <li><strong>Memory Usage:</strong> ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB</li>
        </ul>
      </div>
    </div>
  </body>
  </html>
  `;
  res.send(html);
});

// app.listen(port, () => {
//   console.log(`Thrivy backend running at http://localhost:${port}`);
// });



startServer();

module.exports = app;
