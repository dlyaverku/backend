package events

import (
	"net/http"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

// UploadImageHandler загружает картинку на сервер и возвращает её URL
func UploadImageHandler(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Не удалось загрузить файл"})
		return
	}

	// Сохраняем файл на сервере
	filename := filepath.Base(file.Filename)
	uploadPath := "uploads/" + filename
	if err := c.SaveUploadedFile(file, uploadPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сохранить файл"})
		return
	}

	// Возвращаем URL файла
	c.JSON(http.StatusOK, gin.H{"url": "/" + uploadPath})
}
