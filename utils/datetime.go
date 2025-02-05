package utils

import (
	"errors"
	"time"
)

// ErrInvalidDateFormat используется для обозначения неверного формата даты.
var ErrInvalidDateFormat = errors.New("неверный формат даты. Используйте формат '01.02 16:00'")

// ErrDateInPast используется для обозначения того, что дата находится в прошлом.
var ErrDateInPast = errors.New("дата события не может быть в прошлом")

// ParseAndValidateDate парсит и проверяет дату.
func ParseAndValidateDate(dateStr string) (time.Time, error) {
	now := time.Now()

	// Добавляем текущий год к строке даты
	formattedDate := dateStr + "." + time.Now().Format("2006")

	// Парсим дату с учетом года
	parsedDate, err := time.Parse("02.01 15:04.2006", formattedDate)
	if err != nil {
		return time.Time{}, ErrInvalidDateFormat
	}

	// Убедимся, что дата события не в прошлом
	if parsedDate.Before(now) {
		return time.Time{}, ErrDateInPast
	}

	return parsedDate, nil
}
