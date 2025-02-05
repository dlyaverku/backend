package events

import (
	"backend/database"
	"backend/models"
	"backend/utils"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// CreateEventHandler godoc
// @Summary Создать событие
// @Description Создает новое событие
// @Tags events
// @Accept json
// @Produce json
// @Param event body models.Event true "Данные события"
// @Success 201 {object} models.Event
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /events [post]
func CreateEventHandler(c *gin.Context) {
	var request struct {
		Title          string   `json:"title"`
		Description    string   `json:"description"`
		MainImage      string   `json:"main_image"`
		Images         []string `json:"images"`
		CreatorID      uint     `json:"creator_id"`
		Date           string   `json:"date"`
		Location       string   `json:"location"`
		ParticipantIDs []uint   `json:"participant_ids"`
	}
	fmt.Println("Participant IDs:", request.ParticipantIDs)
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Проверяем дату
	parsedDate, err := utils.ParseAndValidateDate(request.Date)
	if err != nil {
		switch err {
		case utils.ErrInvalidDateFormat:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case utils.ErrDateInPast:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке даты"})
		}
		return
	}

	// Проверяем, существует ли создатель
	var creator models.User
	if err := database.DB.First(&creator, request.CreatorID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Создатель не найден"})
		return
	}

	// Создаем событие
	event := models.Event{
		Title:       request.Title,
		Description: request.Description,
		MainImage:   request.MainImage,
		Images:      request.Images,
		CreatorID:   request.CreatorID,
		Date:        parsedDate.Format("02.01 15:04"), // Сохраняем дату без года
		Location:    request.Location,
	}

	// Сохраняем событие в базе данных
	if err := database.DB.Create(&event).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании события"})
		return
	}

	// Добавляем участников к событию
	var participants []models.User
	for _, userID := range request.ParticipantIDs {
		var user models.User
		if err := database.DB.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Участник не найден"})
			return
		}
		participants = append(participants, user)
	}

	if err := database.DB.Model(&event).Association("Participants").Append(participants); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при добавлении участников"})
		return
	}

	// Получаем полную информацию о событии с участниками
	var fullEvent models.Event
	if err := database.DB.Preload("Participants").First(&fullEvent, event.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении информации о событии"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"event": fullEvent})
}
