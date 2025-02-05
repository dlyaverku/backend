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
		Title        string   `json:"title"`
		Description  string   `json:"description"`
		MainImage    string   `json:"main_image"`
		Images       []string `json:"images"`
		CreatorID    uint     `json:"creator_id"`
		Date         string   `json:"date"`
		Location     string   `json:"location"`
		Participants []struct {
			ID uint `json:"id"`
		} `json:"participants"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Проверяем дату
	parsedDate, err := utils.ParseAndValidateDate(request.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Проверяем существование создателя
	var creator models.User
	if err := database.DB.First(&creator, request.CreatorID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Создатель не найден"})
		return
	}

	// Проверяем всех участников перед созданием события
	var participants []models.User
	for _, p := range request.Participants {
		var user models.User
		if err := database.DB.First(&user, p.ID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Участник с ID %d не найден", p.ID)})
			return // Прерываем выполнение ДО сохранения события
		}
		participants = append(participants, user)
	}

	// Используем транзакцию для атомарности
	tx := database.DB.Begin()
	//defer tx.RollbackUnlessCommitted()

	// Создаем событие
	event := models.Event{
		Title:       request.Title,
		Description: request.Description,
		MainImage:   request.MainImage,
		Images:      request.Images,
		CreatorID:   request.CreatorID,
		Date:        parsedDate.Format("02.01 15:04"),
		Location:    request.Location,
	}

	if err := tx.Create(&event).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании события"})
		return
	}

	// Добавляем участников
	if err := tx.Model(&event).Association("Participants").Append(participants); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при добавлении участников"})
		return
	}

	// Фиксируем транзакцию
	tx.Commit()

	// Возвращаем полное событие
	var fullEvent models.Event
	if err := database.DB.Preload("Participants").First(&fullEvent, event.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении события"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"event": fullEvent})
}
