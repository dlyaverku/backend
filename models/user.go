package models

// User представляет модель данных пользователя
type User struct {
	ID       int    `json:"id"`       // Уникальный ID
	Username string `json:"username"` // Имя пользователя
	Email    string `json:"email"`    // Email
}
