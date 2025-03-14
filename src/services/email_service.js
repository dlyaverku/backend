const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
require('dotenv').config();

// Создаем транспорт для отправки писем
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === 'true', // Важно: используйте точное сравнение
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Отправка кода подтверждения на email
 * @param {string} email - Email получателя
 * @param {string} code - Код подтверждения
 * @returns {Promise} Результат отправки
 */
const sendVerificationCode = async (email, code) => {
  // Читаем HTML-шаблон
  const templatePath = path.join(process.cwd(), 'src', 'utils', 'email', 'index.html');
  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  
  // Компилируем шаблон с Handlebars
  const template = Handlebars.compile(templateSource);
  
  // Подготавливаем данные для шаблона
  const htmlBody = template({ 
    to: email, 
    code: code 
  });

  const mailOptions = {
    from: `Thrivy <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Код подтверждения',
    html: htmlBody
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email отправлен: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Ошибка при отправке email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationCode
};



