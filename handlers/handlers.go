package handlers

import (
	"backend/handlers/events"
	"backend/handlers/users"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	r.GET("/users", users.GetUsers)
	r.POST("/events", events.CreateEventHandler)
	r.GET("/events", events.GetEvents)
}
