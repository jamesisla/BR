package payments

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"tienda-backend/internal/models"
)

type MercadoPagoProvider struct {
	client *http.Client
}

func NewMercadoPagoProvider() *MercadoPagoProvider {
	return &MercadoPagoProvider{
		client: &http.Client{Timeout: 15 * time.Second},
	}
}

func (p *MercadoPagoProvider) ID() string {
	return "mercadopago"
}

func (p *MercadoPagoProvider) Name() string {
	return "Mercado Pago (Tarjetas Débito / Crédito)"
}

func (p *MercadoPagoProvider) Description() string {
	return "Paga de forma 100% segura con Tarjetas de Débito (Redcompra), Crédito en cuotas, Prepago (Mach, Tenpo) o saldo Mercado Pago."
}

func (p *MercadoPagoProvider) Icon() string {
	return "credit_card"
}

func (p *MercadoPagoProvider) Type() string {
	return "redirect"
}

func (p *MercadoPagoProvider) IsEnabled(settings *models.StoreSettings) bool {
	if settings == nil {
		return false
	}
	return settings.PaymentMercadoPagoEnabled && settings.MercadoPagoAccessToken != ""
}

func (p *MercadoPagoProvider) GetClientConfig(settings *models.StoreSettings) map[string]interface{} {
	cfg := make(map[string]interface{})
	if settings != nil {
		cfg["public_key"] = settings.MercadoPagoPublicKey
		cfg["sandbox"] = settings.MercadoPagoSandbox
	}
	return cfg
}

