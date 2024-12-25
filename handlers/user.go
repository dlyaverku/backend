// handlers/handlers.go
package handlers

import (
	"backend/database"
	"backend/models"
	"backend/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Error string `json:"error"`
}

type SuccessResponse struct {
	Message string `json:"message"`
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
// @Param user body models.User true "Данные пользователя"
// @Success 201 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /register [post]
func RegisterHandler(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	user.Confirmation = utils.GenerateCode()
	user.Confirmed = false

	database.DB.Create(&user)

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
// @Param input body map[string]string true "Email и код подтверждения"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Router /confirm [post]
func ConfirmHandler(c *gin.Context) {
	var input struct {
		Email string `json:"email"`
		Code  string `json:"code"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("email = ? AND confirmation = ?", input.Email, input.Code).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid code"})
		return
	}

	user.Confirmed = true
	database.DB.Save(&user)

	c.JSON(http.StatusOK, SuccessResponse{Message: "Email confirmed."})
}
