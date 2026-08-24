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

	// 2. Initialize Handlers
	authHandler := handlers.NewAuthHandler(cfg)
	productHandler := handlers.NewProductHandler(db, cfg)
	settingsHandler := handlers.NewSettingsHandler(db)
	orderHandler := handlers.NewOrderHandler(db)
	paymentHandler := handlers.NewPaymentHandler(db)
	categoryHandler := handlers.NewCategoryHandler(db, cfg)
	analyticsHandler := handlers.NewAnalyticsHandler(db)

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

	// 5.1 Setup HTTP Security Headers
	r.Use(func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "SAMEORIGIN")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Next()
	})

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

	// Handler explícito para servir archivos de subida desde disco con lectura binaria directa y headers MIME
	serveUploadedFile := func(c *gin.Context) {
		paramPath := c.Param("filepath")
		cleanRelPath := filepath.Clean("/" + paramPath)
		cleanPath := strings.TrimPrefix(cleanRelPath, "/")
		diskPath := filepath.Join(absUploadDir, cleanPath)

		// Prevent Path Traversal
		if !strings.HasPrefix(diskPath, absUploadDir) {
			c.JSON(http.StatusForbidden, gin.H{"detail": "Acceso denegado"})
			return
		}

		data, err := os.ReadFile(diskPath)
		if err != nil {
			log.Printf("⚠️  [IMAGE NOT FOUND] 404: %s (Ruta buscada: %s, Error: %v)", cleanPath, diskPath, err)
			c.JSON(http.StatusNotFound, gin.H{"detail": "Imagen no encontrada en el servidor"})
			return
		}

		// Determinar MIME type exacto
		ext := strings.ToLower(filepath.Ext(cleanPath))
		mimeType := "image/jpeg"
		switch ext {
		case ".png":
			mimeType = "image/png"
		case ".jpg", ".jpeg":
			mimeType = "image/jpeg"
		case ".webp":
			mimeType = "image/webp"
		case ".gif":
			mimeType = "image/gif"
		case ".svg":
			mimeType = "image/svg+xml"
		default:
			mimeType = http.DetectContentType(data)
		}

		log.Printf("🖼️  [IMAGE SERVED] 200 OK: %s (%d bytes, Content-Type: %s)", cleanPath, len(data), mimeType)
		c.Header("Cache-Control", "public, max-age=86400")
		c.Header("Access-Control-Allow-Origin", "*")
		c.Data(http.StatusOK, mimeType, data)
	}

	r.GET("/static/uploads/*filepath", serveUploadedFile)
	r.GET("/uploads/*filepath", serveUploadedFile)
	r.HEAD("/static/uploads/*filepath", serveUploadedFile)
	r.HEAD("/uploads/*filepath", serveUploadedFile)

	// 7. Register API Routes
	api := r.Group("/api")
	{
		// Health check general
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":     "ok",
				"service":    "tienda-single-binary",
				"domain":     cfg.Domain,
				"upload_dir": absUploadDir,
				"time":       time.Now().Format(time.RFC3339),
			})
		})

		// Diagnóstico específico de permisos de subida de imágenes
		api.GET("/health/uploads", func(c *gin.Context) {
			testFile := filepath.Join(absUploadDir, ".write_test_"+time.Now().Format("150405"))
			writeErr := os.WriteFile(testFile, []byte("test-ok"), 0666)
			if writeErr == nil {
				_ = os.Remove(testFile)
			}

			entries, _ := os.ReadDir(absUploadDir)
			fileList := []gin.H{}
			for _, e := range entries {
				if strings.HasPrefix(e.Name(), ".") {
					continue
				}
				info, _ := e.Info()
				size := int64(0)
				if info != nil {
					size = info.Size()
				}
				fileList = append(fileList, gin.H{
					"name": e.Name(),
					"size": size,
					"url":  "/static/uploads/" + e.Name(),
				})
			}

			c.JSON(http.StatusOK, gin.H{
				"status":       "ok",
				"upload_dir":   absUploadDir,
				"writable":     writeErr == nil,
				"write_error":  fmt.Sprintf("%v", writeErr),
				"total_files":  len(fileList),
				"recent_files": fileList,
			})
		})

		// Auth
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/login", authHandler.Login)
		}

		// Admin Auth Middleware
		adminAuth := handlers.RequireAdminAuth(cfg)

		// Store Settings & Branding Wizard
		settingsGroup := api.Group("/settings")
		{
			settingsGroup.GET("/", settingsHandler.GetSettings)
			settingsGroup.GET("", settingsHandler.GetSettings)
			settingsGroup.POST("/", adminAuth, settingsHandler.UpdateSettings)
			settingsGroup.POST("", adminAuth, settingsHandler.UpdateSettings)
			settingsGroup.POST("/test-telegram", adminAuth, settingsHandler.TestTelegram)
		}

		// Categories
		categoryGroup := api.Group("/categories")
		{
			categoryGroup.GET("/", categoryHandler.ListCategories)
			categoryGroup.GET("", categoryHandler.ListCategories)
			categoryGroup.POST("/", adminAuth, categoryHandler.CreateCategory)
			categoryGroup.POST("", adminAuth, categoryHandler.CreateCategory)
			categoryGroup.PUT("/:id", adminAuth, categoryHandler.UpdateCategory)
			categoryGroup.PATCH("/:id/toggle-active", adminAuth, categoryHandler.ToggleCategoryActive)
			categoryGroup.DELETE("/:id", adminAuth, categoryHandler.DeleteCategory)
		}

		// Products
		productGroup := api.Group("/products")
		{
			productGroup.GET("/", productHandler.ListProducts)
			productGroup.GET("", productHandler.ListProducts)
			productGroup.GET("/all", adminAuth, productHandler.ListAllProducts)
			productGroup.POST("/", adminAuth, productHandler.CreateProduct)
			productGroup.POST("", adminAuth, productHandler.CreateProduct)
			productGroup.POST("/upload", adminAuth, productHandler.UploadImage)
			productGroup.GET("/:slug", productHandler.GetProductBySlug)
			productGroup.PUT("/:id", adminAuth, productHandler.UpdateProduct)
			productGroup.PATCH("/:id/toggle-active", adminAuth, productHandler.ToggleProductActive)
			productGroup.DELETE("/:id", adminAuth, productHandler.DeleteProduct)
		}

		// Orders
		orderGroup := api.Group("/orders")
		{
			orderGroup.GET("/", adminAuth, orderHandler.ListOrders)
			orderGroup.GET("", adminAuth, orderHandler.ListOrders)
			orderGroup.POST("/", orderHandler.CreateOrder)
			orderGroup.POST("", orderHandler.CreateOrder)
			orderGroup.GET("/:id", orderHandler.GetOrder)
			orderGroup.PATCH("/:id/status", adminAuth, orderHandler.UpdateOrderStatus)
		}

		// Payments (Modular Gateway Engine)
		paymentGroup := api.Group("/payments")
		{
			paymentGroup.GET("/methods", paymentHandler.GetMethods)
			paymentGroup.POST("/create", paymentHandler.CreatePayment)
			paymentGroup.POST("/create-preference", paymentHandler.CreatePayment)
			paymentGroup.POST("/webhook", paymentHandler.HandleWebhook)
			paymentGroup.POST("/webhook/:provider", paymentHandler.HandleWebhook)
			paymentGroup.GET("/webhook/:provider", paymentHandler.HandleWebhook)
		}

		// Analytics & Visitors Tracking
		analyticsGroup := api.Group("/analytics")
		{
			analyticsGroup.POST("/track", analyticsHandler.Track)
			analyticsGroup.GET("/summary", adminAuth, analyticsHandler.GetSummary)
			analyticsGroup.GET("/visits", adminAuth, analyticsHandler.ListVisits)
			analyticsGroup.GET("/visits/:id", adminAuth, analyticsHandler.GetVisit)
			analyticsGroup.POST("/toggle", adminAuth, analyticsHandler.ToggleTracking)
			analyticsGroup.POST("/purge", adminAuth, analyticsHandler.PurgeVisits)
			analyticsGroup.GET("/export", adminAuth, analyticsHandler.ExportCSV)
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

		// 1. Si es una ruta de subidas o API no encontrada, responder 404 (NUNCA index.html)
		if strings.HasPrefix(c.Request.URL.Path, "/static/uploads/") ||
			strings.HasPrefix(c.Request.URL.Path, "/uploads/") ||
			strings.HasPrefix(c.Request.URL.Path, "/api/") ||
			c.Request.URL.Path == "/api" {
			c.JSON(http.StatusNotFound, gin.H{"detail": "Recurso no encontrado"})
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
