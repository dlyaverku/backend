const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { upload } = require('../services/file_service');
const User = require('../models/User').User; // Исправлено для импорта User из объекта
const { Op } = require('sequelize');
const Event = require('../models/Event');
const { sequelize } = require('../config/database');
const moment = require('moment');

const router = express.Router();

Event.associate({ User });

/**
 * Форматирует дату и время для клиента в формате "DD.MM HH:mm"
 * @param {Date} dateTime - объект даты и времени
 * @returns {string} - отформатированная строка
 */
const formatDateTime = (dateTime) => {
  return moment(dateTime).format('DD.MM HH:mm');
};

/**
 * Преобразует объект события для безопасной работы с Dart (null safety)
 * @param {Object} event - объект события из БД
 * @returns {Object} - безопасный для Dart объект
 */
const prepareSafeEvent = (event) => {
  // Обработка guestParticipants
  let guestParticipants = event.guestParticipants;
  if (typeof guestParticipants === 'string') {
    try {
      guestParticipants = JSON.parse(guestParticipants);
    } catch (e) {
      console.error('Ошибка парсинга JSON для guestParticipants:', e);
      guestParticipants = [];
    }
  }
  
  // Проверяем, что это массив
  if (!Array.isArray(guestParticipants)) {
    guestParticipants = [];
  }
  
  // Считаем общее количество участников
  const participantsCount = Array.isArray(event.participants) ? event.participants.length : 0;
  const guestsCount = guestParticipants.reduce((sum, guest) => sum + guest.count, 0);
  
  const safeEvent = {
    ...event,
    // Используем обработанные значения
    participants: Array.isArray(event.participants) ? event.participants : [],
    guestParticipants: guestParticipants,
    totalParticipants: participantsCount + guestsCount,
    
    // Остальные поля
    mainImage: event.mainImage || "",
    images: event.images || [],
    description: event.description || "",
    duration: event.duration ? String(event.duration) : "",
    cost: event.cost || 0,
    tags: event.tags || [],
    skillLevel: event.skillLevel || "",
    route: event.route || "",
    routeFile: event.routeFile || "",
    formattedDateTime: formatDateTime(event.dateTime)
  };
  
  return safeEvent;
};

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Получение списка событий
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поисковый запрос по названию
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Фильтр по тегам
 *       - in: query
 *         name: skillLevel
 *         schema:
 *           type: string
 *           enum: [Новички, Начальный, Средний, Высокий, Профи]
 *         description: Фильтр по уровню подготовки
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Количество элементов на странице
 *     responses:
 *       200:
 *         description: Список событий
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/', authenticate, async (req, res) => {
    try {
      const { 
        search = '',
        tags = [],
        skillLevel,
        page = 1,
        limit = 10
      } = req.query;
  
      // Построение фильтра поиска для Sequelize
      const where = {};
      
      if (search) {
        where.title = { [Op.iLike]: `%${search}%` };
      }
      
      // Фильтрация по тегам
      if (tags && (Array.isArray(tags) ? tags.length > 0 : tags)) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        where.tags = { [Op.overlap]: tagArray };
      }
      
      // Фильтрация по уровню подготовки
      if (skillLevel && skillLevel !== '--') {
        where.skillLevel = skillLevel;
      }
      
      // Подсчет с учетом всех фильтров
      const count = await Event.count({ where });
      
      // Запрос с учетом всех фильтров
      let events = await Event.findAll({
        where,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['dateTime', 'ASC']]
      });
      
      // Для каждого события считаем общее количество участников
      events = events.map(event => {
        // Получаем чистый объект
        const plainEvent = event.toJSON();
        
        // Подготавливаем для клиента
        return prepareSafeEvent(plainEvent);
      });
      
      res.status(200).json({
        data: {
          events,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Ошибка при получении событий:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении событий',
        error: error.message
      });
    }
  });
