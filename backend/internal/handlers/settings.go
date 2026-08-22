package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"tienda-backend/internal/models"
)

type SettingsHandler struct {
	db *gorm.DB
}

func NewSettingsHandler(db *gorm.DB) *SettingsHandler {
	return &SettingsHandler{db: db}
}

// GetSettings retrieves current store branding configuration
func (h *SettingsHandler) GetSettings(c *gin.Context) {
	var settings models.StoreSettings
	result := h.db.First(&settings)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			// Initialize default
			settings = models.StoreSettings{
				Name:           "TIENDA ARTISAN",
				LogoURL:        "",
				PrimaryColor:   "#3d2b1f",
				SecondaryColor: "#a67c52",
				FooterText:     "© 2026 Tienda Artisan. Crafted for purity.",
				HeroTitle:      "El Arte de la Pureza",
				HeroSubtitle:   "Descubre nuestra selección artesanal única.",
				HeroImageURL:   "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2000&auto=format&fit=crop",
			}
			h.db.Create(&settings)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error consultando configuración"})
			return
		}
	}

	c.JSON(http.StatusOK, settings)
}

// UpdateSettings saves updated branding and hero configuration
func (h *SettingsHandler) UpdateSettings(c *gin.Context) {
	var input models.StoreSettings
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Datos inválidos: " + err.Error()})
		return
	}

	var settings models.StoreSettings
	result := h.db.First(&settings)

	if result.Error == gorm.ErrRecordNotFound {
		settings = input
		if err := h.db.Create(&settings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al crear configuración"})
			return
		}
	} else if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al consultar configuración"})
		return
	} else {
		settings.Name = input.Name
		settings.PrimaryColor = input.PrimaryColor
		settings.SecondaryColor = input.SecondaryColor
		settings.LogoURL = input.LogoURL
		settings.FooterText = input.FooterText
		settings.HeroTitle = input.HeroTitle
		settings.HeroSubtitle = input.HeroSubtitle
		settings.HeroImageURL = input.HeroImageURL

		if err := h.db.Save(&settings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al actualizar configuración"})
			return
		}
	}

	c.JSON(http.StatusOK, settings)
}
