const { sequelize } = require('../config/database'); // Исправьте путь, если нужно
const { DataTypes } = require('sequelize');

const Event = sequelize.define('Event', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Заголовок обязателен' }
    }
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Местоположение обязательно' }
    }
  },
  dateTime: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: { msg: 'Неверный формат даты и времени' }
    }
  },
  mainImage: DataTypes.STRING, // Путь к файлу
  images: DataTypes.ARRAY(DataTypes.STRING),
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Описание обязательно' }
    }
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cost: {
    type: DataTypes.TEXT,
    defaultValue: 0
  },
  tags: DataTypes.ARRAY(DataTypes.STRING),
  skillLevel: {
    type: DataTypes.ENUM('Новички', 'Начальный', 'Средний', 'Высокий', 'Профи')
  },
  route: DataTypes.TEXT,
  routeFile: DataTypes.STRING,
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users', // Имя таблицы пользователей
      key: 'id'
    }
  },
  participants: DataTypes.ARRAY(DataTypes.INTEGER), // Массив ID участников
  guestParticipants: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Массив объектов вида {userId: INTEGER, count: INTEGER}',
    get() {
      // Добавляем геттер для корректного получения значения
      const value = this.getDataValue('guestParticipants');
      if (!value) return [];
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return [];
        }
      }
      return value;
    }
  }
}, {
  timestamps: true,
  indexes: [
    // Индексы для оптимизации поиска
    { fields: ['title', 'description'] },
    { fields: ['tags'] },
    { fields: ['skillLevel'] },
    { fields: ['dateTime'] }
  ]
});


// Метод для получения списка участников с учетом приглашенных гостей
Event.prototype.getTotalParticipantsCount = function() {
    const participants = Array.isArray(this.participants) ? this.participants.length : 0;
    
    const guests = Array.isArray(this.guestParticipants) 
      ? this.guestParticipants.reduce((sum, guest) => sum + guest.count, 0) 
      : 0;
    
    return participants + guests;
  };
  
  // Метод для проверки, является ли пользователь участником события
  Event.prototype.isParticipant = function(userId) {
    return Array.isArray(this.participants) && this.participants.includes(userId);
  };
  
  // Метод для добавления пользователя как участника
  Event.prototype.addParticipant = function(userId) {
    if (!Array.isArray(this.participants)) {
      this.participants = [];
    }
    
    if (!this.participants.includes(userId)) {
      this.participants.push(userId);
    }
    
    return this;
  };
  

  // Метод для добавления или обновления гостей пользователя
  Event.prototype.updateGuestCount = function(userId, guestCount, maxGuests = 5) {
    if (!Array.isArray(this.guestParticipants)) {
      this.guestParticipants = [];
    }
    
    let guestEntry = this.guestParticipants.find(entry => entry.userId === userId);
    
    if (guestEntry) {
      if (guestEntry.count + guestCount > maxGuests) {
        throw new Error(`Превышен лимит приглашений (максимум ${maxGuests} гостей)`);
      }
      guestEntry.count += guestCount;
    } else {
      if (guestCount > maxGuests) {
        throw new Error(`Превышен лимит приглашений (максимум ${maxGuests} гостей)`);
      }
      this.guestParticipants.push({ userId, count: guestCount });
    }
    
    return this;
  };

  // Добавьте эти строки в конец файла models/Event.js, перед module.exports = Event;
Event.associate = function(models) {
  Event.belongsTo(models.User, { 
    foreignKey: 'creatorId', 
    as: 'creator' 
  });
};

module.exports = Event;