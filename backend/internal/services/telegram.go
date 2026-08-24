package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"tienda-backend/internal/models"
)

type TelegramService struct {
	client *http.Client
}

var globalTelegramService = &TelegramService{
	client: &http.Client{Timeout: 10 * time.Second},
}

func GetTelegramService() *TelegramService {
	return globalTelegramService
}

// SendMessage sends a raw markdown/HTML message to a specific Telegram Chat ID
func (s *TelegramService) SendMessage(botToken, chatID, text string) error {
	botToken = strings.TrimSpace(botToken)
	chatID = strings.TrimSpace(chatID)

	if botToken == "" || chatID == "" {
		return fmt.Errorf("bot token o chat ID vacíos")
	}

	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", botToken)

	payload := map[string]interface{}{
		"chat_id":    chatID,
		"text":       text,
		"parse_mode": "HTML",
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", apiURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("error conectando con Telegram: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("Telegram API error (HTTP %d): %s", resp.StatusCode, string(respBody))
	}

	return nil
}

// SendNewOrderNotification formats and dispatches a rich instant notification to the merchant
func (s *TelegramService) SendNewOrderNotification(settings *models.StoreSettings, order *models.Order) {
	if settings == nil || !settings.TelegramNotificationsEnabled || settings.TelegramBotToken == "" || settings.TelegramChatID == "" {
		return
	}

	storeName := settings.Name
	if storeName == "" {
		storeName = "Tienda"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("🛍️ <b>¡NUEVO PEDIDO EN %s!</b>\n\n", strings.ToUpper(storeName)))
	sb.WriteString(fmt.Sprintf("📦 <b>Orden:</b> <code>#%s</code>\n", order.ID))
	sb.WriteString(fmt.Sprintf("👤 <b>Cliente:</b> %s %s\n", order.FirstName, order.LastName))
	if order.Email != "" {
		sb.WriteString(fmt.Sprintf("📧 <b>Email:</b> %s\n", order.Email))
	}
	if order.Address != "" {
		sb.WriteString(fmt.Sprintf("📍 <b>Entrega:</b> %s\n", order.Address))
	}
	sb.WriteString(fmt.Sprintf("💰 <b>Total a Cobrar:</b> $%.0f CLP\n", order.Total))
	sb.WriteString(fmt.Sprintf("🕒 <b>Fecha:</b> %s\n\n", time.Now().Format("02/01/2006 15:04")))

	sb.WriteString("🛒 <b>Detalle de Productos:</b>\n")
	if len(order.Items) > 0 {
		for _, item := range order.Items {
			name := "Producto"
			if item.Product != nil && item.Product.Name != "" {
				name = item.Product.Name
			}
			sb.WriteString(fmt.Sprintf("• <b>%dx</b> %s — $%.0f CLP\n", item.Quantity, name, item.PriceAtPurchase*float64(item.Quantity)))
		}
	} else {
		sb.WriteString("• (Sin desglose de items)\n")
	}

	if settings.BankDetails != "" {
		sb.WriteString(fmt.Sprintf("\n🏦 <b>Datos Bancarios Tienda:</b>\n<code>%s</code>\n", settings.BankDetails))
	}

	err := s.SendMessage(settings.TelegramBotToken, settings.TelegramChatID, sb.String())
	if err != nil {
		log.Printf("⚠️  [TELEGRAM NOTIFICATION FAILED]: %v", err)
	} else {
		log.Printf("✅ [TELEGRAM NOTIFICATION SENT] Order #%s notified to chat %s", order.ID, settings.TelegramChatID)
	}
}
