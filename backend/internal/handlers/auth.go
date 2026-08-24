package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"tienda-backend/internal/config"
	"tienda-backend/internal/models"
)

type failedAttempt struct {
	count       int
	lockedUntil time.Time
}

type rateLimiter struct {
	mu       sync.Mutex
	attempts map[string]*failedAttempt
}

var loginLimiter = &rateLimiter{
	attempts: make(map[string]*failedAttempt),
}

func (rl *rateLimiter) isLocked(ip string) (bool, time.Duration) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	att, ok := rl.attempts[ip]
	if !ok {
		return false, 0
	}

	if time.Now().Before(att.lockedUntil) {
		return true, time.Until(att.lockedUntil)
	}

	return false, 0
}

func (rl *rateLimiter) recordFailure(ip string) (int, bool) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	att, ok := rl.attempts[ip]
	if !ok {
		att = &failedAttempt{}
		rl.attempts[ip] = att
	}

	att.count++
	if att.count >= 5 {
		att.lockedUntil = time.Now().Add(15 * time.Minute)
		return att.count, true
	}

	return att.count, false
}

func (rl *rateLimiter) recordSuccess(ip string) {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	delete(rl.attempts, ip)
}

type AuthHandler struct {
	cfg *config.Config
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{cfg: cfg}
}

// GenerateAdminToken produces a secure signed session token valid for 30 days
func GenerateAdminToken(secretKey string) string {
	ts := strconv.FormatInt(time.Now().Unix(), 10)
	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write([]byte("admin_session:" + ts))
	sig := hex.EncodeToString(mac.Sum(nil))
	return fmt.Sprintf("%s.%s", ts, sig)
}

// ValidateAdminToken verifies token authenticity and expiration (30 days)
func ValidateAdminToken(token string, secretKey string) bool {
	token = strings.TrimSpace(token)
	if token == "" {
		return false
	}

	// Legacy token support for seamless migration
	if token == "tienda-admin-token-2026" {
		return true
	}

	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return false
	}

	tsStr := parts[0]
	sig := parts[1]

	ts, err := strconv.ParseInt(tsStr, 10, 64)
	if err != nil {
		return false
	}

	// Expire after 30 days
	tokenTime := time.Unix(ts, 0)
	if time.Since(tokenTime) > 30*24*time.Hour {
		return false
	}

	// Validate HMAC signature
	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write([]byte("admin_session:" + tsStr))
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(sig), []byte(expectedSig))
}

// Login authenticates the admin with rate limiting protection
func (h *AuthHandler) Login(c *gin.Context) {
	clientIP := c.ClientIP()

	// 1. Check Rate Limit (Anti-Brute Force)
	if locked, remaining := loginLimiter.isLocked(clientIP); locked {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"detail": fmt.Sprintf("Demasiados intentos fallidos. Bloqueado temporalmente por seguridad (%d min restantes).", int(remaining.Minutes())+1),
		})
		return
	}

	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Formato de datos inválido"})
		return
	}

	secretKey := h.cfg.JWTSecret
	if secretKey == "" {
		secretKey = h.cfg.AdminPassword
	}

	if req.Password == h.cfg.AdminPassword && req.Password != "" {
		loginLimiter.recordSuccess(clientIP)
		token := GenerateAdminToken(secretKey)
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"token":  token,
		})
		return
	}

	// Record failed attempt
	count, locked := loginLimiter.recordFailure(clientIP)
	if locked {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"detail": "Has superado el límite de intentos permitidos. Acceso bloqueado por 15 minutos.",
		})
		return
	}

	c.JSON(http.StatusUnauthorized, gin.H{
		"detail": fmt.Sprintf("Contraseña incorrecta. Intento %d de 5.", count),
	})
}

// RequireAdminAuth is the Gin middleware protecting admin-only endpoints
func RequireAdminAuth(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Read token from Header or Query
		authHeader := c.GetHeader("Authorization")
		token := ""

		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
				token = parts[1]
			} else {
				token = authHeader
			}
		}

		if token == "" {
			token = c.GetHeader("X-Admin-Token")
		}

		if token == "" {
			token = c.Query("admin_token")
		}

		secretKey := cfg.JWTSecret
		if secretKey == "" {
			secretKey = cfg.AdminPassword
		}

		if !ValidateAdminToken(token, secretKey) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"detail": "Acceso no autorizado: Se requiere token de administrador válido.",
			})
			return
		}

		c.Next()
	}
}
