const { sequelize } = require('../config/database'); // Исправьте путь, если нужно
const { DataTypes } = require('sequelize');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ""
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  isEmailVisible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  telegram: {
    type: DataTypes.STRING,
    defaultValue: ""
  },
  isTelegramVisible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: ""
  },
  interests: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  aboutMe: {
    type: DataTypes.TEXT,
    defaultValue: ""
  }
}, {
  timestamps: true
});

// Модель для рейтинга ELO в разных видах спорта
const UserRating = sequelize.define('UserRating', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
  sportType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  eloRating: {
    type: DataTypes.INTEGER,
    defaultValue: 1000
  }
});

// Отношения
User.hasMany(UserRating);
UserRating.belongsTo(User);

module.exports = { User, UserRating };