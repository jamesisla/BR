package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"tienda-backend/internal/config"
	"tienda-backend/internal/models"
)

type AuthHandler struct {
	cfg *config.Config
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{cfg: cfg}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Formato de datos inválido"})
		return
	}

	if req.Password == h.cfg.AdminPassword {
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"token":  "tienda-admin-token-2026",
		})
		return
	}

	c.JSON(http.StatusUnauthorized, gin.H{
		"detail": "Contraseña incorrecta",
	})
}
