package main

import (
	_ "backend/docs" // Подключаем сгенерированные Swagger-документы
	"backend/handlers"

	"github.com/gin-contrib/cors" // Подключаем библиотеку для работы с CORS
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
	// Создаем новый роутер
	router := gin.Default()

	// Настройка CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://5.35.83.98/"},                      // Разрешаем запросы с фронтенда на localhost:3000
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},            // Разрешаем методы
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"}, // Разрешаем заголовки
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true, // Разрешаем использование cookies и заголовков авторизации
	}))

	// Маршруты API
	router.GET("/users", handlers.GetUsers)
	router.GET("/users/:id", handlers.GetUserByID)

	// Swagger
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Запуск сервера
	router.Run(":8081")
}
