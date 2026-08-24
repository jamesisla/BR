package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"tienda-backend/internal/models"
	"tienda-backend/internal/payments"
)

type PaymentHandler struct {
	db       *gorm.DB
	registry *payments.Registry
}

func NewPaymentHandler(db *gorm.DB) *PaymentHandler {
	return &PaymentHandler{
		db:       db,
		registry: payments.GetRegistry(),
	}
}

// GetMethods returns the list of available/active payment methods for the store
func (h *PaymentHandler) GetMethods(c *gin.Context) {
	var settings models.StoreSettings
	_ = h.db.First(&settings).Error

	methods := h.registry.GetAvailableMethods(&settings)
	c.JSON(http.StatusOK, gin.H{
		"methods": methods,
	})
}

type CreatePaymentRequest struct {
	OrderID  string `json:"order_id" binding:"required"`
	MethodID string `json:"method_id" binding:"required"`
}

// CreatePayment initializes payment for a specific order with the selected payment provider
func (h *PaymentHandler) CreatePayment(c *gin.Context) {
	var req CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Datos de pago incompletos: " + err.Error()})
		return
	}

	var order models.Order
	if err := h.db.Preload("Items").Preload("Items.Product").Where("id = ?", req.OrderID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Orden no encontrada"})
		return
	}

	provider, ok := h.registry.Get(req.MethodID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"detail": fmt.Sprintf("Método de pago '%s' no soportado", req.MethodID)})
		return
	}

	var settings models.StoreSettings
	_ = h.db.First(&settings).Error

	if !provider.IsEnabled(&settings) {
		c.JSON(http.StatusBadRequest, gin.H{"detail": fmt.Sprintf("El método de pago '%s' no está habilitado actualmente", provider.Name())})
		return
	}

	resp, err := provider.CreatePayment(c, &order, &settings)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error procesando pago: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// HandleWebhook processes asynchronous callbacks and notifications from payment gateways
func (h *PaymentHandler) HandleWebhook(c *gin.Context) {
	providerID := c.Param("provider")
	provider, ok := h.registry.Get(providerID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Proveedor desconocido"})
		return
	}

	var settings models.StoreSettings
	_ = h.db.First(&settings).Error

	result, err := provider.HandleWebhook(c, &settings)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error en webhook: " + err.Error()})
		return
	}

	if result != nil && result.OrderID != "" && result.Status == "paid" {
		// Update order to paid in DB
		_ = h.db.Model(&models.Order{}).Where("id = ?", result.OrderID).Update("status", "paid").Error
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "received",
		"result": result,
	})
}
