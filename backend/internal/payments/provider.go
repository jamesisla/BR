package payments

import (
	"github.com/gin-gonic/gin"
	"tienda-backend/internal/models"
)

// PaymentMethodInfo represents public client-safe metadata about an enabled payment method
type PaymentMethodInfo struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Icon        string                 `json:"icon"`
	Type        string                 `json:"type"` // "redirect", "manual", "widget"
	Config      map[string]interface{} `json:"config,omitempty"`
}

// PaymentResponse represents the result of initializing a payment
type PaymentResponse struct {
	Status        string                 `json:"status"` // "pending", "redirect", "approved", "instructions"
	RedirectURL   string                 `json:"redirect_url,omitempty"`
	PreferenceID  string                 `json:"preference_id,omitempty"`
	TransactionID string                 `json:"transaction_id,omitempty"`
	Message       string                 `json:"message,omitempty"`
	Details       map[string]interface{} `json:"details,omitempty"`
}

// WebhookResult represents the processed outcome of a payment gateway notification
type WebhookResult struct {
	Handled       bool   `json:"handled"`
	OrderID       string `json:"order_id"`
	Status        string `json:"status"` // "paid", "rejected", "pending", "ignored"
	PaymentID     string `json:"payment_id"`
	PaymentMethod string `json:"payment_method"`
	RawDetails    string `json:"raw_details,omitempty"`
}

// PaymentProvider is the universal contract that all payment modules must satisfy
type PaymentProvider interface {
	ID() string
	Name() string
	Description() string
	Icon() string
	Type() string
	IsEnabled(settings *models.StoreSettings) bool
	GetClientConfig(settings *models.StoreSettings) map[string]interface{}
	CreatePayment(c *gin.Context, order *models.Order, settings *models.StoreSettings) (*PaymentResponse, error)
	HandleWebhook(c *gin.Context, settings *models.StoreSettings) (*WebhookResult, error)
}
