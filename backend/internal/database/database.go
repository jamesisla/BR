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
		return nil, fmt.Errorf("error en AutoMigrate: %w", err)
	}

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
			Name:           "TIENDA ARTISAN",
			LogoURL:        "",
			PrimaryColor:   "#3d2b1f",
			SecondaryColor: "#a67c52",
			FooterText:     "© 2026 Tienda Artisan. Crafted for purity.",
			HeroTitle:      "El Arte de la Pureza",
			HeroSubtitle:   "Descubre nuestra selección artesanal única.",
			HeroImageURL:   "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2000&auto=format&fit=crop",
		}
		db.Create(&defaultSettings)
	}

	// 2. Seed Products if empty
	var productCount int64
	db.Model(&models.Product{}).Count(&productCount)
	if productCount == 0 {
		log.Println("Sembrando catálogo de productos de muestra...")
		demoProducts := []models.Product{
			{
				ID:          uuid.New().String(),
				Name:        "Aura Headphones",
				Slug:        "aura-headphones",
				Description: "Disfruta de un sonido puro con cancelación activa de ruido y 40 horas de batería continua.",
				Category:    "accesorios",
				BasePrice:   299.99,
				Stock:       15,
				ImageURL:    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
				IsActive:    true,
			},
			{
				ID:          uuid.New().String(),
				Name:        "Nebula Smart Watch",
				Slug:        "nebula-watch",
				Description: "El futuro en tu muñeca. Monitoreo avanzado de salud, GPS integrado y conectividad sin límites.",
				Category:    "accesorios",
				BasePrice:   499.00,
				Stock:       10,
				ImageURL:    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
				IsActive:    true,
			},
			{
				ID:          uuid.New().String(),
				Name:        "Lumina Desk Lamp",
				Slug:        "lumina-lamp",
				Description: "Iluminación inteligente minimalista que se adapta a tu ritmo de trabajo y confort visual.",
				Category:    "general",
				BasePrice:   89.50,
				Stock:       25,
				ImageURL:    "https://images.unsplash.com/photo-1534972195531-a756b1126920?q=80&w=800&auto=format&fit=crop",
				IsActive:    true,
			},
			{
				ID:          uuid.New().String(),
				Name:        "Café Especial Geisha",
				Slug:        "cafe-especial-geisha",
				Description: "Variedad Geisha de alta montaña con notas florales a jazmín, bergamota y miel silvestre.",
				Category:    "cafes",
				BasePrice:   24.90,
				Stock:       30,
				ImageURL:    "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?q=80&w=800&auto=format&fit=crop",
				IsActive:    true,
			},
		}
		for _, p := range demoProducts {
			db.Create(&p)
		}
		log.Printf("Se sembraron %d productos de muestra.", len(demoProducts))
	}
}
