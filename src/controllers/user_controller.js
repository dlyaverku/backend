const { User, UserRating } = require('../models/users');
const { getFileUrl, deleteFile, upload } = require('../services/file_service');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// Получение списка пользователей
const getUsersController = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    let whereCondition = {};
    
    // Добавляем поиск по имени или email, если указан параметр search
    if (search) {
      whereCondition = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }

    // Выполняем запрос с пагинацией
    const offset = (page - 1) * limit;
    
    const { count, rows } = await User.findAndCountAll({
      where: whereCondition,
      attributes: [
        'id', 
        'name', 
        'avatar', 
        'interests', 
        'aboutMe',
        'isEmailVisible',
        'isTelegramVisible',
        [
          sequelize.literal(`CASE WHEN "isEmailVisible" = true THEN "email" ELSE '' END`),
          'email'
        ],
        [
          sequelize.literal(`CASE WHEN "isTelegramVisible" = true THEN "telegram" ELSE '' END`),
          'telegram'
        ]
      ],
      include: [
        {
          model: UserRating,
          attributes: ['sportType', 'eloRating']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      //order: [['createdAt', 'DESC']]
    });

    // Форматируем ответ
    const usersWithRanks = rows.map(user => {
      const userData = user.toJSON();
      
      // Добавляем ранги пользователю на основе ELO рейтинга
      if (userData.UserRatings && userData.UserRatings.length > 0) {
        userData.ranks = userData.UserRatings.map(rating => {
          let rank = 'Новичок';
          if (rating.eloRating >= 3700) rank = 'Легенда';
          else if (rating.eloRating >= 3000) rank = 'Высокий';
          else if (rating.eloRating >= 2000) rank = 'Продвинутый';
          else if (rating.eloRating >= 1500) rank = 'Средний';
          
          return {
            sportType: rating.sportType,
            eloRating: rating.eloRating,
            rank
          };
        });
      } else {
        userData.ranks = [];
      }
      
      delete userData.UserRatings; // Удаляем исходные данные рейтингов
      
      return userData;
    });

    res.status(200).json({
      data: {
        users: usersWithRanks,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Получение профиля пользователя
const getUserProfileController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [
        {
          model: UserRating,
          attributes: ['sportType', 'eloRating']
        }
      ],
      attributes: { 
        include: [
          [
            sequelize.literal(`CASE WHEN "isEmailVisible" = true OR "${req.user.id}" = "${id}" THEN "email" ELSE '' END`),
            'email'
          ],
          [
            sequelize.literal(`CASE WHEN "isTelegramVisible" = true OR "${req.user.id}" = "${id}" THEN "telegram" ELSE '' END`),
            'telegram'
          ]
        ]
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const userData = user.toJSON();
    
    // Добавляем ранги
    userData.ranks = userData.UserRatings.map(rating => {
      let rank = 'Новичок';
      if (rating.eloRating >= 3700) rank = 'Легенда';
      else if (rating.eloRating >= 3000) rank = 'Высокий';
      else if (rating.eloRating >= 2000) rank = 'Продвинутый';
      else if (rating.eloRating >= 1500) rank = 'Средний';
      
      return {
        sportType: rating.sportType,
        eloRating: rating.eloRating,
        rank
      };
    });
    
    delete userData.UserRatings;

    res.status(200).json({
      data: {
        user: userData
      }
    });
  } catch (error) {
    next(error);
  }
};

// Обновление профиля пользователя
const updateUserProfileController = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Проверяем, что пользователь обновляет свой профиль
    if (id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Вы можете обновлять только свой профиль'
      });
    }

    const {
      name,
      isEmailVisible,
      telegram,
      isTelegramVisible,
      interests,
      aboutMe
    } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Обновляем поля
    await user.update({
      name: name !== undefined ? name : user.name,
      isEmailVisible: isEmailVisible !== undefined ? isEmailVisible : user.isEmailVisible,
      telegram: telegram !== undefined ? telegram : user.telegram,
      isTelegramVisible: isTelegramVisible !== undefined ? isTelegramVisible : user.isTelegramVisible,
      interests: interests !== undefined ? interests : user.interests,
      aboutMe: aboutMe !== undefined ? aboutMe : user.aboutMe
    });

    res.status(200).json({
      success: true,
      message: 'Профиль успешно обновлен',
      data: {
        user: user
      }
    });
  } catch (error) {
    next(error);
  }
};

// Обновление аватара пользователя
const updateUserAvatarController = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Проверяем, что пользователь обновляет свой аватар
    if (id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Вы можете обновлять только свой аватар'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Файл аватара не загружен'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Удаляем старый аватар, если он существует
    if (user.avatar) {
      deleteFile(user.avatar);
    }

    // Получаем URL для нового аватара
    const avatarUrl = getFileUrl(req, req.file.filename);

    // Обновляем пользователя
    await user.update({
      avatar: req.file.path.replace(/\\/g, '/')
    });

    res.status(200).json({
      success: true,
      message: 'Аватар успешно обновлен',
      data: {
        avatarUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// Обновление рейтинга пользователя в спорте
const updateUserRatingController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sportType, eloRating } = req.body;

    // Только администраторы могут обновлять рейтинги
    // Здесь должна быть проверка на роль администратора
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Находим или создаем запись рейтинга
    const [rating, created] = await UserRating.findOrCreate({
      where: {
        UserId: id,
        sportType
      },
      defaults: {
        eloRating
      }
    });

    // Если запись уже существует, обновляем рейтинг
    if (!created) {
      await rating.update({ eloRating });
    }

    // Определяем ранг на основе ELO рейтинга
    let rank = 'Новичок';
    if (eloRating >= 3700) rank = 'Легенда';
    else if (eloRating >= 3000) rank = 'Высокий';
    else if (eloRating >= 2000) rank = 'Продвинутый';
    else if (eloRating >= 1500) rank = 'Средний';

    res.status(200).json({
      success: true,
      message: 'Рейтинг пользователя успешно обновлен',
      data: {
        sportType,
        eloRating,
        rank,
        userId: id
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsersController,
  getUserProfileController,
  updateUserProfileController,
  updateUserAvatarController,
  updateUserRatingController
};