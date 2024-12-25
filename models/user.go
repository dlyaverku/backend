package models

// User represents a user in the database
type User struct {
	ID           int    `gorm:"primaryKey"`
	Email        string `gorm:"unique"`
	Username     string `json:"username"` // Имя пользователя
	Password     string
	Confirmation string
	Confirmed    bool
}
