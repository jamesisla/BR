package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"tienda-backend/internal/models"
	"tienda-backend/internal/services"
)

type OrderHandler struct {
	db *gorm.DB
}

func NewOrderHandler(db *gorm.DB) *OrderHandler {
	return &OrderHandler{db: db}
}

// CreateOrder processes checkout, verifies & deducts stock in a single transaction
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var input models.OrderCreate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Datos del pedido incompletos o inválidos: " + err.Error()})
		return
	}

	orderID := uuid.New().String()

	order := models.Order{
		ID:        orderID,
		Email:     input.Email,
		FirstName: input.FirstName,
		LastName:  input.LastName,
		Address:   input.Address,
		Total:     input.Total,
		Status:    "pending",
	}

	// Begin atomic transaction
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Create(&order).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error creando registro de orden"})
		return
	}

	var orderItems []models.OrderItem
	for _, item := range input.Items {
		var product models.Product
		if err := tx.Where("id = ?", item.ProductID).First(&product).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusNotFound, gin.H{"detail": fmt.Sprintf("Producto %s no encontrado", item.ProductID)})
			return
		}

		// Check stock
		if product.Stock < item.Quantity {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{
				"detail": fmt.Sprintf("Stock insuficiente para %s. Disponible: %d", product.Name, product.Stock),
			})
			return
		}

		// Deduct stock
		product.Stock -= item.Quantity
		if err := tx.Save(&product).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error actualizando inventario"})
			return
		}

		orderItem := models.OrderItem{
			OrderID:         orderID,
			ProductID:       item.ProductID,
			Quantity:        item.Quantity,
			PriceAtPurchase: item.PriceAtPurchase,
		}
		if err := tx.Create(&orderItem).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error creando item de orden"})
			return
		}
		orderItems = append(orderItems, orderItem)
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error confirmando la transacción"})
		return
	}

	// Return populated order
	var fullOrder models.Order
	h.db.Preload("Items.Product").Where("id = ?", orderID).First(&fullOrder)

	// Trigger non-blocking Telegram notification if enabled
	go func(ord models.Order) {
		var settings models.StoreSettings
		if err := h.db.First(&settings).Error; err == nil {
			services.GetTelegramService().SendNewOrderNotification(&settings, &ord)
		}
	}(fullOrder)

	c.JSON(http.StatusOK, fullOrder)
}

// ListOrders returns all orders
func (h *OrderHandler) ListOrders(c *gin.Context) {
	var orders []models.Order
	if err := h.db.Preload("Items.Product").Order("created_at DESC").Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error consultando pedidos"})
		return
	}

	if orders == nil {
		orders = []models.Order{}
	}

	c.JSON(http.StatusOK, orders)
}

// GetOrder returns a single order by ID
func (h *OrderHandler) GetOrder(c *gin.Context) {
	orderID := c.Param("id")

	var order models.Order
	if err := h.db.Preload("Items.Product").Where("id = ?", orderID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Pedido no encontrado"})
		return
	}

	c.JSON(http.StatusOK, order)
}

// UpdateOrderStatus modifies order status (pending, paid, shipped, cancelled)
func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	orderID := c.Param("id")
	status := strings.TrimSpace(c.Query("status"))

	if status == "" {
		var body struct {
			Status string `json:"status"`
		}
		if err := c.ShouldBindJSON(&body); err == nil && body.Status != "" {
			status = body.Status
		}
	}

	if status == "" {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Parámetro 'status' es obligatorio"})
		return
	}

	var order models.Order
	if err := h.db.Where("id = ?", orderID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Pedido no encontrado"})
		return
	}

	order.Status = status
	if err := h.db.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error actualizando estado del pedido"})
		return
	}

	h.db.Preload("Items.Product").Where("id = ?", orderID).First(&order)
	c.JSON(http.StatusOK, order)
}
