package utils

import (
	"fmt"
	"net/smtp"
)

func SendEmail(to, code string) error {
	from := "your_email@beget.com"    // Ваш email на Beget
	password := "your_email_password" // Пароль от почты
	smtpHost := "smtp.beget.com"      // SMTP-сервер Beget
	smtpPort := "465"                 // Порт для защищенного соединения

	// Сообщение
	message := []byte("Subject: Confirmation Code\n\nYour confirmation code is: " + code)

	// Настройка авторизации для Beget
	auth := smtp.PlainAuth("", from, password, smtpHost)

	// Отправка письма
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, message)
	if err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}
