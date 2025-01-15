package utils

import (
	"crypto/tls"
	"net/smtp"
)

// SendEmail отправляет email с кодом подтверждения
func SendEmail(to, confirmationCode string) error {
	// Настройки SMTP
	smtpHost := "smtp.beget.com"
	smtpPort := "465" // SSL порт
	from := "service@thrivy.fun"
	password := "Go7Wm2GxRe*3"

	// Формирование сообщения
	subject := "Subject: Подтверждение email\n"
	fromHeader := "From: service@thrivy.fun\n"
	toHeader := "To: " + to + "\n"
	body := "Ваш код подтверждения: Действует 10 минут" + confirmationCode
	message := []byte(fromHeader + toHeader + subject + "\n" + body)

	// Настройка TLS
	tlsConfig := &tls.Config{
		InsecureSkipVerify: true, // Убедись, что сертификат сервера проверен. Лучше включить это в продакшене.
		ServerName:         smtpHost,
	}

	// Установка соединения с TLS
	conn, err := tls.Dial("tcp", smtpHost+":"+smtpPort, tlsConfig)
	if err != nil {
		return err
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, smtpHost)
	if err != nil {
		return err
	}
	defer client.Close()

	// Аутентификация
	auth := smtp.PlainAuth("", from, password, smtpHost)
	if err := client.Auth(auth); err != nil {
		return err
	}

	// Указываем отправителя и получателя
	if err := client.Mail(from); err != nil {
		return err
	}
	if err := client.Rcpt(to); err != nil {
		return err
	}

	// Отправляем сообщение
	w, err := client.Data()
	if err != nil {
		return err
	}
	if _, err := w.Write(message); err != nil {
		return err
	}
	if err := w.Close(); err != nil {
		return err
	}

	return client.Quit()
}

// // loginAuth реализует аутентификацию методом LOGIN
// func loginAuth(username, password string) smtp.Auth {
// 	return &loginAuthStruct{
// 		username: username,
// 		password: password,
// 	}
// }

// type loginAuthStruct struct {
// 	username, password string
// }

// func (a *loginAuthStruct) Start(server *smtp.ServerInfo) (string, []byte, error) {
// 	return "LOGIN", nil, nil
// }

// func (a *loginAuthStruct) Next(fromServer []byte, more bool) ([]byte, error) {
// 	if more {
// 		switch string(fromServer) {
// 		case "Username:":
// 			return []byte(a.username), nil
// 		case "Password:":
// 			return []byte(a.password), nil
// 		default:
// 			return nil, fmt.Errorf("неизвестный запрос от сервера: %s", fromServer)
// 		}
// 	}
// 	return nil, nil
// }
