package payments

import (
	"fmt"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"tienda-backend/internal/models"
)

type WhatsAppManualProvider struct{}

func NewWhatsAppManualProvider() *WhatsAppManualProvider {
	return &WhatsAppManualProvider{}
}

func (p *WhatsAppManualProvider) ID() string {
	return "whatsapp_manual"
}

func (p *WhatsAppManualProvider) Name() string {
	return "Transferencia Bancaria & Pedido por WhatsApp"
}

func (p *WhatsAppManualProvider) Description() string {
	return "Transfiere directamente a CuentaRUT o Cuenta Corriente y confirma tu pedido al instante por WhatsApp."
}

func (p *WhatsAppManualProvider) Icon() string {
	return "whatsapp"
}

func (p *WhatsAppManualProvider) Type() string {
	return "manual"
}

func (p *WhatsAppManualProvider) IsEnabled(settings *models.StoreSettings) bool {
	if settings == nil {
		return true
	}
	return settings.PaymentWhatsAppEnabled
}

func (p *WhatsAppManualProvider) GetClientConfig(settings *models.StoreSettings) map[string]interface{} {
	cfg := make(map[string]interface{})
	if settings != nil {
		cfg["whatsapp_number"] = settings.WhatsAppNumber
		cfg["bank_details"] = settings.BankDetails
	}
	return cfg
}

func (p *WhatsAppManualProvider) CreatePayment(c *gin.Context, order *models.Order, settings *models.StoreSettings) (*PaymentResponse, error) {
	rawNumber := "+56912345678"
	storeName := "la tienda"
	bankDetails := "BancoEstado | CuentaRUT: 12.345.678-9"

	if settings != nil {
		if settings.WhatsAppNumber != "" {
			rawNumber = settings.WhatsAppNumber
		}
		if settings.Name != "" {
			storeName = settings.Name
		}
		if settings.BankDetails != "" {
			bankDetails = settings.BankDetails
		}
	}

	cleanPhone := strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, rawNumber)

	msg := fmt.Sprintf("👋 ¡Hola! Me gustaría hacer el pedido *#%s* en *%s*:\n\n", order.ID, storeName)
	msg += fmt.Sprintf("📦 *Total a Transferir:* $%d CLP\n", int64(order.Total))
	msg += fmt.Sprintf("👤 *Cliente:* %s %s\n", order.FirstName, order.LastName)
	msg += fmt.Sprintf("📍 *Entrega:* %s\n\n", order.Address)
	msg += fmt.Sprintf("🏦 *Datos de Transferencia:*\n%s\n\n", bankDetails)
	msg += "¿Podrías confirmarme la recepción? Adjuntaré el comprobante a la brevedad."

	waURL := fmt.Sprintf("https://wa.me/%s?text=%s", cleanPhone, url.QueryEscape(msg))

	return &PaymentResponse{
		Status:        "instructions",
		RedirectURL:   waURL,
		TransactionID: order.ID,
		Message:       "Pedido registrado. Redirigiendo a WhatsApp para envío de comprobante...",
		Details: map[string]interface{}{
			"whatsapp_url": waURL,
			"bank_details": bankDetails,
		},
	}, nil
}

func (p *WhatsAppManualProvider) HandleWebhook(c *gin.Context, settings *models.StoreSettings) (*WebhookResult, error) {
	// WhatsApp manual transfer does not receive machine webhooks (verified manually by merchant)
	return &WebhookResult{
		Handled: false,
		Status:  "manual",
	}, nil
}
