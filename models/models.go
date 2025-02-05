package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

type EmailRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type VerificationRequest struct {
	Email string `json:"email" binding:"required,email"`
	Code  string `json:"code" binding:"required"`
}

type Response struct {
	Message string `json:"message"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type StringSlice []string

// Реализуем интерфейс Scanner для чтения из БД
func (s *StringSlice) Scan(value interface{}) error {
	if value == nil {
		*s = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("неверный тип данных для StringSlice")
	}
	return json.Unmarshal(bytes, s)
}

// Реализуем интерфейс Valuer для записи в БД
func (s StringSlice) Value() (driver.Value, error) {
	if s == nil {
		return nil, nil
	}
	return json.Marshal(s)
}
