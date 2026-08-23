package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port          string
	DatabaseURL   string
	BackendURL    string
	FrontendURL   string
	AdminPassword string
	MPAccessToken string
	UploadDir     string
	GinMode       string
	Domain        string
}

func Load() *Config {
	_ = godotenv.Load()

	port := getEnv("PORT", "80")
	dbURL := getEnv("DATABASE_URL", "ecommerce.db")
	backendURL := getEnv("BACKEND_URL", "")
	frontendURL := getEnv("FRONTEND_URL", "")
	adminPass := getEnv("ADMIN_PASSWORD", "Malulo23")
	mpToken := getEnv("MP_ACCESS_TOKEN", "TEST-6447849483321584-051015-8d598585474747474747474747474747-000000000")
	uploadDir := getEnv("UPLOAD_DIR", "./uploads")
	ginMode := getEnv("GIN_MODE", "release")
	domain := getEnv("DOMAIN", "")

	return &Config{
		Port:          port,
		DatabaseURL:   dbURL,
		BackendURL:    backendURL,
		FrontendURL:   frontendURL,
		AdminPassword: adminPass,
		MPAccessToken: mpToken,
		UploadDir:     uploadDir,
		GinMode:       ginMode,
		Domain:        domain,
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
