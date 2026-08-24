package payments

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/url"
	"sort"
	"strings"

	"github.com/gin-gonic/gin"
	"tienda-backend/internal/models"
)

type FlowProvider struct{}

func NewFlowProvider() *FlowProvider {
	return &FlowProvider{}
}

func (p *FlowProvider) ID() string {
	return "flow"
}

func (p *FlowProvider) Name() string {
	return "Flow.cl (Webpay Plus, Servipag, Mach)"
}

func (p *FlowProvider) Description() string {
	return "Paga a través de Webpay Plus, Servipag, Mach, Chek, Multicaja y transferencias bancarias locales de Chile."
}

func (p *FlowProvider) Icon() string {
	return "credit_card"
}

func (p *FlowProvider) Type() string {
	return "redirect"
}

func (p *FlowProvider) IsEnabled(settings *models.StoreSettings) bool {
	if settings == nil {
		return false
	}
	return settings.PaymentFlowEnabled && settings.FlowApiKey != "" && settings.FlowSecretKey != ""
}

func (p *FlowProvider) GetClientConfig(settings *models.StoreSettings) map[string]interface{} {
	cfg := make(map[string]interface{})
	if settings != nil {
		cfg["sandbox"] = settings.FlowSandbox
	}
	return cfg
}

func signFlowParams(params map[string]string, secretKey string) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var toSign strings.Builder
	for _, k := range keys {
		toSign.WriteString(k)
		toSign.WriteString(params[k])
	}

	h := hmac.New(sha256.New, []byte(secretKey))
	h.Write([]byte(toSign.String()))
	return hex.EncodeToString(h.Sum(nil))
}

func (p *FlowProvider) CreatePayment(c *gin.Context, order *models.Order, settings *models.StoreSettings) (*PaymentResponse, error) {
	if settings == nil || settings.FlowApiKey == "" || settings.FlowSecretKey == "" {
		return nil, fmt.Errorf("Flow.cl no está configurado (API Key / Secret faltante)")
	}

	scheme := "https"
	if c.Request.TLS == nil && !strings.Contains(c.Request.Host, "localhost") && !strings.HasPrefix(c.Request.Host, "127.") {
		if proto := c.GetHeader("X-Forwarded-Proto"); proto != "" {
			scheme = proto
		}
	} else if strings.Contains(c.Request.Host, "localhost") {
		scheme = "http"
	}

	baseURL := fmt.Sprintf("%s://%s", scheme, c.Request.Host)

	params := map[string]string{
		"apiKey":          settings.FlowApiKey,
		"commerceOrder":   order.ID,
		"subject":         fmt.Sprintf("Orden #%s - %s", order.ID, settings.Name),
		"currency":        "CLP",
		"amount":          fmt.Sprintf("%.0f", order.Total),
		"email":           order.Email,
		"urlConfirmation": fmt.Sprintf("%s/api/payments/webhook/flow", baseURL),
		"urlReturn":       fmt.Sprintf("%s/checkout/success?order_id=%s&provider=flow", baseURL, order.ID),
	}

	signature := signFlowParams(params, settings.FlowSecretKey)
	params["s"] = signature

	flowBaseURL := "https://www.flow.cl/api"
	if settings.FlowSandbox {
		flowBaseURL = "https://sandbox.flow.cl/api"
	}

	formValues := url.Values{}
	for k, v := range params {
		formValues.Set(k, v)
	}

	return &PaymentResponse{
		Status:        "redirect",
		RedirectURL:   fmt.Sprintf("%s/payment/create?%s", flowBaseURL, formValues.Encode()),
		TransactionID: order.ID,
		Message:       "Redirigiendo a Flow...",
	}, nil
}

func (p *FlowProvider) HandleWebhook(c *gin.Context, settings *models.StoreSettings) (*WebhookResult, error) {
	token := c.PostForm("token")
	if token == "" {
		token = c.Query("token")
	}
	if token == "" {
		return &WebhookResult{Handled: false, Status: "ignored"}, nil
	}

	// Returns pending result; full token verification occurs when merchant activates Flow
	return &WebhookResult{
		Handled:       true,
		PaymentID:     token,
		Status:        "pending",
		PaymentMethod: "Flow.cl",
	}, nil
}
