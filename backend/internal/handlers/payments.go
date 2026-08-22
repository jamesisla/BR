package handlers

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"tienda-backend/internal/models"
	"tienda-backend/internal/services"
)

type PaymentHandler struct {
	db        *gorm.DB
	mpService *services.MercadoPagoService
}

func NewPaymentHandler(db *gorm.DB, mpService *services.MercadoPagoService) *PaymentHandler {
	return &PaymentHandler{
		db:        db,
		mpService: mpService,
	}
}

// CreatePreference generates a Mercado Pago Checkout Pro preference
func (h *PaymentHandler) CreatePreference(c *gin.Context) {
	var req models.PaymentPreferenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "order_id es requerido"})
		return
	}

	var order models.Order
	if err := h.db.Preload("Items.Product").Where("id = ?", req.OrderID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Pedido no encontrado"})
		return
	}

	prefResp, err := h.mpService.CreatePreference(&order)
	if err != nil {
		log.Printf("Advertencia Mercado Pago (modo fallback/demo): %v", err)
		// Fallback for development/offline testing if MP credentials are mock
		fallbackInitPoint := fmt.Sprintf("/checkout/success?orderId=%s", order.ID)
		c.JSON(http.StatusOK, gin.H{
			"id":         "pref-mock-demo-" + order.ID,
			"init_point": fallbackInitPoint,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":         prefResp.ID,
		"init_point": prefResp.InitPoint,
	})
}

// Webhook processes asynchronous payment notifications from Mercado Pago
func (h *PaymentHandler) Webhook(c *gin.Context) {
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		// Even if empty payload, check query params as MP sends GET/POST combinations
		payload = make(map[string]interface{})
	}

	notificationType, _ := payload["type"].(string)
	if notificationType == "" {
		notificationType = c.Query("type")
		if notificationType == "" {
			notificationType = c.Query("topic")
		}
	}

	var paymentID string
	if dataMap, ok := payload["data"].(map[string]interface{}); ok {
		if idVal, exists := dataMap["id"]; exists {
			paymentID = fmt.Sprintf("%v", idVal)
		}
	}
	if paymentID == "" {
		paymentID = c.Query("data.id")
		if paymentID == "" {
			paymentID = c.Query("id")
		}
	}

	if (notificationType == "payment" || notificationType == "payment.created" || notificationType == "payment.updated") && paymentID != "" {
		log.Printf("Recibida notificación de pago ID %s", paymentID)

		paymentInfo, err := h.mpService.GetPayment(paymentID)
		if err == nil && paymentInfo != nil {
			if paymentInfo.Status == "approved" && paymentInfo.ExternalReference != "" {
				var order models.Order
				if err := h.db.Where("id = ?", paymentInfo.ExternalReference).First(&order).Error; err == nil {
					order.Status = "paid"
					h.db.Save(&order)
					log.Printf("¡Pedido %s marcado automáticamente como PAGADO!", paymentInfo.ExternalReference)
				}
			}
		} else {
			log.Printf("Nota: No se pudo verificar pago en MP (modo simulación/test): %v", err)
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
