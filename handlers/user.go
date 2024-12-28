// handlers/handlers.go
package handlers

import (
	"backend/database"
	"backend/models"
	"backend/utils"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Error string `json:"error"`
}

type SuccessResponse struct {
	Message string `json:"message"`
}

// ConfirmRequest описывает тело запроса для подтверждения email
// swagger:model ConfirmRequest
type ConfirmRequest struct {
	Email string `json:"email" example:"user@example.com"`
	Code  string `json:"code" example:"123456"`
}

// RegisterRequest описывает тело запроса для регистрации пользователя
// swagger:model RegisterRequest
type RegisterRequest struct {
	Email    string `json:"email" example:"user@example.com"`
	Username string `json:"username" example:"JohnDoe"`
	Password string `json:"password" example:"password123"`
}

// GetUsers godoc
// @Summary Получить всех пользователей
// @Description Возвращает список всех пользователей
// @Tags users
// @Accept  json
// @Produce  json
// @Success 200 {array} models.User
// @Router /users [get]
func GetUsers(c *gin.Context) {
	var users []models.User
	database.DB.Find(&users)
	c.JSON(http.StatusOK, users)
}

// GetUserByID godoc
// @Summary Получить пользователя по ID
// @Description Возвращает пользователя по его ID
// @Tags users
// @Accept  json
// @Produce  json
// @Param id path string true "ID пользователя"
// @Success 200 {object} models.User
// @Failure 404 {object} ErrorResponse
// @Router /users/{id} [get]
func GetUserByID(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "User not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// RegisterHandler godoc
// @Summary Регистрация пользователя
// @Description Регистрирует нового пользователя и отправляет код подтверждения на email
// @Tags auth
// @Accept  json
// @Produce  json
// @Param input body RegisterRequest true "Данные пользователя"
// @Success 201 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /register [post]
func RegisterHandler(c *gin.Context) {
	// Входящие данные только с нужными полями
	var input RegisterRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	// Генерация Confirmation кода и таймера
	confirmationCode := utils.GenerateCode()
	confirmationExpiresAt := time.Now().Add(10 * time.Minute)

	// Создаем объект пользователя
	user := models.User{
		Email:                 input.Email,
		Username:              input.Username,
		Password:              input.Password, // Хэшируем пароль
		Confirmation:          confirmationCode,
		Confirmed:             false,
		ConfirmationExpiresAt: confirmationExpiresAt,
	}

	// Сохраняем пользователя в базе
	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create user"})
		return
	}

	// Отправляем письмо с кодом подтверждения
	if err := utils.SendEmail(user.Email, user.Confirmation); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to send email"})
		return
	}

	c.JSON(http.StatusCreated, SuccessResponse{Message: "User registered. Please confirm your email."})
}

// ConfirmHandler godoc
// @Summary Подтверждение email
// @Description Подтверждает email пользователя с помощью кода
// @Tags auth
// @Accept  json
// @Produce  json
// @Param input body ConfirmRequest true "Email и код подтверждения"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Router /confirm [post]
func ConfirmHandler(c *gin.Context) {
	var input ConfirmRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("email = ? AND confirmation = ?", input.Email, input.Code).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid code"})
		return
	}

	// Проверяем, истек ли код подтверждения
	if time.Now().After(user.ConfirmationExpiresAt) {
		// Удаляем пользователя
		database.DB.Delete(&user)
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Confirmation code expired"})
		return
	}

	user.Confirmed = true
	database.DB.Save(&user)

	c.JSON(http.StatusOK, SuccessResponse{Message: "Email confirmed."})
}
