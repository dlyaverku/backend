package database

import (
	"backend/models"
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init() {
	var err error
	// Подключение к SQLite
	DB, err = gorm.Open(sqlite.Open("users.db"), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	// Миграции для моделей и промежуточной таблицы
	err = DB.AutoMigrate(&models.User{}, &models.Event{}, &models.EventUser{})
	if err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}
	log.Println("Database connected and migrated successfully")
}
