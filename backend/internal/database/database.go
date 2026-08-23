package database

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"tienda-backend/internal/models"
)

func InitDB(databaseURL string) (*gorm.DB, error) {
	var dialector gorm.Dialector

	isPostgres := strings.HasPrefix(databaseURL, "postgres://") || strings.HasPrefix(databaseURL, "postgresql://")

	if isPostgres {
		log.Println("Conectando a PostgreSQL...")
		dialector = postgres.Open(databaseURL)
	} else {
		// SQLite (pure Go driver, no CGO required)
		dbFile := databaseURL
		if dbFile == "" {
			dbFile = "ecommerce.db"
		}
		log.Printf("Conectando a SQLite (%s)...", dbFile)
		dialector = sqlite.Open(dbFile)
	}

	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	}

	db, err := gorm.Open(dialector, gormConfig)
	if err != nil {
		return nil, fmt.Errorf("error al abrir base de datos: %w", err)
	}

	if !isPostgres {
		// Activar WAL y optimizaciones de SQLite directamente
		db.Exec("PRAGMA journal_mode = WAL;")
		db.Exec("PRAGMA busy_timeout = 5000;")
		db.Exec("PRAGMA synchronous = NORMAL;")
		db.Exec("PRAGMA foreign_keys = ON;")
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("error al obtener sql.DB: %w", err)
	}

	// Performance connection pooling tuning
	if isPostgres {
		sqlDB.SetMaxIdleConns(10)
		sqlDB.SetMaxOpenConns(50)
		sqlDB.SetConnMaxLifetime(time.Hour)
	} else {
		// SQLite WAL mode handles concurrent readers, single writer
		sqlDB.SetMaxIdleConns(5)
		sqlDB.SetMaxOpenConns(20)
		sqlDB.SetConnMaxLifetime(time.Hour)
	}

	// Auto-Migrate schema
	log.Println("Ejecutando migraciones automáticas...")
	if err := db.AutoMigrate(
		&models.Product{},
		&models.Order{},
		&models.OrderItem{},
		&models.StoreSettings{},
	); err != nil {
		log.Printf("Aviso: Esquema anterior incompatible detectado (%v). Reconstruyendo tablas limpiamente...", err)
		_ = db.Migrator().DropTable(&models.OrderItem{}, &models.Order{}, &models.Product{}, &models.StoreSettings{})
		if err2 := db.AutoMigrate(
			&models.Product{},
			&models.Order{},
			&models.OrderItem{},
			&models.StoreSettings{},
		); err2 != nil {
			return nil, fmt.Errorf("error en AutoMigrate: %w", err2)
		}
	}

	// Limpiar automáticamente cualquier URL antigua con 'localhost' en la base de datos
	_ = db.Exec("UPDATE products SET image_url = REPLACE(image_url, 'http://localhost:8000', '') WHERE image_url LIKE '%localhost:8000%'").Error
	_ = db.Exec("UPDATE products SET image_url = REPLACE(image_url, 'http://localhost', '') WHERE image_url LIKE '%localhost%'").Error
	_ = db.Exec("UPDATE store_settings SET hero_image_url = REPLACE(hero_image_url, 'http://localhost:8000', '') WHERE hero_image_url LIKE '%localhost:8000%'").Error
	_ = db.Exec("UPDATE store_settings SET hero_image_url = REPLACE(hero_image_url, 'http://localhost', '') WHERE hero_image_url LIKE '%localhost%'").Error
	_ = db.Exec("UPDATE store_settings SET logo_url = REPLACE(logo_url, 'http://localhost:8000', '') WHERE logo_url LIKE '%localhost:8000%'").Error
	_ = db.Exec("UPDATE store_settings SET logo_url = REPLACE(logo_url, 'http://localhost', '') WHERE logo_url LIKE '%localhost%'").Error

	// Seed initial data if tables are empty
	seedInitialData(db)

	return db, nil
}

func seedInitialData(db *gorm.DB) {
	// 1. Seed StoreSettings if empty
	var settingsCount int64
	db.Model(&models.StoreSettings{}).Count(&settingsCount)
	if settingsCount == 0 {
		log.Println("Inicializando configuración por defecto de la tienda...")
		defaultSettings := models.StoreSettings{
			Name:           "TIENDA DEMO PYME",
			LogoURL:        "",
			PrimaryColor:   "#2d1b0e",
			SecondaryColor: "#9c6644",
			FooterText:     "© 2026 Tienda Demo. Venta directa por WhatsApp.",
			HeroTitle:      "Emprende con Estilo",
			HeroSubtitle:   "Catálogo digital para PYMEs. Haz tu pedido directo por WhatsApp con transferencia.",
			HeroImageURL:   "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2000&auto=format&fit=crop",
			WhatsAppNumber: "+56912345678",
			BankDetails:    "BancoEstado | CuentaRUT: 12.345.678-9 | Titular: Tienda PYME | Correo: pagos@tienda.cl",
			Currency:       "CLP",
		}
		db.Create(&defaultSettings)
	}

	// 2. Seed Products if empty
	var productCount int64
	db.Model(&models.Product{}).Count(&productCount)
	if productCount == 0 {
		log.Println("Sembrando catálogo de productos con precios CLP...")
		demoProducts := []models.Product{
			{
				ID:          uuid.New().String(),
				Name:        "Audífonos Bluetooth Pro",
				Slug:        "audifonos-bluetooth-pro",
				Description: "Cancelación activa de ruido, 40 horas de batería y sonido de alta fidelidad.",
				Category:    "accesorios",
				BasePrice:   49990,
				Stock:       15,
				ImageURL:    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
				IsActive:    true,
			},
			{
				ID:          uuid.New().String(),
				Name:        "Smartwatch Deportivo V2",
				Slug:        "smartwatch-deportivo",
				Description: "Monitoreo cardíaco, GPS integrado, sumergible y notificaciones de WhatsApp.",
				Category:    "accesorios",
				BasePrice:   79900,
				Stock:       10,
				ImageURL:    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
				IsActive:    true,
			},
			{
				ID:          uuid.New().String(),
				Name:        "Lámpara de Escritorio Nórdica",
				Slug:        "lampara-nordica",
				Description: "Luz cálida/fría graduable, diseño minimalista en madera y metal con carga USB.",
				Category:    "hogar",
				BasePrice:   29990,
				Stock:       25,
				ImageURL:    "https://images.unsplash.com/photo-1534972195531-a756b1126920?q=80&w=800&auto=format&fit=crop",
				IsActive:    true,
			},
			{
				ID:          uuid.New().String(),
				Name:        "Café de Grano Especial 250g",
				Slug:        "cafe-grano-especial",
				Description: "Tostado fresco artesanal con notas a cacao, avellanas y miel silvestre.",
				Category:    "cafes",
				BasePrice:   12990,
				Stock:       30,
				ImageURL:    "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?q=80&w=800&auto=format&fit=crop",
				IsActive:    true,
			},
		}
		for _, p := range demoProducts {
			db.Create(&p)
		}
		log.Printf("Se sembraron %d productos de muestra en CLP.", len(demoProducts))
	}
}
