// handlers/handlers.go
package handlers

import (
	"backend/database"
	"backend/models"
	"backend/utils"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Пользователь не найден"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// JoinEvent godoc
// @Summary Присоединиться к событию
// @Description Добавляет пользователя к событию
// @Tags События пользователя
// @Accept  json
// @Produce  json
// @Param id path string true "ID события"
// @Success 200 {object} SuccessResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /events/{id}/join [post]
func JoinEvent(c *gin.Context) {
	var request struct {
		UserID  int `json:"user_id"`
		EventID int `json:"event_id"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Проверяем существование события
	var event models.Event
	if err := database.DB.First(&event, request.EventID).Error; err != nil {
		c.JSON(404, gin.H{"error": "Event not found"})
		return
	}

	// Добавляем пользователя к событию
	event.UserIDs = append(event.UserIDs, request.UserID)
	if err := database.DB.Save(&event).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to join event"})
		return
	}

	c.JSON(200, gin.H{"message": "User joined event successfully"})
}

// GetUserByID godoc
// @Summary Получить события пользователя по ID
// @Description Возвращает события пользователя по его ID
// @Tags users
// @Accept  json
// @Produce  json
// @Param id path string true "ID пользователя"
// @Success 200 {object} models.User
// @Failure 404 {object} ErrorResponse
// @Router /getUserEvent/{id} [get]
func GetEventsByUserIDHandler(c *gin.Context) {
	userID := c.Param("user_id")
	var events []models.Event

	if err := database.DB.Where("? = ANY(user_ids)", userID).Find(&events).Error; err != nil {
		c.JSON(404, gin.H{"error": "No events found for user"})
		return
	}

	c.JSON(200, gin.H{"events": events})
}

// func GetUserEvents(userID int) ([]models.Event, error) {
// 	var user models.User
// 	if err := database.DB.Preload("Events").First(&user, userID).Error; err != nil {
// 		return nil, err
// 	}
// 	return user.Events, nil
// }

// GetEventParticipants godoc
// @Summary Получить участников события
// @Description Возвращает список участников события по его ID
// @Tags events
// @Accept  json
// @Produce  json
// @Param id path string true "ID события"
// @Success 200 {array} models.User
// @Failure 404 {object} ErrorResponse
// @Router /events/{id}/participants [get]
func GetEventParticipantsHandler(c *gin.Context) {
	eventID := c.Param("id") // ID события из маршрута
	var event models.Event

	if err := database.DB.Preload("Users").First(&event, eventID).Error; err != nil {
		c.JSON(404, gin.H{"error": "Event not found"})
		return
	}

	c.JSON(200, gin.H{"participants": event.UserIDs})
}

// RegisterHandler godoc
// @Summary Регистрация пользователя
// @Description Отправляет код подтверждения на email
// @Tags auth
// @Accept  json
// @Produce  json
// @Param input body RegisterRequest true "Данные для регистрации"
// @Success 200 {object} SuccessResponse
// @Failure 500 {object} ErrorResponse
// @Router /register [post]
func RegisterHandler(c *gin.Context) {
	// Парсим входящие данные
	var input RegisterRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	// Проверяем, существует ли пользователь с таким email
	var existingUser models.User
	if err := database.DB.Where("email = ?", input.Email).First(&existingUser).Error; err != nil {
		// Если ошибка НЕ record not found, возвращаем ошибку
		if err != gorm.ErrRecordNotFound {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Ошибка проверки пользователя"})
			return
		}
	}

	// Если пользователь существует, возвращаем ошибку
	if existingUser.ID != 0 {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Пользователь с таким email уже существует"})
		return
	}

	// Генерируем код подтверждения
	confirmationCode := utils.GenerateCode()
	confirmationExpiresAt := time.Now().Add(10 * time.Minute)
	user := models.User{
		Email:                 input.Email,
		Username:              input.Username,
		Password:              input.Password, // Хэшируем пароль
		Confirmation:          confirmationCode,
		Confirmed:             false,
		ConfirmationExpiresAt: confirmationExpiresAt,
	}

	// Отправляем письмо с кодом подтверждения
	if err := utils.SendEmail(user.Email, user.Confirmation); err != nil {

		// Создаем пользователя

		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Ошибка отправки email"})
		return
	}

	// Сохраняем пользователя в базе
	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Ошибка создания пользователя"})
		return
	}

	// Успешный ответ
	c.JSON(http.StatusCreated, SuccessResponse{Message: "Пользователь зарегистрирован. Проверьте ваш email."})
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

	// Логируем входные данные
	log.Printf("Полученные данные для подтверждения: email = %s, code = %s", input.Email, input.Code)

	// Проверка на пустые значения
	if input.Email == "" || input.Code == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Email или код подтверждения не могут быть пустыми"})
		return
	}

	// Поиск пользователя по email и коду подтверждения
	var user models.User
	if err := database.DB.Where("email = ? AND confirmation = ?", input.Email, input.Code).First(&user).Error; err != nil {
		log.Printf("Ошибка при поиске пользователя: %v", err)
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Неверный код"})
		return
	}

	// Проверяем истечение времени
	if time.Now().After(user.ConfirmationExpiresAt) {
		// Удаляем пользователя, если код истек
		database.DB.Delete(&user)
		log.Printf("Код подтверждения истек для пользователя: %s", user.Email)
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Код подтверждения истек"})
		return
	}

	// Подтверждаем email
	user.Confirmed = true
	if err := database.DB.Save(&user).Error; err != nil {
		log.Printf("Ошибка при сохранении пользователя: %v", err)
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Ошибка при сохранении пользователя"})
		return
	}

	log.Printf("Email успешно подтвержден для пользователя: %s", user.Email)
	c.JSON(http.StatusOK, SuccessResponse{Message: "Email подтвержден."})
}