/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Создание нового события
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - location
 *               - dateTime
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               location:
 *                 type: string
 *               dateTime:
 *                 type: string
 *                 format: date-time
 *               mainImage:
 *                 type: string
 *                 format: binary
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               description:
 *                 type: string
 *               duration:
 *                 type: string
 *               cost:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               skillLevel:
 *                 type: string
 *                 enum: [Новички, Начальный, Средний, Высокий, Профи]
 *               route:
 *                 type: string
 *               routeFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Событие успешно создано
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/', 
  authenticate, 
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'routeFile', maxCount: 1 }
  ]),
  body('title').notEmpty().withMessage('Заголовок обязателен'),
  body('location').notEmpty().withMessage('Местоположение обязательно'),
  body('dateTime').isISO8601().withMessage('Неверный формат даты и времени'),
  body('description').notEmpty().withMessage('Описание обязательно'),
  validateRequest,
  async (req, res) => {
    try {
      // Обработка загруженных файлов
      const mainImagePath = req.files && req.files.mainImage && req.files.mainImage[0] 
        ? req.files.mainImage[0].path 
        : "";
        
      const imagesPath = req.files && req.files.images 
        ? req.files.images.map(file => file.path) 
        : [];
        
      const routeFilePath = req.files && req.files.routeFile && req.files.routeFile[0] 
        ? req.files.routeFile[0].path 
        : "";
      
      // Обработка тегов (если они переданы в виде строки)
      let tags = req.body.tags;
      if (typeof tags === 'string') {
        tags = tags.split(',').map(tag => tag.trim());
      }
      
      // Создаем новое событие с измененной структурой duration
      const newEvent = await Event.create({
        title: req.body.title,
        location: req.body.location,
        dateTime: new Date(req.body.dateTime),
        description: req.body.description || "",
        mainImage: mainImagePath,
        images: imagesPath,
        duration: req.body.duration || "", // Теперь duration - строка
        cost: req.body.cost ? parseFloat(req.body.cost) : 0,
        tags: tags || [],
        skillLevel: req.body.skillLevel || "",
        route: req.body.route || "",
        routeFile: routeFilePath,
        creatorId: req.user.id, // ID пользователя из токена аутентификации
        participants: [req.user.id], // Создатель автоматически становится участником
        guestParticipants: [] // Поле для хранения приглашенных гостей
      });
      
      // Преобразуем для безопасного использования в Dart
      const safeEvent = prepareSafeEvent(newEvent.toJSON ? newEvent.toJSON() : newEvent);
      
      res.status(201).json({
        success: true,
        message: 'Событие успешно создано',
        data: {
          event: safeEvent
        }
      });
    } catch (error) {
      console.error('Ошибка при создании события:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при создании события',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Получение детальной информации о событии
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID события
 *     responses:
 *       200:
 *         description: Детальная информация о событии
 *       404:
 *         description: Событие не найдено
 *       500:
 *         description: Ошибка сервера
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    console.log("Запрос события по ID:", req.params.id);
    
    // Сначала найдем событие без включения связей
    const event = await Event.findByPk(req.params.id);
      
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Событие не найдено'
      });
    }
    
    // Найдем создателя события отдельно
    const creator = await User.findByPk(event.creatorId, {
      attributes: ['id', 'name', 'email']
    });
    
    // Преобразуем для безопасного использования в Dart
    const plainEvent = event.toJSON ? event.toJSON() : event;
    const safeEvent = prepareSafeEvent(plainEvent);
    
    // Добавим информацию о создателе
    if (creator) {
      safeEvent.creator = creator.toJSON ? creator.toJSON() : creator;
    }
    
    res.status(200).json({
      success: true,
      message: 'Событие успешно получено',
      data: {
        event: safeEvent
      }
    });
  } catch (error) {
    console.error('Ошибка при получении события:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении события',
      error: error.message
    });
  }
});
/**
 * @swagger
 * /api/events/{id}/invite:
 *   post:
 *     summary: Пригласить гостей на событие
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID события
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guestCount:
 *                 type: integer
 *                 description: Количество приглашенных гостей
 *     responses:
 *       200:
 *         description: Гости успешно приглашены
 *       400:
 *         description: Превышен лимит приглашений
 *       404:
 *         description: Событие не найдено
 *       500:
 *         description: Ошибка сервера
 */
router.post('/:id/invite', authenticate, async (req, res) => {
  try {
    const { guestCount } = req.body;
    const userId = req.user.id;
    
    // Находим событие
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Событие не найдено'
      });
    }
    
    // Используем метод модели для добавления гостей
    try {
      event.updateGuestCount(userId, parseInt(guestCount, 10));
      await event.save();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    // Возвращаем обновленное событие
    const plainEvent = event.toJSON ? event.toJSON() : event;
    const safeEvent = prepareSafeEvent(plainEvent);
    
    res.status(200).json({
      success: true,
      message: 'Гости успешно приглашены',
      data: {
        event: safeEvent
      }
    });
  } catch (error) {
    console.error('Ошибка при приглашении гостей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при приглашении гостей',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/events/{id}/join:
 *   post:
 *     summary: Присоединиться к событию
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID события
 *     responses:
 *       200:
 *         description: Успешное присоединение к событию
 *       404:
 *         description: Событие не найдено
 *       500:
 *         description: Ошибка сервера
 */
router.post('/:id/join', authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Находим событие, исправляем метод на findByPk
      const event = await Event.findByPk(req.params.id);
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Событие не найдено'
        });
      }
      
      // Используем метод модели для добавления участника
      event.addParticipant(userId);
      await event.save();
      
      // Возвращаем обновленное событие
      const plainEvent = event.toJSON();
      const safeEvent = prepareSafeEvent(plainEvent);
      
      res.status(200).json({
        success: true,
        message: 'Вы успешно присоединились к событию',
        data: {
          event: safeEvent
        }
      });
    } catch (error) {
      console.error('Ошибка при присоединении к событию:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при присоединении к событию',
        error: error.message
      });
    }
  });

module.exports = router;