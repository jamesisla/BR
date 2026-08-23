package handlers

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"tienda-backend/internal/config"
	"tienda-backend/internal/models"
)

type ProductHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewProductHandler(db *gorm.DB, cfg *config.Config) *ProductHandler {
	return &ProductHandler{db: db, cfg: cfg}
}

// ListProducts returns active products, with optional search and category filter
func (h *ProductHandler) ListProducts(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	category := strings.TrimSpace(c.Query("category"))

	query := h.db.Where("is_active = ?", true)

	if q != "" {
		searchTerm := "%" + strings.ToLower(q) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(description) LIKE ?", searchTerm, searchTerm)
	}

	if category != "" {
		query = query.Where("LOWER(category) = ?", strings.ToLower(category))
	}

	var products []models.Product
	if err := query.Order("created_at DESC").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al consultar productos"})
		return
	}

	if products == nil {
		products = []models.Product{}
	}

	c.JSON(http.StatusOK, products)
}

// ListAllProducts returns all products for admin dashboard
func (h *ProductHandler) ListAllProducts(c *gin.Context) {
	var products []models.Product
	if err := h.db.Order("created_at DESC").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al consultar catálogo completo"})
		return
	}

	if products == nil {
		products = []models.Product{}
	}

	c.JSON(http.StatusOK, products)
}

// GetProductBySlug returns a single active product by its URL slug
func (h *ProductHandler) GetProductBySlug(c *gin.Context) {
	slug := c.Param("slug")

	var product models.Product
	if err := h.db.Where("slug = ? AND is_active = ?", slug, true).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Producto no encontrado"})
		return
	}

	c.JSON(http.StatusOK, product)
}

// CreateProduct adds a new product
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var input models.ProductCreate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Campos obligatorios faltantes o inválidos: " + err.Error()})
		return
	}

	isActive := true
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	category := "general"
	if input.Category != "" {
		category = input.Category
	}

	product := models.Product{
		ID:          uuid.New().String(),
		Name:        input.Name,
		Slug:        input.Slug,
		Description: input.Description,
		Category:    category,
		BasePrice:   input.BasePrice,
		Stock:       input.Stock,
		ImageURL:    input.ImageURL,
		IsActive:    isActive,
	}

	if err := h.db.Create(&product).Error; err != nil {
		log.Printf("❌ [DB ERROR] Error al crear producto: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al guardar el producto en la base de datos"})
		return
	}

	log.Printf("📝 [PRODUCT CREATED] ID: %s | Nombre: %s | ImageURL: %s", product.ID, product.Name, product.ImageURL)
	c.JSON(http.StatusOK, product)
}

// UpdateProduct modifies an existing product by ID
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	productID := c.Param("id")

	var product models.Product
	if err := h.db.Where("id = ?", productID).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Producto no encontrado"})
		return
	}

	var input models.ProductCreate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Datos inválidos: " + err.Error()})
		return
	}

	product.Name = input.Name
	product.Slug = input.Slug
	product.Description = input.Description
	if input.Category != "" {
		product.Category = input.Category
	}
	product.BasePrice = input.BasePrice
	product.Stock = input.Stock
	product.ImageURL = input.ImageURL
	if input.IsActive != nil {
		product.IsActive = *input.IsActive
	}

	if err := h.db.Save(&product).Error; err != nil {
		log.Printf("❌ [DB ERROR] Error al actualizar producto %s: %v", productID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al actualizar producto"})
		return
	}

	log.Printf("📝 [PRODUCT UPDATED] ID: %s | Nombre: %s | ImageURL: %s", product.ID, product.Name, product.ImageURL)
	c.JSON(http.StatusOK, product)
}

// ToggleProductActive toggles the is_active status of a product
func (h *ProductHandler) ToggleProductActive(c *gin.Context) {
	productID := c.Param("id")

	var product models.Product
	if err := h.db.Where("id = ?", productID).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Producto no encontrado"})
		return
	}

	product.IsActive = !product.IsActive

	if err := h.db.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al cambiar estado del producto"})
		return
	}

	c.JSON(http.StatusOK, product)
}

// DeleteProduct deletes a product permanently
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	productID := c.Param("id")

	var product models.Product
	if err := h.db.Where("id = ?", productID).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Producto no encontrado"})
		return
	}

	if err := h.db.Delete(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al eliminar producto"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Producto eliminado permanentemente",
	})
}

// UploadImage handles multipart image file uploads from smartphones and desktop
func (h *ProductHandler) UploadImage(c *gin.Context) {
	log.Printf("📥 [UPLOAD] Solicitud de subida de imagen recibida desde %s", c.ClientIP())

	file, err := c.FormFile("file")
	if err != nil {
		log.Printf("❌ [UPLOAD ERROR] No se pudo leer el archivo del formulario: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"detail": "No se recibió ningún archivo de imagen: " + err.Error()})
		return
	}

	uploadDir := h.cfg.UploadDir
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	absUploadDir, err := filepath.Abs(uploadDir)
	if err != nil {
		absUploadDir = uploadDir
	}

	if err := os.MkdirAll(absUploadDir, 0777); err != nil {
		log.Printf("❌ [UPLOAD ERROR] No se pudo crear directorio %s: %v", absUploadDir, err)
		c.JSON(http.StatusInternalServerError, gin.H{"detail": fmt.Sprintf("Error al crear directorio (%s): %v", absUploadDir, err)})
		return
	}
	_ = os.Chmod(absUploadDir, 0777)

	// Safe unique filename
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext == "" || ext == "." {
		ext = ".jpg"
	}

	base := strings.TrimSuffix(filepath.Base(file.Filename), filepath.Ext(file.Filename))
	baseClean := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			return r
		}
		return '_'
	}, base)

	if baseClean == "" || baseClean == "_" {
		baseClean = "foto"
	}

	filename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano()/1e6, baseClean, ext)
	dst := filepath.Join(absUploadDir, filename)

	log.Printf("💾 [UPLOAD] Guardando archivo '%s' (%.2f KB) en: %s", file.Filename, float64(file.Size)/1024.0, dst)

	if err := c.SaveUploadedFile(file, dst); err != nil {
		log.Printf("❌ [UPLOAD ERROR] No se pudo escribir en disco (%s): %v", dst, err)
		c.JSON(http.StatusInternalServerError, gin.H{"detail": fmt.Sprintf("Error al guardar archivo en disco (%s): %v", dst, err)})
		return
	}

	// Asegurar permisos universales de lectura
	_ = os.Chmod(dst, 0666)

	// URL siempre relativa (/static/uploads/...) para que funcione en cualquier dominio o IP sin depender de localhost
	fileURL := fmt.Sprintf("/static/uploads/%s", filename)

	log.Printf("✅ [UPLOAD SUCCESS] Guardado exitoso. URL pública asignada: %s", fileURL)

	c.JSON(http.StatusOK, gin.H{
		"url":      fileURL,
		"filename": filename,
		"size":     file.Size,
	})
}
