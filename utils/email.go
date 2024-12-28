package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func SendEmail(to, code string) error {
	apiKey := "mlsn.88159042d7104ee6f68578521250a68a738abd059523fe7aa83382f39dee9f50" // Вставьте ваш API-ключ

	url := "https://api.mailersend.com/v1/email"

	// Создаем тело запроса
	data := map[string]interface{}{
		"from": map[string]string{
			"email": "MS_3fLbiI@trial-x2p0347djd34zdrn.mlsender.net", // Замените на ваш подтвержденный email
		},
		"to": []map[string]string{
			{"email": to},
		},
		"subject": "Confirmation Code",
		"text":    "Your confirmation code is: " + code,
	}
	body, _ := json.Marshal(data)

	// Отправляем запрос
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		return fmt.Errorf("failed to send email: %v", resp.Status)
	}

	return nil
}
