package models

import "time"

// User представляет структуру пользователя
type User struct {
	ID        int       `json:"id" gorm:"primaryKey"`         // Идентификатор (скрыт в JSON)
	Name      string    `json:"name" gorm:"not null"`         // Имя пользователя
	Email     string    `json:"email" gorm:"unique;not null"` // Email (уникальный)
	Avatar    string    `json:"avatar"`
	Password  string    `json:"-" gorm:"not null"`                              // Пароль (скрыт в JSON)
	CreatedAt time.Time `json:"-" gorm:"autoCreateTime"`                        // Время создания (скрыто в JSON)
	UpdatedAt time.Time `json:"-" gorm:"autoUpdateTime"`                        // Время обновления (скрыто в JSON)
	Events    []Event   `json:"events,omitempty" gorm:"many2many:user_events;"` // События пользователя
}