type MPPreferenceItem struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Description string  `json:"description,omitempty"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	CurrencyID  string  `json:"currency_id"`
}

type MPPreferencePayer struct {
	Name  string `json:"name,omitempty"`
	Email string `json:"email,omitempty"`
}

type MPPreferenceBackURLs struct {
	Success string `json:"success"`
	Pending string `json:"pending"`
	Failure string `json:"failure"`
}

type MPPreferenceRequest struct {
	Items              []MPPreferenceItem   `json:"items"`
	Payer              *MPPreferencePayer   `json:"payer,omitempty"`
	ExternalReference  string               `json:"external_reference"`
	BackURLs           MPPreferenceBackURLs `json:"back_urls"`
	AutoReturn         string               `json:"auto_return"`
	NotificationURL    string               `json:"notification_url,omitempty"`
	StatementDescriptor string              `json:"statement_descriptor,omitempty"`
}

type MPPreferenceResponse struct {
	ID               string `json:"id"`
	InitPoint        string `json:"init_point"`
	SandboxInitPoint string `json:"sandbox_init_point"`
	Message          string `json:"message,omitempty"`
	Status           int    `json:"status,omitempty"`
}

func (p *MercadoPagoProvider) CreatePayment(c *gin.Context, order *models.Order, settings *models.StoreSettings) (*PaymentResponse, error) {
	if settings == nil || settings.MercadoPagoAccessToken == "" {
		return nil, fmt.Errorf("Mercado Pago no está configurado (Access Token faltante)")
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
	storeTitle := settings.Name
	if storeTitle == "" {
		storeTitle = "Tienda"
	}

	var items []MPPreferenceItem
	if len(order.Items) > 0 {
		for _, it := range order.Items {
			title := fmt.Sprintf("Producto %s", it.ProductID)
			if it.Product != nil && it.Product.Name != "" {
				title = it.Product.Name
			}
			items = append(items, MPPreferenceItem{
				ID:         it.ProductID,
				Title:      title,
				Quantity:   it.Quantity,
				UnitPrice:  it.PriceAtPurchase,
				CurrencyID: "CLP",
			})
		}
	} else {
		items = append(items, MPPreferenceItem{
			ID:         order.ID,
			Title:      fmt.Sprintf("Pedido #%s en %s", order.ID, storeTitle),
			Quantity:   1,
			UnitPrice:  order.Total,
			CurrencyID: "CLP",
		})
	}

	prefReq := MPPreferenceRequest{
		Items: items,
		Payer: &MPPreferencePayer{
			Name:  fmt.Sprintf("%s %s", order.FirstName, order.LastName),
			Email: order.Email,
		},
		ExternalReference: order.ID,
		BackURLs: MPPreferenceBackURLs{
			Success: fmt.Sprintf("%s/checkout/success?order_id=%s&provider=mercadopago", baseURL, order.ID),
			Pending: fmt.Sprintf("%s/checkout/success?order_id=%s&status=pending", baseURL, order.ID),
			Failure: fmt.Sprintf("%s/checkout?error=payment_failed", baseURL),
		},
		AutoReturn:      "approved",
		NotificationURL: fmt.Sprintf("%s/api/payments/webhook/mercadopago", baseURL),
	}

	reqBytes, err := json.Marshal(prefReq)
	if err != nil {
		return nil, fmt.Errorf("error serializando preferencia: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(c.Request.Context(), "POST", "https://api.mercadopago.com/checkout/preferences", bytes.NewReader(reqBytes))
	if err != nil {
		return nil, fmt.Errorf("error creando request a Mercado Pago: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+strings.TrimSpace(settings.MercadoPagoAccessToken))

	resp, err := p.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("error contactando a Mercado Pago: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("Mercado Pago retornó error HTTP %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var mpResp MPPreferenceResponse
	if err := json.Unmarshal(bodyBytes, &mpResp); err != nil {
		return nil, fmt.Errorf("error decodificando respuesta de Mercado Pago: %w", err)
	}

	redirectURL := mpResp.InitPoint
	if settings.MercadoPagoSandbox && mpResp.SandboxInitPoint != "" {
		redirectURL = mpResp.SandboxInitPoint
	}

	return &PaymentResponse{
		Status:        "redirect",
		RedirectURL:   redirectURL,
		PreferenceID:  mpResp.ID,
		TransactionID: order.ID,
		Message:       "Preferencia de pago creada con éxito.",
		Details: map[string]interface{}{
			"init_point":         mpResp.InitPoint,
			"sandbox_init_point": mpResp.SandboxInitPoint,
			"preference_id":      mpResp.ID,
		},
	}, nil
}

func (p *MercadoPagoProvider) HandleWebhook(c *gin.Context, settings *models.StoreSettings) (*WebhookResult, error) {
	// Mercado Pago IPN / Webhook handler
	// Supports query params (?topic=payment&id=123 or ?type=payment&data.id=123) and JSON payload
	topic := c.Query("topic")
	if topic == "" {
		topic = c.Query("type")
	}

	paymentID := c.Query("id")
	if paymentID == "" {
		paymentID = c.Query("data.id")
	}

	if paymentID == "" {
		var body map[string]interface{}
		if err := c.ShouldBindJSON(&body); err == nil {
			if data, ok := body["data"].(map[string]interface{}); ok {
				if id, exists := data["id"]; exists {
					paymentID = fmt.Sprintf("%v", id)
				}
			}
			if topic == "" {
				if t, ok := body["type"].(string); ok {
					topic = t
				}
			}
		}
	}

	if paymentID == "" || (topic != "payment" && topic != "" && topic != "merchant_order") {
		return &WebhookResult{Handled: true, Status: "ignored"}, nil
	}

	if settings == nil || settings.MercadoPagoAccessToken == "" {
		return nil, fmt.Errorf("Mercado Pago no configurado en tienda")
	}

	// Fetch payment status directly from Mercado Pago API
	apiURL := fmt.Sprintf("https://api.mercadopago.com/v1/payments/%s", paymentID)
	req, err := http.NewRequestWithContext(c.Request.Context(), "GET", apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(settings.MercadoPagoAccessToken))

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("error consultando pago %s en Mercado Pago (HTTP %d): %s", paymentID, resp.StatusCode, string(body))
	}

	var paymentData struct {
		ID                int64   `json:"id"`
		Status            string  `json:"status"` // approved, pending, in_process, rejected, cancelled, refunded
		ExternalReference string  `json:"external_reference"`
		TransactionAmount float64 `json:"transaction_amount"`
		PaymentMethodID   string  `json:"payment_method_id"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&paymentData); err != nil {
		return nil, err
	}

	orderStatus := "pending"
	if paymentData.Status == "approved" {
		orderStatus = "paid"
	} else if paymentData.Status == "rejected" || paymentData.Status == "cancelled" {
		orderStatus = "cancelled"
	}

	return &WebhookResult{
		Handled:       true,
		OrderID:       paymentData.ExternalReference,
		Status:        orderStatus,
		PaymentID:     fmt.Sprintf("%d", paymentData.ID),
		PaymentMethod: fmt.Sprintf("Mercado Pago (%s)", paymentData.PaymentMethodID),
		RawDetails:    fmt.Sprintf("Status: %s, Amount: $%.0f", paymentData.Status, paymentData.TransactionAmount),
	}, nil
}
