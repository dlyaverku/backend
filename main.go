package main

import (
	_ "backend/docs" // Подключаем сгенерированные Swagger-документы
	"backend/handlers"

	"github.com/gin-gonic/gin"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title User API
// @version 1.0
// @description API для работы с пользователями.
// @host localhost:8080
// @BasePath /
func main() {
	router := gin.Default()

	// Маршруты API
	router.GET("/users", handlers.GetUsers)
	router.GET("/users/:id", handlers.GetUserByID)

	// Swagger
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Запуск сервера
	router.Run(":8080")
}
