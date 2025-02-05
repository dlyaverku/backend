package models

type EventUser struct {
	EventID uint `gorm:"primaryKey"`
	UserID  uint `gorm:"primaryKey"`
}
