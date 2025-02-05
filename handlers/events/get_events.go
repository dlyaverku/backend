package events

import (
	"backend/database"
	"backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetEvents godoc
// @Summary Получить список событий
// @Description Получает список всех событий с участниками
// @Tags events
// @Produce json
// @Success 200 {array} models.Event
// @Router /events [get]
func GetEvents(c *gin.Context) {
	var events []models.Event
	if err := database.DB.Preload("Participants").Find(&events).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении событий"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"events": events})
}
