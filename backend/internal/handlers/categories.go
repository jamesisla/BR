package handlers

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"tienda-backend/internal/config"
	"tienda-backend/internal/models"
)

type CategoryHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewCategoryHandler(db *gorm.DB, cfg *config.Config) *CategoryHandler {
	return &CategoryHandler{db: db, cfg: cfg}
}

// ListCategories returns active categories for storefront or all for admin
func (h *CategoryHandler) ListCategories(c *gin.Context) {
	includeAll := c.Query("all") == "true"
	var categories []models.Category

	query := h.db.Order("`order` ASC, name ASC")
	if !includeAll {
		query = query.Where("is_active = ?", true)
	}

	if err := query.Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al obtener categorías"})
		return
	}

	c.JSON(http.StatusOK, categories)
}

// CreateCategory creates a new category
func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var input models.CategoryCreate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Datos inválidos: " + err.Error()})
		return
	}

	slug := strings.ToLower(strings.TrimSpace(input.Slug))
	if slug == "" {
		slug = strings.ToLower(strings.TrimSpace(input.Name))
	}
	slug = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			return r
		}
		if r == ' ' || r == '_' {
			return '-'
		}
		return -1
	}, slug)

	isActive := true
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	category := models.Category{
		ID:       uuid.New().String(),
		Name:     input.Name,
		Slug:     slug,
		Icon:     input.Icon,
		Order:    input.Order,
		IsActive: isActive,
	}

	if err := h.db.Create(&category).Error; err != nil {
		log.Printf("❌ [CATEGORY ERROR] Error al crear categoría: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al guardar categoría (quizá el slug ya existe)"})
		return
	}

	log.Printf("📁 [CATEGORY CREATED] ID: %s | Nombre: %s | Slug: %s", category.ID, category.Name, category.Slug)
	c.JSON(http.StatusOK, category)
}

// UpdateCategory updates an existing category
func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	categoryID := c.Param("id")

	var category models.Category
	if err := h.db.Where("id = ?", categoryID).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Categoría no encontrada"})
		return
	}

	var input models.CategoryCreate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Datos inválidos: " + err.Error()})
		return
	}

	category.Name = input.Name
	if input.Slug != "" {
		category.Slug = strings.ToLower(strings.TrimSpace(input.Slug))
	}
	category.Icon = input.Icon
	category.Order = input.Order
	if input.IsActive != nil {
		category.IsActive = *input.IsActive
	}

	if err := h.db.Save(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al actualizar categoría"})
		return
	}

	log.Printf("📁 [CATEGORY UPDATED] ID: %s | Nombre: %s", category.ID, category.Name)
	c.JSON(http.StatusOK, category)
}

// ToggleCategoryActive activates or deactivates a category
func (h *CategoryHandler) ToggleCategoryActive(c *gin.Context) {
	categoryID := c.Param("id")

	var category models.Category
	if err := h.db.Where("id = ?", categoryID).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Categoría no encontrada"})
		return
	}

	category.IsActive = !category.IsActive
	if err := h.db.Save(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al alternar estado"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":        category.ID,
		"is_active": category.IsActive,
	})
}

// DeleteCategory removes a category
func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	categoryID := c.Param("id")

	if err := h.db.Where("id = ?", categoryID).Delete(&models.Category{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al eliminar categoría"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "deleted", "id": categoryID})
}
