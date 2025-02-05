package utils

import (
	"bytes"
	"fmt"
	"html/template"
	"math/rand"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	"gopkg.in/mail.v2"
)

func GenerateCode() string {
	rand.Seed(time.Now().UnixNano())
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

func SendEmail(to, code string) error {
	// Загрузка переменных из .env
	if err := godotenv.Load(); err != nil {
		return fmt.Errorf("failed to load .env file: %v", err)
	}

	// Загрузка HTML-шаблона
	tmpl, err := template.ParseFiles("email/index.html")
	if err != nil {
		return fmt.Errorf("failed to parse template: %v", err)
	}

	// Рендеринг шаблона
	var body bytes.Buffer
	data := struct {
		To   string
		Code string
	}{
		To:   to, // Передаём имя адресата
		Code: code,
	}
	if err := tmpl.Execute(&body, data); err != nil {
		return fmt.Errorf("failed to execute template: %v", err)
	}

	m := mail.NewMessage()
	m.SetHeader("From", os.Getenv("SMTP_FROM"))
	m.SetHeader("To", to)
	m.SetHeader("Subject", "Verification Code")
	m.SetBody("text/html", body.String())

	godotenv.Load()                                 // Загружаем переменные из .env файла
	port, _ := strconv.Atoi(os.Getenv("SMTP_PORT")) // Преобразуем порт в число
	d := mail.NewDialer(
		os.Getenv("SMTP_HOST"),
		port,
		os.Getenv("SMTP_USER"),
		os.Getenv("SMTP_PASSWORD"),
	)

	// Логирование
	fmt.Println("Sending email to:", to)
	fmt.Println("Verification code:", code)
	fmt.Println("Using SMTP server:", os.Getenv("SMTP_HOST"))

	// Отправка email
	if err := d.DialAndSend(m); err != nil {
		fmt.Println("Failed to send email:", err)
		return err
	}

	fmt.Println("Email sent successfully")
	return nil
}
