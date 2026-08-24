package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"tienda-backend/internal/models"
	"tienda-backend/internal/services"
)

type SettingsHandler struct {
	db *gorm.DB
}

func NewSettingsHandler(db *gorm.DB) *SettingsHandler {
	return &SettingsHandler{db: db}
}

// GetSettings retrieves current store branding configuration
func (h *SettingsHandler) GetSettings(c *gin.Context) {
	var settings models.StoreSettings
	result := h.db.First(&settings)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			// Initialize default
			settings = models.StoreSettings{
				Name:               "TIENDA DEMO PYME",
				LogoURL:            "",
				PrimaryColor:       "#2d1b0e",
				SecondaryColor:     "#9c6644",
				FooterText:         "© 2026 Tienda Demo. Ventas directas por WhatsApp.",
				HeroTitle:          "Emprende con Estilo",
				HeroSubtitle:       "Catálogo digital para PYMEs. Haz tu pedido directo por WhatsApp con transferencia.",
				HeroImageURL:       "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2000&auto=format&fit=crop",
				WhatsAppNumber:     "+56912345678",
				WhatsAppMessage:    "¡Hola! Me gustaría consultar o pedir:",
				BankDetails:        "BancoEstado | CuentaRUT: 12.345.678-9 | Titular: Tienda PYME | Correo: pagos@tienda.cl",
				ShippingInfo:       "Envíos a todo Chile vía Starken / Chilexpress o retiro acordado por WhatsApp.",
				InstagramURL:       "",
				AnnouncementBar:    "🚚 ¡Envíos a todo Chile! Paga fácil y seguro con Transferencia Bancaria",
				AnnouncementActive: true,
				Currency:           "CLP",
				AnalyticsEnabled:   true,
				IgnoreAdminVisits:  true,
			}
			h.db.Create(&settings)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error consultando configuración"})
			return
		}
	}

	c.JSON(http.StatusOK, settings)
}

// UpdateSettings saves updated branding, contact and analytics configuration
func (h *SettingsHandler) UpdateSettings(c *gin.Context) {
	var input models.StoreSettings
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Datos inválidos: " + err.Error()})
		return
	}

	var settings models.StoreSettings
	result := h.db.First(&settings)

	if result.Error == gorm.ErrRecordNotFound {
		settings = input
		if err := h.db.Create(&settings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al crear configuración"})
			return
		}
	} else if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al consultar configuración"})
		return
	} else {
		settings.Name = input.Name
		settings.PrimaryColor = input.PrimaryColor
		settings.SecondaryColor = input.SecondaryColor
		settings.LogoURL = input.LogoURL
		settings.FooterText = input.FooterText
		if input.HeroSize != "" {
			settings.HeroSize = input.HeroSize
		}
		settings.HeroTitle = input.HeroTitle
		settings.HeroSubtitle = input.HeroSubtitle
		settings.HeroImageURL = input.HeroImageURL
		settings.WhatsAppNumber = input.WhatsAppNumber
		settings.WhatsAppMessage = input.WhatsAppMessage
		settings.BankDetails = input.BankDetails
		settings.ShippingInfo = input.ShippingInfo
		settings.InstagramURL = input.InstagramURL
		settings.AnnouncementBar = input.AnnouncementBar
		settings.AnnouncementActive = input.AnnouncementActive
		settings.Currency = input.Currency
		settings.AnalyticsEnabled = input.AnalyticsEnabled
		settings.IgnoreAdminVisits = input.IgnoreAdminVisits

		// Modular Payment Gateways
		settings.PaymentWhatsAppEnabled = input.PaymentWhatsAppEnabled
		settings.PaymentMercadoPagoEnabled = input.PaymentMercadoPagoEnabled
		settings.MercadoPagoPublicKey = input.MercadoPagoPublicKey
		settings.MercadoPagoAccessToken = input.MercadoPagoAccessToken
		settings.MercadoPagoSandbox = input.MercadoPagoSandbox
		settings.PaymentFlowEnabled = input.PaymentFlowEnabled
		settings.FlowApiKey = input.FlowApiKey
		settings.FlowSecretKey = input.FlowSecretKey
		settings.FlowSandbox = input.FlowSandbox

		// Telegram Bot Notifications
		settings.TelegramNotificationsEnabled = input.TelegramNotificationsEnabled
		settings.TelegramBotToken = input.TelegramBotToken
		settings.TelegramChatID = input.TelegramChatID

		if err := h.db.Save(&settings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al actualizar configuración"})
			return
		}
	}

	c.JSON(http.StatusOK, settings)
}

type TestTelegramRequest struct {
	BotToken string `json:"bot_token"`
	ChatID   string `json:"chat_id"`
}

// TestTelegram sends a test notification to verify Telegram Bot configuration
func (h *SettingsHandler) TestTelegram(c *gin.Context) {
	var req TestTelegramRequest
	_ = c.ShouldBindJSON(&req)

	var settings models.StoreSettings
	_ = h.db.First(&settings).Error

	botToken := req.BotToken
	if botToken == "" {
		botToken = settings.TelegramBotToken
	}
	chatID := req.ChatID
	if chatID == "" {
		chatID = settings.TelegramChatID
	}

	if botToken == "" || chatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Por favor ingresa tanto el Bot Token como el Chat ID para enviar la prueba."})
		return
	}

	storeName := settings.Name
	if storeName == "" {
		storeName = "Tienda Demo"
	}

	testMsg := "🧪 <b>¡Conexión Exitosa con Telegram!</b>\n\n" +
		"Las notificaciones de pedidos nuevos para tu tienda <b>" + storeName + "</b> están configuradas correctamente.\n\n" +
		"Recibirás un mensaje instantáneo cada vez que un cliente registre una compra. 🚀"

	err := services.GetTelegramService().SendMessage(botToken, chatID, testMsg)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Error al conectar con Telegram: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "¡Mensaje de prueba enviado con éxito a tu Telegram!",
	})
}
