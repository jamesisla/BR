package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"tienda-backend/internal/config"
	"tienda-backend/internal/models"
)

type MercadoPagoService struct {
	cfg        *config.Config
	httpClient *http.Client
}

func NewMercadoPagoService(cfg *config.Config) *MercadoPagoService {
	return &MercadoPagoService{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

type MPItem struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	CurrencyID  string  `json:"currency_id,omitempty"`
	Description string  `json:"description,omitempty"`
}

type MPPayer struct {
	Email   string `json:"email"`
	Name    string `json:"name"`
	Surname string `json:"surname"`
}

type MPBackURLs struct {
	Success string `json:"success"`
	Failure string `json:"failure"`
	Pending string `json:"pending"`
}

type MPPreferenceRequest struct {
	Items             []MPItem   `json:"items"`
	Payer             MPPayer    `json:"payer"`
	BackURLs          MPBackURLs `json:"back_urls"`
	AutoReturn        string     `json:"auto_return"`
	ExternalReference string     `json:"external_reference"`
	NotificationURL   string     `json:"notification_url"`
}

type MPPreferenceResponse struct {
	ID                string `json:"id"`
	InitPoint         string `json:"init_point"`
	SandboxInitPoint  string `json:"sandbox_init_point"`
	ExternalReference string `json:"external_reference"`
}

type MPPaymentResponse struct {
	ID                int64   `json:"id"`
	Status            string  `json:"status"`
	StatusDetail      string  `json:"status_detail"`
	ExternalReference string  `json:"external_reference"`
	TransactionAmount float64 `json:"transaction_amount"`
}

func (s *MercadoPagoService) CreatePreference(order *models.Order) (*MPPreferenceResponse, error) {
	var items []MPItem
	for _, item := range order.Items {
		title := "Producto"
		if item.Product != nil && item.Product.Name != "" {
			title = item.Product.Name
		}
		items = append(items, MPItem{
			ID:        item.ProductID,
			Title:     title,
			Quantity:  item.Quantity,
			UnitPrice: item.PriceAtPurchase,
		})
	}

	// Add shipping cost if applicable ($5.0)
	items = append(items, MPItem{
		ID:        "shipping",
		Title:     "Envío a Domicilio",
		Quantity:  1,
		UnitPrice: 5.0,
	})

	prefReq := MPPreferenceRequest{
		Items: items,
		Payer: MPPayer{
			Email:   order.Email,
			Name:    order.FirstName,
			Surname: order.LastName,
		},
		BackURLs: MPBackURLs{
			Success: fmt.Sprintf("%s/checkout/success?orderId=%s", s.cfg.FrontendURL, order.ID),
			Failure: fmt.Sprintf("%s/checkout", s.cfg.FrontendURL),
			Pending: fmt.Sprintf("%s/checkout", s.cfg.FrontendURL),
		},
		AutoReturn:        "approved",
		ExternalReference: order.ID,
		NotificationURL:   fmt.Sprintf("%s/api/payments/webhook", s.cfg.BackendURL),
	}

	reqBody, err := json.Marshal(prefReq)
	if err != nil {
		return nil, fmt.Errorf("error serializando preferencia: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.mercadopago.com/checkout/preferences", bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("error creando request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.cfg.MPAccessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error llamando a Mercado Pago API: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error leyendo respuesta de Mercado Pago: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("Mercado Pago retornó código %d: %s", resp.StatusCode, string(respBody))
	}

	var prefResp MPPreferenceResponse
	if err := json.Unmarshal(respBody, &prefResp); err != nil {
		return nil, fmt.Errorf("error deserializando respuesta: %w", err)
	}

	return &prefResp, nil
}

func (s *MercadoPagoService) GetPayment(paymentID string) (*MPPaymentResponse, error) {
	req, err := http.NewRequest("GET", fmt.Sprintf("https://api.mercadopago.com/v1/payments/%s", paymentID), nil)
	if err != nil {
		return nil, fmt.Errorf("error creando request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.cfg.MPAccessToken)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error consultando pago en Mercado Pago: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error leyendo respuesta: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error consultando pago, status %d: %s", resp.StatusCode, string(respBody))
	}

	var paymentResp MPPaymentResponse
	if err := json.Unmarshal(respBody, &paymentResp); err != nil {
		return nil, fmt.Errorf("error deserializando pago: %w", err)
	}

	return &paymentResp, nil
}
