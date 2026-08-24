package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// Category represents a product category with name, slug, icon and order
type Category struct {
	ID        string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Name      string    `gorm:"type:varchar(100);not null" json:"name"`
	Slug      string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"slug"`
	Icon      string    `gorm:"type:varchar(50);default:'tag'" json:"icon"`
	Order     int       `gorm:"type:integer;default:0" json:"order"`
	IsActive  bool      `gorm:"type:boolean;default:true" json:"is_active"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// CategoryCreate represents payload to create or update a category
type CategoryCreate struct {
	Name     string `json:"name" binding:"required"`
	Slug     string `json:"slug" binding:"required"`
	Icon     string `json:"icon"`
	Order    int    `json:"order"`
	IsActive *bool  `json:"is_active"`
}

// Product represents an item for sale in the store
type Product struct {
	ID          string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`
	Slug        string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"slug"`
	Description string    `gorm:"type:text" json:"description"`
	Category    string    `gorm:"type:varchar(100);default:'general'" json:"category"`
	BasePrice   float64   `gorm:"type:decimal(12,0);not null" json:"base_price"`
	Stock       int       `gorm:"type:integer;default:10" json:"stock"`
	ImageURL    string    `gorm:"type:varchar(500)" json:"image_url"`
	Images      string    `gorm:"type:text;default:'[]'" json:"images_raw,omitempty"`
	ImagesList  []string  `gorm:"-" json:"images"`
	IsActive    bool      `gorm:"type:boolean;default:true" json:"is_active"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (p *Product) AfterFind(tx *gorm.DB) (err error) {
	if p.Images != "" && p.Images != "[]" {
		_ = json.Unmarshal([]byte(p.Images), &p.ImagesList)
	}
	if len(p.ImagesList) == 0 && p.ImageURL != "" {
		p.ImagesList = []string{p.ImageURL}
	}
	return nil
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
	Images      []string `json:"images"`
	IsActive    *bool    `json:"is_active"`
}

// Order represents a customer purchase
type Order struct {
	ID        string      `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Email     string      `gorm:"type:varchar(255);not null" json:"email"`
	FirstName string      `gorm:"type:varchar(255);not null" json:"first_name"`
	LastName  string      `gorm:"type:varchar(255);not null" json:"last_name"`
	Address   string      `gorm:"type:text;not null" json:"address"`
	Total     float64     `gorm:"type:decimal(12,0);not null" json:"total"`
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
	PriceAtPurchase float64  `gorm:"type:decimal(12,0);not null" json:"price_at_purchase"`
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

// StoreSettings represents store branding, announcements, WhatsApp orders and payment info
type StoreSettings struct {
	ID                 uint   `gorm:"primaryKey" json:"id"`
	Name               string `gorm:"type:varchar(255);default:'TIENDA PYME'" json:"name"`
	LogoURL            string `gorm:"type:varchar(500);default:''" json:"logo_url"`
	PrimaryColor       string `gorm:"type:varchar(50);default:'#2d1b0e'" json:"primary_color"`
	SecondaryColor     string `gorm:"type:varchar(50);default:'#9c6644'" json:"secondary_color"`
	FooterText         string `gorm:"type:text;default:'© 2026 Tienda PYME. Ventas directas por WhatsApp.'" json:"footer_text"`
	HeroSize           string `gorm:"type:varchar(20);default:'half'" json:"hero_size"`
	HeroTitle          string `gorm:"type:varchar(255);default:'Emprende con Estilo'" json:"hero_title"`
	HeroSubtitle       string `gorm:"type:varchar(500);default:'Descubre nuestra selección exclusiva. Haz tus pedidos de forma rápida por WhatsApp.'" json:"hero_subtitle"`
	HeroImageURL       string `gorm:"type:varchar(500);default:''" json:"hero_image_url"`
	WhatsAppNumber     string `gorm:"type:varchar(50);default:'+56912345678'" json:"whatsapp_number"`
	WhatsAppMessage    string `gorm:"type:text;default:'¡Hola! Me gustaría consultar o pedir:'" json:"whatsapp_message"`
	BankDetails        string `gorm:"type:text;default:'BancoEstado | CuentaRUT: 12.345.678-9 | Titular: Mi Tienda | Correo: pagos@tienda.cl'" json:"bank_details"`
	ShippingInfo       string `gorm:"type:text;default:'Envíos a todo Chile vía Starken / Chilexpress o retiro acordado por WhatsApp.'" json:"shipping_info"`
	InstagramURL       string `gorm:"type:varchar(255);default:''" json:"instagram_url"`
	AnnouncementBar    string `gorm:"type:varchar(255);default:'🚚 ¡Envíos a todo Chile! Paga fácil y seguro con Transferencia Bancaria'" json:"announcement_bar"`
	AnnouncementActive bool   `gorm:"type:boolean;default:true" json:"announcement_active"`
	Currency           string `gorm:"type:varchar(10);default:'CLP'" json:"currency"`
	AnalyticsEnabled   bool   `gorm:"type:boolean;default:true" json:"analytics_enabled"`
	IgnoreAdminVisits  bool   `gorm:"type:boolean;default:true" json:"ignore_admin_visits"`
}

// Visit stores rich visitor & connection information
type Visit struct {
	ID                  string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	VisitorID           string    `gorm:"type:varchar(64);index" json:"visitor_id"`
	SessionID           string    `gorm:"type:varchar(64);index" json:"session_id"`
	IP                  string    `gorm:"type:varchar(64);index" json:"ip"`
	
	// Geolocation & Network
	CountryCode         string    `gorm:"type:varchar(10);index" json:"country_code"`
	CountryName         string    `gorm:"type:varchar(100)" json:"country_name"`
	City                string    `gorm:"type:varchar(100);index" json:"city"`
	Region              string    `gorm:"type:varchar(100)" json:"region"`
	ISP                 string    `gorm:"type:varchar(200)" json:"isp"`
	
	// Navigation & Page
	Path                string    `gorm:"type:varchar(500);index" json:"path"`
	PageURL             string    `gorm:"type:text" json:"page_url"`
	PageTitle           string    `gorm:"type:varchar(255)" json:"page_title"`
	Referrer            string    `gorm:"type:varchar(500)" json:"referrer"`
	ReferrerDomain      string    `gorm:"type:varchar(150);index" json:"referrer_domain"`
	
	// Marketing UTM
	UTMSource           string    `gorm:"type:varchar(100);index" json:"utm_source"`
	UTMMedium           string    `gorm:"type:varchar(100)" json:"utm_medium"`
	UTMCampaign         string    `gorm:"type:varchar(100)" json:"utm_campaign"`
	UTMTerm             string    `gorm:"type:varchar(100)" json:"utm_term"`
	UTMContent          string    `gorm:"type:varchar(100)" json:"utm_content"`
	
	// Device & Browser
	DeviceType          string    `gorm:"type:varchar(50);index" json:"device_type"` // desktop, mobile, tablet, bot
	Browser             string    `gorm:"type:varchar(100);index" json:"browser"`
	BrowserVersion      string    `gorm:"type:varchar(50)" json:"browser_version"`
	OS                  string    `gorm:"type:varchar(100);index" json:"os"`
	OSVersion           string    `gorm:"type:varchar(50)" json:"os_version"`
	Platform            string    `gorm:"type:varchar(100)" json:"platform"`
	UserAgent           string    `gorm:"type:text" json:"user_agent"`
	
	// Hardware & Screen
	ScreenResolution    string    `gorm:"type:varchar(50)" json:"screen_resolution"`
	ViewportSize        string    `gorm:"type:varchar(50)" json:"viewport_size"`
	ColorDepth          int       `gorm:"type:integer" json:"color_depth"`
	PixelRatio          float64   `gorm:"type:decimal(4,2)" json:"pixel_ratio"`
	HardwareConcurrency int       `gorm:"type:integer" json:"hardware_concurrency"`
	DeviceMemory        float64   `gorm:"type:decimal(4,1)" json:"device_memory"`
	TouchPoints         int       `gorm:"type:integer" json:"touch_points"`
	
	// Connection & Environment
	NetworkType         string    `gorm:"type:varchar(50)" json:"network_type"`
	Downlink            float64   `gorm:"type:decimal(6,2)" json:"downlink"`
	RTT                 int       `gorm:"type:integer" json:"rtt"`
	Language            string    `gorm:"type:varchar(50)" json:"language"`
	Languages           string    `gorm:"type:varchar(200)" json:"languages"`
	Timezone            string    `gorm:"type:varchar(100)" json:"timezone"`
	TimezoneOffset      int       `gorm:"type:integer" json:"timezone_offset"`
	IsSecure            bool      `gorm:"type:boolean" json:"is_secure"`
	IsAdmin             bool      `gorm:"type:boolean;default:false;index" json:"is_admin"`
	
	DurationSeconds     int       `gorm:"type:integer;default:0" json:"duration_seconds"`
	CreatedAt           time.Time `gorm:"autoCreateTime;index" json:"created_at"`
}

// TrackVisitRequest represents incoming visit tracking data from client
type TrackVisitRequest struct {
	VisitorID           string  `json:"visitor_id"`
	SessionID           string  `json:"session_id"`
	Path                string  `json:"path"`
	PageURL             string  `json:"page_url"`
	PageTitle           string  `json:"page_title"`
	Referrer            string  `json:"referrer"`
	UTMSource           string  `json:"utm_source"`
	UTMMedium           string  `json:"utm_medium"`
	UTMCampaign         string  `json:"utm_campaign"`
	UTMTerm             string  `json:"utm_term"`
	UTMContent          string  `json:"utm_content"`
	ScreenResolution    string  `json:"screen_resolution"`
	ViewportSize        string  `json:"viewport_size"`
	ColorDepth          int     `json:"color_depth"`
	PixelRatio          float64 `json:"pixel_ratio"`
	HardwareConcurrency int     `json:"hardware_concurrency"`
	DeviceMemory        float64 `json:"device_memory"`
	TouchPoints         int     `json:"touch_points"`
	NetworkType         string  `json:"network_type"`
	Downlink            float64 `json:"downlink"`
	RTT                 int     `json:"rtt"`
	Language            string  `json:"language"`
	Languages           string  `json:"languages"`
	Timezone            string  `json:"timezone"`
	TimezoneOffset      int     `json:"timezone_offset"`
	Platform            string  `json:"platform"`
	IsAdmin             bool    `json:"is_admin"`
	DurationSeconds     int     `json:"duration_seconds"`
}

// AnalyticsSummary represents high-level metrics and breakdowns
type AnalyticsSummary struct {
	TotalVisits        int64                    `json:"total_visits"`
	UniqueVisitors     int64                    `json:"unique_visitors"`
	TodayVisits        int64                    `json:"today_visits"`
	TodayVisitors      int64                    `json:"today_visitors"`
	MobilePercentage   float64                  `json:"mobile_percentage"`
	DesktopPercentage  float64                  `json:"desktop_percentage"`
	TabletPercentage   float64                  `json:"tablet_percentage"`
	AvgDurationSeconds int                      `json:"avg_duration_seconds"`
	AnalyticsEnabled   bool                     `json:"analytics_enabled"`
	Trends             []AnalyticsTrendItem     `json:"trends"`
	TopDevices         []AnalyticsBreakdownItem `json:"top_devices"`
	TopBrowsers        []AnalyticsBreakdownItem `json:"top_browsers"`
	TopOS              []AnalyticsBreakdownItem `json:"top_os"`
	TopPages           []AnalyticsBreakdownItem `json:"top_pages"`
	TopReferrers       []AnalyticsBreakdownItem `json:"top_referrers"`
	TopCountries       []AnalyticsBreakdownItem `json:"top_countries"`
	TopCities          []AnalyticsBreakdownItem `json:"top_cities"`
	TopCampaigns       []AnalyticsCampaignItem  `json:"top_campaigns"`
}

// AnalyticsTrendItem represents a point in the time-series chart
type AnalyticsTrendItem struct {
	Date           string `json:"date"`
	Visits         int64  `json:"visits"`
	UniqueVisitors int64  `json:"unique_visitors"`
	Mobile         int64  `json:"mobile"`
	Desktop        int64  `json:"desktop"`
}

// AnalyticsBreakdownItem represents categorical breakdown (device, browser, page, country, etc.)
type AnalyticsBreakdownItem struct {
	Name       string  `json:"name"`
	Code       string  `json:"code,omitempty"`
	Count      int64   `json:"count"`
	Percentage float64 `json:"percentage"`
}

// AnalyticsCampaignItem represents UTM campaign stats
type AnalyticsCampaignItem struct {
	Source   string `json:"source"`
	Medium   string `json:"medium"`
	Campaign string `json:"campaign"`
	Count    int64  `json:"count"`
}

// VisitsListResponse represents paginated visit items
type VisitsListResponse struct {
	Items      []Visit `json:"items"`
	Total      int64   `json:"total"`
	Page       int     `json:"page"`
	Limit      int     `json:"limit"`
	TotalPages int     `json:"total_pages"`
}

// ToggleAnalyticsRequest represents request to enable/disable analytics
type ToggleAnalyticsRequest struct {
	Enabled           *bool `json:"enabled"`
	IgnoreAdminVisits *bool `json:"ignore_admin_visits"`
}

// PurgeVisitsRequest represents request to delete old visit data
type PurgeVisitsRequest struct {
	Period string `json:"period" binding:"required"` // "all", "older_than_30d", "older_than_90d"
}

// LoginRequest represents admin login credentials
type LoginRequest struct {
	Password string `json:"password" binding:"required"`
}

// PaymentPreferenceRequest represents request to generate Mercado Pago checkout preference
type PaymentPreferenceRequest struct {
	OrderID string `json:"order_id" binding:"required"`
}
