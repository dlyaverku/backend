package main

import (
	"backend/database"
	_ "backend/docs"
	"backend/handlers"
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title User API
// @version 1.0
// @description API для работы с пользователями.
// @host localhost:8081
// @BasePath /
func main() {
	database.Init() // Инициализация базы данных

	router := gin.Default()

	// Настройка CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://5.35.83.98"}, // Удаляем конечный слэш
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Маршруты API
	router.GET("/users", handlers.GetUsers)
	router.GET("/users/:id", handlers.GetUserByID)
	router.POST("/register", handlers.RegisterHandler)
	router.POST("/confirm", handlers.ConfirmHandler)

	// Swagger
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Запуск сервера
	log.Println("Server started at http://localhost:8081")
	router.Run(":8081")
}
