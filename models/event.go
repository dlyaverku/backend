package models

type Event struct {
	ID           uint        `json:"id" gorm:"primaryKey"`
	Title        string      `json:"title" binding:"required"`
	Description  string      `json:"description"`
	MainImage    string      `json:"main_image"`
	Images       StringSlice `json:"images" gorm:"type:json"` // Используем кастомный тип
	CreatorID    uint        `json:"creator_id"`
	Date         string      `json:"date"`
	Location     string      `json:"location"`
	Participants []User      `json:"participants" gorm:"many2many:event_users"`
}

// // Сохранение в базу данных
// func SaveEvent(event Event) error {
//     imagesJSON, err := json.Marshal(event.Images) // Преобразуем массив в JSON строку
//     if err != nil {
//         return err
//     }

//     _, err = database.DB.Exec("INSERT INTO events (title, description, images) VALUES (?, ?, ?)",
//         event.Title, event.Description, string(imagesJSON))
//     return err
// }

// // Чтение из базы данных
// func GetEvent(eventID int) (*Event, error) {
//     var event Event
//     var imagesJSON string

//     err := database.DB.QueryRow("SELECT id, title, description, images FROM events WHERE id = ?", eventID).
//         Scan(&event.ID, &event.Title, &event.Description, &imagesJSON)
//     if err != nil {
//         return nil, err
//     }

//     // Преобразуем JSON строку обратно в массив
//     if err := json.Unmarshal([]byte(imagesJSON), &event.Images); err != nil {
//         return nil, err
//     }

//     return &event, nil
// }
