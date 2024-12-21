package handlers

import (
	"net/http"
	"strconv"

	"backend/models"

	"github.com/gin-gonic/gin"
)

var users = []models.User{
	{ID: 1, Username: "Valera", Email: "john@example.com"},
	{ID: 2, Username: "Serega", Email: "jane@example.com"},
}

// GetUsers возвращает список пользователей
// @Summary Get all users
// @Description Возвращает JSON со списком пользователей
// @Tags Users
// @Produce json
// @Success 200 {array} models.User
// @Router /users [get]
func GetUsers(c *gin.Context) {
	c.JSON(http.StatusOK, users)
}

// GetUserByID возвращает пользователя по ID
// @Summary Get user by ID
// @Description Возвращает JSON с данными пользователя
// @Tags Users
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} models.User
// @Failure 404 {string} string "User not found"
// @Router /users/{id} [get]
func GetUserByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, "Invalid ID")
		return
	}

	for _, user := range users {
		if user.ID == id {
			c.JSON(http.StatusOK, user)
			return
		}
	}

	c.JSON(http.StatusNotFound, "User not found")
}
