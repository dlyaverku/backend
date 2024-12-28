package models

import "time"

// User represents a user in the database
type User struct {
	ID                    int       `gorm:"primaryKey"` // Скрываем ID
	Email                 string    `gorm:"unique" json:"email" example:"user@example.com"`
	Username              string    `json:"username" example:"JohnDoe"`     // Имя пользователя
	Password              string    `json:"password" example:"password123"` // Пароль
	Confirmation          string    `json:"-"`                              // Скрываем Confirmation
	Confirmed             bool      `json:"-"`                              // Скрываем Confirmed
	ConfirmationExpiresAt time.Time `json:"-"`                              // Скрываем таймер подтверждения
}
