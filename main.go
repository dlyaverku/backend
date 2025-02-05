package main

import (
	"backend/database"
	_ "backend/docs" // Импорт сгенерированной документации Swagger
	"backend/handlers"
	_ "backend/handlers/events"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title Email Verification API
// @version 1.0
// @description This is a sample server for email verification.
// @host 5.35.83.98:8080
// @BasePath /

func main() {
	r := gin.Default()
	// Инициализация базы данных
	database.Init()

	// Передаем базу данных в контекст запроса
	r.Use(func(c *gin.Context) {
		c.Set("db", database.DB)
		c.Next()
	})
	r.POST("/send-code", handlers.SendVerificationCode)
	r.POST("/verify-code", handlers.VerifyCode)
	handlers.SetupRoutes(r)
	// r.GET("/users", handlers.events.GetRegisteredUsers)
	// r.POST("/events", handlers.CreateEventHandler)
	// r.GET("/events", handlers.events.GetEvents)
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	r.Run(":8080")
}
