package main

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/acme/autocert"

	"tienda-backend/internal/config"
	"tienda-backend/internal/database"
	"tienda-backend/internal/handlers"
	"tienda-backend/internal/services"
)

//go:embed all:dist
var embeddedDist embed.FS

func main() {
	cfg := config.Load()

	if cfg.GinMode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 1. Initialize Database (SQLite with WAL or Postgres)
	db, err := database.InitDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Error crítico al inicializar la base de datos: %v", err)
	}

	// 2. Initialize Services
	mpService := services.NewMercadoPagoService(cfg)

	// 3. Initialize Handlers
	authHandler := handlers.NewAuthHandler(cfg)
	productHandler := handlers.NewProductHandler(db, cfg)
	settingsHandler := handlers.NewSettingsHandler(db)
	orderHandler := handlers.NewOrderHandler(db)
	paymentHandler := handlers.NewPaymentHandler(db, mpService)

	// 4. Create Router
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	// Aumentar memoria para fotos pesadas de smartphones (32 MB)
	r.MaxMultipartMemory = 32 << 20

	// 5. Setup CORS
	corsConfig := cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization", "Accept", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	r.Use(cors.New(corsConfig))

	// 6. Ensure Upload Directory exists and serve static uploads from disk
	uploadDir := cfg.UploadDir
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	absUploadDir, err := filepath.Abs(uploadDir)
	if err != nil {
		absUploadDir = uploadDir
	}
	_ = os.MkdirAll(absUploadDir, 0777)

	r.Static("/static/uploads", absUploadDir)
	r.Static("/uploads", absUploadDir)

	// 7. Register API Routes
	api := r.Group("/api")
	{
		// Health check
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":  "ok",
				"service": "tienda-single-binary",
				"domain":  cfg.Domain,
				"time":    time.Now().Format(time.RFC3339),
			})
		})

		// Auth
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/login", authHandler.Login)
		}

		// Store Settings & Branding Wizard
		settingsGroup := api.Group("/settings")
		{
			settingsGroup.GET("/", settingsHandler.GetSettings)
			settingsGroup.GET("", settingsHandler.GetSettings)
			settingsGroup.POST("/", settingsHandler.UpdateSettings)
			settingsGroup.POST("", settingsHandler.UpdateSettings)
		}

		// Products
		productGroup := api.Group("/products")
		{
			productGroup.GET("/", productHandler.ListProducts)
			productGroup.GET("", productHandler.ListProducts)
			productGroup.GET("/all", productHandler.ListAllProducts)
			productGroup.POST("/", productHandler.CreateProduct)
			productGroup.POST("", productHandler.CreateProduct)
			productGroup.POST("/upload", productHandler.UploadImage)
			productGroup.GET("/:slug", productHandler.GetProductBySlug)
			productGroup.PUT("/:id", productHandler.UpdateProduct)
			productGroup.PATCH("/:id/toggle-active", productHandler.ToggleProductActive)
			productGroup.DELETE("/:id", productHandler.DeleteProduct)
		}

		// Orders
		orderGroup := api.Group("/orders")
		{
			orderGroup.GET("/", orderHandler.ListOrders)
			orderGroup.GET("", orderHandler.ListOrders)
			orderGroup.POST("/", orderHandler.CreateOrder)
			orderGroup.POST("", orderHandler.CreateOrder)
			orderGroup.GET("/:id", orderHandler.GetOrder)
			orderGroup.PATCH("/:id/status", orderHandler.UpdateOrderStatus)
		}

		// Payments
		paymentGroup := api.Group("/payments")
		{
			paymentGroup.POST("/create-preference", paymentHandler.CreatePreference)
			paymentGroup.POST("/webhook", paymentHandler.Webhook)
		}
	}

	// 8. Setup Embedded Frontend SPA
	setupEmbeddedSPA(r, absUploadDir)

	// 9. Start HTTP/HTTPS Server
	if cfg.Domain != "" {
		// Verificar si existen certificados generados por Certbot en /etc/letsencrypt/live/<domain>/
		certbotFullchain := fmt.Sprintf("/etc/letsencrypt/live/%s/fullchain.pem", cfg.Domain)
		certbotPrivkey := fmt.Sprintf("/etc/letsencrypt/live/%s/privkey.pem", cfg.Domain)

		_, errCert := os.Stat(certbotFullchain)
		_, errKey := os.Stat(certbotPrivkey)
		hasCertbot := (errCert == nil && errKey == nil)

		if hasCertbot {
			log.Printf("🔐 Usando certificados SSL existentes de Certbot (/etc/letsencrypt/live/%s)", cfg.Domain)

			// Servidor HTTP en puerto 80 para redirigir a HTTPS
			go func() {
				log.Printf("🌐 Servidor HTTP :80 activo (Redirigiendo permanentemente a https://%s)", cfg.Domain)
				redirectHandler := http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
					target := "https://" + cfg.Domain + req.URL.RequestURI()
					http.Redirect(w, req, target, http.StatusMovedPermanently)
				})
				if err := http.ListenAndServe(":80", redirectHandler); err != nil {
					log.Printf("Aviso HTTP redirect :80: %v", err)
				}
			}()

			// Servidor HTTPS seguro en puerto 443 con archivos de Certbot
			httpsSrv := &http.Server{
				Addr:         ":443",
				Handler:      r,
				ReadTimeout:  15 * time.Second,
				WriteTimeout: 15 * time.Second,
				IdleTimeout:  60 * time.Second,
			}

			go func() {
				log.Printf("🚀 Tienda Segura HTTPS (Certbot) iniciada en https://%s", cfg.Domain)
				if err := httpsSrv.ListenAndServeTLS(certbotFullchain, certbotPrivkey); err != nil && err != http.ErrServerClosed {
					log.Fatalf("Error en servidor HTTPS :443: %v", err)
				}
			}()

			// Graceful shutdown
			quit := make(chan os.Signal, 1)
			signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
			<-quit
			log.Println("Apagando servidor de forma segura...")

			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			_ = httpsSrv.Shutdown(ctx)
			log.Println("Servidor detenido correctamente.")
			return
		}

		// Fallback: Autocert (Let's Encrypt automático sin Certbot)
		log.Printf("🔐 Configurando certificado SSL automático (Let's Encrypt Autocert) para: %s", cfg.Domain)
		_ = os.MkdirAll("./certs", 0700)

		certManager := autocert.Manager{
			Prompt:     autocert.AcceptTOS,
			HostPolicy: autocert.HostWhitelist(cfg.Domain),
			Cache:      autocert.DirCache("./certs"),
		}

		// Servidor HTTP en puerto 80 para redirigir a HTTPS y responder validación ACME
		go func() {
			log.Printf("🌐 Servidor HTTP :80 activo (Redirigiendo automáticamente a https://%s)", cfg.Domain)
			if err := http.ListenAndServe(":80", certManager.HTTPHandler(nil)); err != nil {
				log.Printf("Aviso HTTP redirect :80: %v", err)
			}
		}()

		// Servidor HTTPS seguro en puerto 443
		httpsSrv := &http.Server{
			Addr:         ":443",
			Handler:      r,
			TLSConfig:    certManager.TLSConfig(),
			ReadTimeout:  15 * time.Second,
			WriteTimeout: 15 * time.Second,
			IdleTimeout:  60 * time.Second,
		}

		go func() {
			log.Printf("🚀 Tienda Segura HTTPS iniciada en https://%s", cfg.Domain)
			if err := httpsSrv.ListenAndServeTLS("", ""); err != nil && err != http.ErrServerClosed {
				log.Fatalf("Error en servidor HTTPS :443: %v", err)
			}
		}()

		// Graceful shutdown
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		log.Println("Apagando servidor de forma segura...")

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = httpsSrv.Shutdown(ctx)
		log.Println("Servidor detenido correctamente.")
		return
	} else {
		// Modo HTTP Estándar (IP directa)
		port := cfg.Port
		if port == "" {
			port = "80"
		}
		addr := ":" + port

		srv := &http.Server{
			Addr:         addr,
			Handler:      r,
			ReadTimeout:  15 * time.Second,
			WriteTimeout: 15 * time.Second,
			IdleTimeout:  60 * time.Second,
		}

		go func() {
			log.Printf("🚀 Tienda Artisan iniciada en http://0.0.0.0%s", addr)
			if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				log.Fatalf("Error al iniciar el servidor en el puerto %s: %v", port, err)
			}
		}()

		// Graceful shutdown
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		log.Println("Apagando servidor de forma segura...")

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			log.Fatalf("Forzado de apagado del servidor: %v", err)
		}

		log.Println("Servidor detenido correctamente.")
	}
}

