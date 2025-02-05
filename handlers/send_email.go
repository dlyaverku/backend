package handlers

import (
	"backend/database"
	"backend/models"
	"backend/utils"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var (
	verificationCodes = make(map[string]struct {
		Code      string
		CreatedAt time.Time
	}) // Хранит коды подтверждения и время их создания
)

// SendVerificationCode godoc
// @Summary Send verification code
// @Description Send a verification code to the provided email
// @Tags email
// @Accept json
// @Produce json
// @Param email body models.EmailRequest true "Email address"
// @Success 200 {object} models.Response
// @Failure 400 {object} models.Response
// @Router /send-code [post]
func SendVerificationCode(c *gin.Context) {
	var emailReq models.EmailRequest
	if err := c.ShouldBindJSON(&emailReq); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Message: "Invalid request"})
		return
	}

	// Проверка, зарегистрирован ли уже пользователь
	var existingUser models.User
	err := database.DB.Where("email = ?", emailReq.Email).First(&existingUser).Error
	if err == nil {
		// Пользователь найден
		c.JSON(http.StatusBadRequest, models.Response{Message: "User already registered"})
		return
	} else if err != gorm.ErrRecordNotFound {
		// Другая ошибка (не связанная с отсутствием записи)
		c.JSON(http.StatusInternalServerError, models.Response{Message: "Database error"})
		return
	}

	// Генерация кода
	code := utils.GenerateCode()
	verificationCodes[emailReq.Email] = struct {
		Code      string
		CreatedAt time.Time
	}{
		Code:      code,
		CreatedAt: time.Now(),
	}

	// Отправка email
	if err := utils.SendEmail(emailReq.Email, code); err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Message: "Failed to send email"})
		return
	}

	c.JSON(http.StatusOK, models.Response{Message: "Verification code sent"})
}

// VerifyCode godoc
// @Summary Verify code
// @Description Verify the code sent to the email
// @Tags email
// @Accept json
// @Produce json
// @Param verification body models.VerificationRequest true "Verification code"
// @Success 200 {object} models.Response
// @Failure 400 {object} models.Response
// @Router /verify-code [post]
func VerifyCode(c *gin.Context) {
	var verificationReq models.VerificationRequest
	if err := c.ShouldBindJSON(&verificationReq); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Message: "Invalid request"})
		return
	}

	// Проверка, зарегистрирован ли уже пользователь
	var existingUser models.User
	err := database.DB.Where("email = ?", verificationReq.Email).First(&existingUser).Error
	if err == nil {
		// Пользователь найден
		c.JSON(http.StatusBadRequest, models.Response{Message: "User already registered"})
		return
	} else if err != gorm.ErrRecordNotFound {
		// Другая ошибка (не связанная с отсутствием записи)
		c.JSON(http.StatusInternalServerError, models.Response{Message: "Database error"})
		return
	}

	// Получение кода и времени создания
	codeData, exists := verificationCodes[verificationReq.Email]
	if !exists {
		c.JSON(http.StatusBadRequest, models.Response{Message: "Invalid code"})
		return
	}

	// Проверка срока действия кода (10 минут)
	if time.Since(codeData.CreatedAt) > 10*time.Minute {
		delete(verificationCodes, verificationReq.Email)
		c.JSON(http.StatusBadRequest, models.Response{Message: "Code expired"})
		return
	}

	// Создание нового пользователя
	newUser := models.User{
		Email:    verificationReq.Email,
		Password: "default_password", // Установите пароль или запросите его у пользователя
		Name:     "User",             // Установите имя или запросите его у пользователя
	}

	// Сохранение пользователя в базу данных
	if err := database.DB.Create(&newUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Message: "Failed to register user"})
		return
	}

	// Удаление кода из временного хранилища
	delete(verificationCodes, verificationReq.Email)

	c.JSON(http.StatusOK, models.Response{Message: "Code verified successfully. User registered."})
}
