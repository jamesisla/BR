package models

import (
	"time"
)

// Product represents an item for sale in the generic store
type Product struct {
	ID          string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`
	Slug        string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"slug"`
	Description string    `gorm:"type:text" json:"description"`
	Category    string    `gorm:"type:varchar(100);default:'general'" json:"category"`
	BasePrice   float64   `gorm:"type:decimal(10,2);not null" json:"base_price"`
	Stock       int       `gorm:"type:integer;default:10" json:"stock"`
	ImageURL    string    `gorm:"type:varchar(500)" json:"image_url"`
	IsActive    bool      `gorm:"type:boolean;default:true" json:"is_active"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// ProductCreate represents the payload to create or update a product
type ProductCreate struct {
	Name        string   `json:"name" binding:"required"`
	Slug        string   `json:"slug" binding:"required"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	BasePrice   float64  `json:"base_price" binding:"required"`
	Stock       int      `json:"stock"`
	ImageURL    string   `json:"image_url"`
	IsActive    *bool    `json:"is_active"`
}

// Order represents a customer purchase
type Order struct {
	ID        string      `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Email     string      `gorm:"type:varchar(255);not null" json:"email"`
	FirstName string      `gorm:"type:varchar(255);not null" json:"first_name"`
	LastName  string      `gorm:"type:varchar(255);not null" json:"last_name"`
	Address   string      `gorm:"type:text;not null" json:"address"`
	Total     float64     `gorm:"type:decimal(10,2);not null" json:"total"`
	Status    string      `gorm:"type:varchar(50);default:'pending'" json:"status"` // pending, paid, shipped, cancelled
	CreatedAt time.Time   `gorm:"autoCreateTime" json:"created_at"`
	Items     []OrderItem `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE" json:"items"`
}

// OrderItem represents a line item in an order
type OrderItem struct {
	ID              uint     `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID         string   `gorm:"type:varchar(36);index;not null" json:"order_id"`
	ProductID       string   `gorm:"type:varchar(36);not null" json:"product_id"`
	Quantity        int      `gorm:"not null" json:"quantity"`
	PriceAtPurchase float64  `gorm:"type:decimal(10,2);not null" json:"price_at_purchase"`
	Product         *Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

// OrderCreate represents the incoming checkout payload
type OrderCreate struct {
	Email     string            `json:"email" binding:"required"`
	FirstName string            `json:"first_name" binding:"required"`
	LastName  string            `json:"last_name" binding:"required"`
	Address   string            `json:"address" binding:"required"`
	Total     float64           `json:"total" binding:"required"`
	Items     []OrderItemCreate `json:"items" binding:"required,min=1"`
}

// OrderItemCreate represents each purchased product item in the payload
type OrderItemCreate struct {
	ProductID       string  `json:"product_id" binding:"required"`
	Quantity        int     `json:"quantity" binding:"required,min=1"`
	PriceAtPurchase float64 `json:"price_at_purchase" binding:"required"`
}

// StoreSettings represents store branding and landing page customization
type StoreSettings struct {
	ID             uint   `gorm:"primaryKey" json:"id"`
	Name           string `gorm:"type:varchar(255);default:'TIENDA ARTISAN'" json:"name"`
	LogoURL        string `gorm:"type:varchar(500);default:''" json:"logo_url"`
	PrimaryColor   string `gorm:"type:varchar(50);default:'#3d2b1f'" json:"primary_color"`
	SecondaryColor string `gorm:"type:varchar(50);default:'#a67c52'" json:"secondary_color"`
	FooterText     string `gorm:"type:text;default:'© 2026 Tienda Artisan. Crafted for purity.'" json:"footer_text"`
	HeroTitle      string `gorm:"type:varchar(255);default:'El Arte de la Pureza'" json:"hero_title"`
	HeroSubtitle   string `gorm:"type:varchar(500);default:'Descubre nuestra selección artesanal única.'" json:"hero_subtitle"`
	HeroImageURL   string `gorm:"type:varchar(500);default:''" json:"hero_image_url"`
}

// LoginRequest represents admin login credentials
type LoginRequest struct {
	Password string `json:"password" binding:"required"`
}

// PaymentPreferenceRequest represents request to generate Mercado Pago checkout preference
type PaymentPreferenceRequest struct {
	OrderID string `json:"order_id" binding:"required"`
}