func setupEmbeddedSPA(r *gin.Engine, absUploadDir string) {
	distFS, err := fs.Sub(embeddedDist, "dist")
	if err != nil {
		log.Printf("Aviso: No se pudo extraer sub-sistema dist: %v", err)
		return
	}

	httpFS := http.FS(distFS)

	// Leer index.html en memoria para servir directamente sin redirecciones 301
	indexHTML, err := fs.ReadFile(distFS, "index.html")
	if err != nil {
		log.Printf("Aviso: No se pudo leer index.html embebido: %v", err)
	}

	r.NoRoute(func(c *gin.Context) {
		reqPath := strings.TrimPrefix(c.Request.URL.Path, "/")

		// 1. Si es una ruta de subidas en disco, servir archivo del disco directamente
		if strings.HasPrefix(reqPath, "static/uploads/") {
			fileName := strings.TrimPrefix(reqPath, "static/uploads/")
			diskFile := filepath.Join(absUploadDir, fileName)
			if _, err := os.Stat(diskFile); err == nil {
				c.File(diskFile)
				return
			}
		}
		if strings.HasPrefix(reqPath, "uploads/") {
			fileName := strings.TrimPrefix(reqPath, "uploads/")
			diskFile := filepath.Join(absUploadDir, fileName)
			if _, err := os.Stat(diskFile); err == nil {
				c.File(diskFile)
				return
			}
		}

		// 2. Si es una ruta de API inexistente, responder 404 JSON
		if strings.HasPrefix(c.Request.URL.Path, "/api/") || c.Request.URL.Path == "/api" {
			c.JSON(http.StatusNotFound, gin.H{"detail": "Endpoint de API no encontrado"})
			return
		}

		// 3. Si es un archivo estático existente en dist (JS, CSS, imágenes embebidas)
		if reqPath != "" {
			file, err := distFS.Open(reqPath)
			if err == nil {
				stat, statErr := file.Stat()
				file.Close()
				if statErr == nil && !stat.IsDir() {
					if strings.HasPrefix(reqPath, "assets/") {
						c.Header("Cache-Control", "public, max-age=31536000, immutable")
					}
					c.FileFromFS(reqPath, httpFS)
					return
				}
			}
		}

		// 4. Servir index.html directamente con 200 OK para navegación SPA
		c.Header("Cache-Control", "no-cache")
		c.Data(http.StatusOK, "text/html; charset=utf-8", indexHTML)
	})
}
