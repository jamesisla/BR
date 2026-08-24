package handlers

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"tienda-backend/internal/models"
	"tienda-backend/internal/services"
)

type AnalyticsHandler struct {
	db  *gorm.DB
	geo *services.GeoService
}

func NewAnalyticsHandler(db *gorm.DB) *AnalyticsHandler {
	return &AnalyticsHandler{
		db:  db,
		geo: services.GetGeoService(),
	}
}

// Track records a visitor session or pageview
func (h *AnalyticsHandler) Track(c *gin.Context) {
	// 1. Check if analytics is enabled in store settings
	var settings models.StoreSettings
	if err := h.db.First(&settings).Error; err == nil {
		if !settings.AnalyticsEnabled {
			c.JSON(http.StatusOK, gin.H{"status": "disabled"})
			return
		}
	}

	var req models.TrackVisitRequest
	_ = c.ShouldBindJSON(&req)

	// 2. Identify Admin status
	isAdmin := req.IsAdmin || strings.HasPrefix(req.Path, "/admin")

	// 3. Extract Real Client IP & Geolocation
	clientIP := h.geo.GetClientIP(c.Request)
	geo := h.geo.ResolveLocation(c.Request, clientIP)

	// 4. Parse User-Agent
	uaStr := c.Request.UserAgent()
	uaDetails := services.ParseUserAgent(uaStr)

	// 5. Clean & normalize Referrer Domain
	refDomain := "Directo / URL"
	refURL := req.Referrer
	if refURL == "" {
		refURL = c.Request.Referer()
	}
	if refURL != "" {
		if parsed, err := url.Parse(refURL); err == nil && parsed.Host != "" {
			host := strings.ToLower(parsed.Host)
			host = strings.TrimPrefix(host, "www.")
			if strings.Contains(host, "instagram.com") || strings.Contains(host, "ig.me") {
				refDomain = "Instagram"
			} else if strings.Contains(host, "facebook.com") || strings.Contains(host, "fb.me") {
				refDomain = "Facebook"
			} else if strings.Contains(host, "whatsapp.com") || strings.Contains(host, "wa.me") {
				refDomain = "WhatsApp"
			} else if strings.Contains(host, "tiktok.com") {
				refDomain = "TikTok"
			} else if strings.Contains(host, "google.") {
				refDomain = "Google Search"
			} else if strings.Contains(host, "bing.") {
				refDomain = "Bing"
			} else if strings.Contains(host, "youtube.com") || strings.Contains(host, "youtu.be") {
				refDomain = "YouTube"
			} else if strings.Contains(host, "twitter.com") || strings.Contains(host, "x.com") || strings.Contains(host, "t.co") {
				refDomain = "X (Twitter)"
			} else {
				refDomain = host
			}
		}
	}

	// Check HTTPS
	isSecure := c.Request.TLS != nil ||
		strings.ToLower(c.Request.Header.Get("X-Forwarded-Proto")) == "https" ||
		strings.ToLower(c.Request.Header.Get("CF-Visitor")) != ""

	// Ensure IDs
	visitorID := req.VisitorID
	if visitorID == "" {
		visitorID = uuid.New().String()
	}
	sessionID := req.SessionID
	if sessionID == "" {
		sessionID = uuid.New().String()
	}

	path := req.Path
	if path == "" {
		path = c.Request.URL.Path
	}

	pageURL := req.PageURL
	if pageURL == "" {
		pageURL = c.Request.RequestURI
	}

	deviceType := uaDetails.DeviceType
	if req.TouchPoints > 0 && deviceType == "desktop" && (strings.Contains(strings.ToLower(req.Platform), "arm") || req.PixelRatio >= 2) {
		deviceType = "mobile"
	}

	visit := models.Visit{
		ID:                  uuid.New().String(),
		VisitorID:           visitorID,
		SessionID:           sessionID,
		IP:                  clientIP,
		CountryCode:         geo.CountryCode,
		CountryName:         geo.CountryName,
		City:                geo.City,
		Region:              geo.Region,
		ISP:                 geo.ISP,
		Path:                path,
		PageURL:             pageURL,
		PageTitle:           req.PageTitle,
		Referrer:            refURL,
		ReferrerDomain:      refDomain,
		UTMSource:           req.UTMSource,
		UTMMedium:           req.UTMMedium,
		UTMCampaign:         req.UTMCampaign,
		UTMTerm:             req.UTMTerm,
		UTMContent:          req.UTMContent,
		DeviceType:          deviceType,
		Browser:             uaDetails.Browser,
		BrowserVersion:      uaDetails.BrowserVersion,
		OS:                  uaDetails.OS,
		OSVersion:           uaDetails.OSVersion,
		Platform:            req.Platform,
		UserAgent:           uaStr,
		ScreenResolution:    req.ScreenResolution,
		ViewportSize:        req.ViewportSize,
		ColorDepth:          req.ColorDepth,
		PixelRatio:          req.PixelRatio,
		HardwareConcurrency: req.HardwareConcurrency,
		DeviceMemory:        req.DeviceMemory,
		TouchPoints:         req.TouchPoints,
		NetworkType:         req.NetworkType,
		Downlink:            req.Downlink,
		RTT:                 req.RTT,
		Language:            req.Language,
		Languages:           req.Languages,
		Timezone:            req.Timezone,
		TimezoneOffset:      req.TimezoneOffset,
		IsSecure:            isSecure,
		IsAdmin:             isAdmin,
		DurationSeconds:     req.DurationSeconds,
		CreatedAt:           time.Now(),
	}

	if err := h.db.Create(&visit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error guardando visita: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     "tracked",
		"id":         visit.ID,
		"visitor_id": visit.VisitorID,
		"session_id": visit.SessionID,
	})
}

func (h *AnalyticsHandler) getFilteredQuery(period string, includeAdmin bool) *gorm.DB {
	q := h.db.Model(&models.Visit{})
	now := time.Now()
	var startTime time.Time

	switch period {
	case "today":
		startTime = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	case "30d":
		startTime = now.AddDate(0, 0, -30)
	case "all":
		startTime = time.Time{}
	default: // 7d
		startTime = now.AddDate(0, 0, -7)
	}

	if !startTime.IsZero() {
		q = q.Where("created_at >= ?", startTime)
	}

	if !includeAdmin {
		q = q.Where("is_admin = ?", false)
	}

	return q
}

// GetSummary calculates metric summaries, trends and breakdowns
func (h *AnalyticsHandler) GetSummary(c *gin.Context) {
	period := c.DefaultQuery("period", "7d") // today, 7d, 30d, all
	includeAdminParam := c.Query("include_admin")

	// Get Store Settings for Analytics status
	var settings models.StoreSettings
	analyticsEnabled := true
	ignoreAdmin := true
	if err := h.db.First(&settings).Error; err == nil {
		analyticsEnabled = settings.AnalyticsEnabled
		ignoreAdmin = settings.IgnoreAdminVisits
	}

	if includeAdminParam == "true" {
		ignoreAdmin = false
	} else if includeAdminParam == "false" {
		ignoreAdmin = true
	}

	summary := models.AnalyticsSummary{
		AnalyticsEnabled: analyticsEnabled,
		Trends:           make([]models.AnalyticsTrendItem, 0),
		TopProducts:      make([]models.ProductMetricItem, 0),
		TopDevices:       make([]models.AnalyticsBreakdownItem, 0),
		TopBrowsers:      make([]models.AnalyticsBreakdownItem, 0),
		TopOS:            make([]models.AnalyticsBreakdownItem, 0),
		TopPages:         make([]models.AnalyticsBreakdownItem, 0),
		TopReferrers:     make([]models.AnalyticsBreakdownItem, 0),
		TopCountries:     make([]models.AnalyticsBreakdownItem, 0),
		TopCities:        make([]models.AnalyticsBreakdownItem, 0),
		TopCampaigns:     make([]models.AnalyticsCampaignItem, 0),
	}

	// 1. Total Visits in period
	h.getFilteredQuery(period, !ignoreAdmin).Count(&summary.TotalVisits)

	// 2. Unique Visitors in period
	h.getFilteredQuery(period, !ignoreAdmin).Distinct("visitor_id").Count(&summary.UniqueVisitors)

	// 3. Today's visits and visitors
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	h.db.Model(&models.Visit{}).Where("created_at >= ? AND is_admin = false", todayStart).Count(&summary.TodayVisits)
	h.db.Model(&models.Visit{}).Where("created_at >= ? AND is_admin = false", todayStart).Distinct("visitor_id").Count(&summary.TodayVisitors)

	// 4. Device Breakdown & Percentages
	type DeviceCount struct {
		DeviceType string `gorm:"column:device_type"`
		Count      int64  `gorm:"column:count"`
	}
	var deviceCounts []DeviceCount
	h.getFilteredQuery(period, !ignoreAdmin).Select("device_type, count(*) as count").Group("device_type").Order("count DESC").Scan(&deviceCounts)

	var mobileCount, desktopCount, tabletCount int64
	for _, d := range deviceCounts {
		name := strings.ToLower(d.DeviceType)
		pct := float64(0)
		if summary.TotalVisits > 0 {
			pct = (float64(d.Count) / float64(summary.TotalVisits)) * 100
		}
		label := "Desktop (Computador)"
		if name == "mobile" {
			mobileCount += d.Count
			label = "Smartphone (Móvil)"
		} else if name == "tablet" {
			tabletCount += d.Count
			label = "Tablet"
		} else if name == "bot" {
			label = "Bot / Rastreador"
		} else {
			desktopCount += d.Count
		}
		summary.TopDevices = append(summary.TopDevices, models.AnalyticsBreakdownItem{
			Name:       label,
			Code:       name,
			Count:      d.Count,
			Percentage: pct,
		})
	}
	if summary.TotalVisits > 0 {
		summary.MobilePercentage = (float64(mobileCount) / float64(summary.TotalVisits)) * 100
		summary.DesktopPercentage = (float64(desktopCount) / float64(summary.TotalVisits)) * 100
		summary.TabletPercentage = (float64(tabletCount) / float64(summary.TotalVisits)) * 100
	}

	// 5. Daily Trends (Group by Date)
	type TrendRow struct {
		DayStr     string `gorm:"column:day_str"`
		Visits     int64  `gorm:"column:visits"`
		UniqueVids int64  `gorm:"column:unique_vids"`
		Mobile     int64  `gorm:"column:mobile"`
		Desktop    int64  `gorm:"column:desktop"`
	}
	var trendRows []TrendRow

	h.getFilteredQuery(period, !ignoreAdmin).Select(
		"SUBSTR(created_at, 1, 10) as day_str, " +
			"COUNT(*) as visits, " +
			"COUNT(DISTINCT visitor_id) as unique_vids, " +
			"SUM(CASE WHEN device_type = 'mobile' THEN 1 ELSE 0 END) as mobile, " +
			"SUM(CASE WHEN device_type = 'desktop' THEN 1 ELSE 0 END) as desktop",
	).Group("SUBSTR(created_at, 1, 10)").Order("day_str ASC").Scan(&trendRows)

	for _, tr := range trendRows {
		if tr.DayStr != "" {
			summary.Trends = append(summary.Trends, models.AnalyticsTrendItem{
				Date:           tr.DayStr,
				Visits:         tr.Visits,
				UniqueVisitors: tr.UniqueVids,
				Mobile:         tr.Mobile,
				Desktop:        tr.Desktop,
			})
		}
	}

	// 6. Top Browsers
	type CatCount struct {
		Name  string `gorm:"column:name"`
		Count int64  `gorm:"column:count"`
	}
	var browserCounts []CatCount
	h.getFilteredQuery(period, !ignoreAdmin).Select("browser as name, count(*) as count").Where("browser != ''").Group("browser").Order("count DESC").Limit(8).Scan(&browserCounts)
	for _, b := range browserCounts {
		pct := float64(0)
		if summary.TotalVisits > 0 {
			pct = (float64(b.Count) / float64(summary.TotalVisits)) * 100
		}
		summary.TopBrowsers = append(summary.TopBrowsers, models.AnalyticsBreakdownItem{
			Name:       b.Name,
			Count:      b.Count,
			Percentage: pct,
		})
	}

	// 7. Top OS
	var osCounts []CatCount
	h.getFilteredQuery(period, !ignoreAdmin).Select("os as name, count(*) as count").Where("os != ''").Group("os").Order("count DESC").Limit(8).Scan(&osCounts)
	for _, o := range osCounts {
		pct := float64(0)
		if summary.TotalVisits > 0 {
			pct = (float64(o.Count) / float64(summary.TotalVisits)) * 100
		}
		summary.TopOS = append(summary.TopOS, models.AnalyticsBreakdownItem{
			Name:       o.Name,
			Count:      o.Count,
			Percentage: pct,
		})
	}

	// 8. Top Visited Pages
	var pageCounts []CatCount
	h.getFilteredQuery(period, !ignoreAdmin).Select("path as name, count(*) as count").Where("path != ''").Group("path").Order("count DESC").Limit(10).Scan(&pageCounts)
	for _, p := range pageCounts {
		pct := float64(0)
		if summary.TotalVisits > 0 {
			pct = (float64(p.Count) / float64(summary.TotalVisits)) * 100
		}
		summary.TopPages = append(summary.TopPages, models.AnalyticsBreakdownItem{
			Name:       p.Name,
			Count:      p.Count,
			Percentage: pct,
		})
	}

	// 8.1. Published Products Performance & View Metrics
	var allProducts []models.Product
	h.db.Find(&allProducts)

	type ProdViewStat struct {
		Path           string     `gorm:"column:path"`
		Views          int64      `gorm:"column:views"`
		UniqueVisitors int64      `gorm:"column:unique_visitors"`
		LastViewed     *time.Time `gorm:"column:last_viewed"`
	}
	var prodViewStats []ProdViewStat
	h.getFilteredQuery(period, !ignoreAdmin).
		Select("path, count(*) as views, count(distinct visitor_id) as unique_visitors, max(created_at) as last_viewed").
		Where("LOWER(path) LIKE '%/product/%'").
		Group("path").
		Scan(&prodViewStats)

	// Map of slug/id -> stats
	statsBySlug := make(map[string]ProdViewStat)
	var totalProductViews int64
	for _, row := range prodViewStats {
		loweredPath := strings.ToLower(row.Path)
		idx := strings.Index(loweredPath, "/product/")
		if idx == -1 {
			continue
		}
		rawSlug := row.Path[idx+len("/product/"):]
		rawSlug = strings.Split(rawSlug, "?")[0]
		rawSlug = strings.Split(rawSlug, "#")[0]
		rawSlug = strings.Trim(rawSlug, "/")
		if rawSlug != "" {
			slugKey := strings.ToLower(rawSlug)
			existing := statsBySlug[slugKey]
			existing.Views += row.Views
			existing.UniqueVisitors += row.UniqueVisitors
			if existing.LastViewed == nil || (row.LastViewed != nil && row.LastViewed.After(*existing.LastViewed)) {
				existing.LastViewed = row.LastViewed
			}
			statsBySlug[slugKey] = existing
			totalProductViews += row.Views
		}
	}
	summary.TotalProductViews = totalProductViews

	// Build productMetrics list for all catalog products
	matchedSlugs := make(map[string]bool)
	var productMetrics []models.ProductMetricItem

	for _, prod := range allProducts {
		slugKey := strings.ToLower(prod.Slug)
		idKey := strings.ToLower(prod.ID)

		stat, hasStat := statsBySlug[slugKey]
		if !hasStat {
			stat, hasStat = statsBySlug[idKey]
			if hasStat && stat.Views > 0 {
				matchedSlugs[idKey] = true
			}
		} else {
			matchedSlugs[slugKey] = true
		}

		pct := float64(0)
		if totalProductViews > 0 && stat.Views > 0 {
			pct = (float64(stat.Views) / float64(totalProductViews)) * 100
		}

		img := prod.ImageURL
		if len(prod.ImagesList) > 0 {
			img = prod.ImagesList[0]
		} else if prod.Images != "" {
			var imgList []string
			if err := json.Unmarshal([]byte(prod.Images), &imgList); err == nil && len(imgList) > 0 {
				img = imgList[0]
			}
		}

		productMetrics = append(productMetrics, models.ProductMetricItem{
			ID:             prod.ID,
			Name:           prod.Name,
			Slug:           prod.Slug,
			Category:       prod.Category,
			BasePrice:      prod.BasePrice,
			ImageURL:       img,
			Views:          stat.Views,
			UniqueVisitors: stat.UniqueVisitors,
			Percentage:     pct,
			LastViewedAt:   stat.LastViewed,
			Stock:          prod.Stock,
			IsActive:       prod.IsActive,
		})
	}

	// Add any views for product slugs that might not exist in products table
	for slug, stat := range statsBySlug {
		if !matchedSlugs[slug] && stat.Views > 0 {
			pct := float64(0)
			if totalProductViews > 0 {
				pct = (float64(stat.Views) / float64(totalProductViews)) * 100
			}
			productMetrics = append(productMetrics, models.ProductMetricItem{
				ID:             slug,
				Name:           "Producto: " + slug,
				Slug:           slug,
				Category:       "catalogo",
				Views:          stat.Views,
				UniqueVisitors: stat.UniqueVisitors,
				Percentage:     pct,
				LastViewedAt:   stat.LastViewed,
				IsActive:       true,
			})
		}
	}

	// Sort products: Views DESC, then UniqueVisitors DESC, then Name ASC
	sort.Slice(productMetrics, func(i, j int) bool {
		if productMetrics[i].Views != productMetrics[j].Views {
			return productMetrics[i].Views > productMetrics[j].Views
		}
		if productMetrics[i].UniqueVisitors != productMetrics[j].UniqueVisitors {
			return productMetrics[i].UniqueVisitors > productMetrics[j].UniqueVisitors
		}
		return productMetrics[i].Name < productMetrics[j].Name
	})

	summary.TopProducts = productMetrics

	// 9. Top Referrers
	var refCounts []CatCount
	h.getFilteredQuery(period, !ignoreAdmin).Select("referrer_domain as name, count(*) as count").Where("referrer_domain != ''").Group("referrer_domain").Order("count DESC").Limit(8).Scan(&refCounts)
	for _, r := range refCounts {
		pct := float64(0)
		if summary.TotalVisits > 0 {
			pct = (float64(r.Count) / float64(summary.TotalVisits)) * 100
		}
		summary.TopReferrers = append(summary.TopReferrers, models.AnalyticsBreakdownItem{
			Name:       r.Name,
			Count:      r.Count,
			Percentage: pct,
		})
	}

	// 10. Top Countries
	type CountryCount struct {
		Name  string `gorm:"column:name"`
		Code  string `gorm:"column:code"`
		Count int64  `gorm:"column:count"`
	}
	var countryCounts []CountryCount
	h.getFilteredQuery(period, !ignoreAdmin).Select("country_name as name, country_code as code, count(*) as count").Where("country_name != ''").Group("country_name, country_code").Order("count DESC").Limit(8).Scan(&countryCounts)
	for _, c := range countryCounts {
		pct := float64(0)
		if summary.TotalVisits > 0 {
			pct = (float64(c.Count) / float64(summary.TotalVisits)) * 100
		}
		summary.TopCountries = append(summary.TopCountries, models.AnalyticsBreakdownItem{
			Name:       c.Name,
			Code:       c.Code,
			Count:      c.Count,
			Percentage: pct,
		})
	}

	// 11. Top Cities
	var cityCounts []CatCount
	h.getFilteredQuery(period, !ignoreAdmin).Select("city as name, count(*) as count").Where("city != ''").Group("city").Order("count DESC").Limit(8).Scan(&cityCounts)
	for _, ci := range cityCounts {
		pct := float64(0)
		if summary.TotalVisits > 0 {
			pct = (float64(ci.Count) / float64(summary.TotalVisits)) * 100
		}
		summary.TopCities = append(summary.TopCities, models.AnalyticsBreakdownItem{
			Name:       ci.Name,
			Count:      ci.Count,
			Percentage: pct,
		})
	}

	// 12. Top UTM Campaigns
	type CampRow struct {
		Source   string `gorm:"column:source"`
		Medium   string `gorm:"column:medium"`
		Campaign string `gorm:"column:campaign"`
		Count    int64  `gorm:"column:count"`
	}
	var campRows []CampRow
	h.getFilteredQuery(period, !ignoreAdmin).Select("utm_source as source, utm_medium as medium, utm_campaign as campaign, count(*) as count").
		Where("utm_source != '' OR utm_campaign != ''").
		Group("utm_source, utm_medium, utm_campaign").
		Order("count DESC").
		Limit(8).
		Scan(&campRows)

	for _, cr := range campRows {
		summary.TopCampaigns = append(summary.TopCampaigns, models.AnalyticsCampaignItem{
			Source:   cr.Source,
			Medium:   cr.Medium,
			Campaign: cr.Campaign,
			Count:    cr.Count,
		})
	}

	c.JSON(http.StatusOK, summary)
}

// ListVisits returns paginated and filterable visit records
func (h *AnalyticsHandler) ListVisits(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "25"))
	if limit < 1 || limit > 100 {
		limit = 25
	}
	offset := (page - 1) * limit

	search := strings.TrimSpace(c.Query("search"))
	device := strings.TrimSpace(c.Query("device"))
	period := strings.TrimSpace(c.Query("period"))
	includeAdmin := c.DefaultQuery("include_admin", "true") == "true"

	query := h.db.Model(&models.Visit{})

	if !includeAdmin {
		query = query.Where("is_admin = ?", false)
	}

	if device != "" && device != "all" {
		query = query.Where("device_type = ?", device)
	}

	if period != "" && period != "all" {
		now := time.Now()
		var startTime time.Time
		switch period {
		case "today":
			startTime = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		case "7d":
			startTime = now.AddDate(0, 0, -7)
		case "30d":
			startTime = now.AddDate(0, 0, -30)
		}
		if !startTime.IsZero() {
			query = query.Where("created_at >= ?", startTime)
		}
	}

	if search != "" {
		likeTerm := "%" + search + "%"
		query = query.Where(
			"ip LIKE ? OR path LIKE ? OR city LIKE ? OR country_name LIKE ? OR browser LIKE ? OR os LIKE ? OR referrer LIKE ? OR referrer_domain LIKE ?",
			likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm,
		)
	}

	var total int64
	query.Count(&total)

	var items []models.Visit
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al consultar visitas: " + err.Error()})
		return
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))

	c.JSON(http.StatusOK, models.VisitsListResponse{
		Items:      items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	})
}

// GetVisit retrieves single visit details
func (h *AnalyticsHandler) GetVisit(c *gin.Context) {
	id := c.Param("id")
	var visit models.Visit
	if err := h.db.First(&visit, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Registro de visita no encontrado"})
		return
	}
	c.JSON(http.StatusOK, visit)
}

// ToggleTracking enables or disables visitor tracking
func (h *AnalyticsHandler) ToggleTracking(c *gin.Context) {
	var req models.ToggleAnalyticsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Datos inválidos: " + err.Error()})
		return
	}

	var settings models.StoreSettings
	if err := h.db.First(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error consultando configuración"})
		return
	}

	updates := map[string]interface{}{}
	if req.Enabled != nil {
		settings.AnalyticsEnabled = *req.Enabled
		updates["analytics_enabled"] = *req.Enabled
	}
	if req.IgnoreAdminVisits != nil {
		settings.IgnoreAdminVisits = *req.IgnoreAdminVisits
		updates["ignore_admin_visits"] = *req.IgnoreAdminVisits
	}

	if len(updates) > 0 {
		if err := h.db.Model(&models.StoreSettings{}).Where("id = ?", settings.ID).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al guardar estado de analítica: " + err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":              "success",
		"analytics_enabled":   settings.AnalyticsEnabled,
		"ignore_admin_visits": settings.IgnoreAdminVisits,
	})
}

// PurgeVisits deletes visit records according to retention criteria
func (h *AnalyticsHandler) PurgeVisits(c *gin.Context) {
	var req models.PurgeVisitsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Indique el período de limpieza ('all', 'older_than_30d', 'older_than_90d')"})
		return
	}

	now := time.Now()
	query := h.db.Model(&models.Visit{})

	switch req.Period {
	case "all":
		// delete all
	case "older_than_30d":
		limitDate := now.AddDate(0, 0, -30)
		query = query.Where("created_at < ?", limitDate)
	case "older_than_90d":
		limitDate := now.AddDate(0, 0, -90)
		query = query.Where("created_at < ?", limitDate)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Período no reconocido"})
		return
	}

	res := query.Delete(&models.Visit{})
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error al limpiar registros: " + res.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":        "success",
		"deleted_count": res.RowsAffected,
	})
}

// ExportCSV exports visit data as a downloadable CSV with UTF-8 BOM
func (h *AnalyticsHandler) ExportCSV(c *gin.Context) {
	period := c.DefaultQuery("period", "all")
	device := c.Query("device")
	search := strings.TrimSpace(c.Query("search"))

	query := h.db.Model(&models.Visit{})

	if period != "all" {
		now := time.Now()
		var startTime time.Time
		switch period {
		case "today":
			startTime = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		case "7d":
			startTime = now.AddDate(0, 0, -7)
		case "30d":
			startTime = now.AddDate(0, 0, -30)
		}
		if !startTime.IsZero() {
			query = query.Where("created_at >= ?", startTime)
		}
	}

	if device != "" && device != "all" {
		query = query.Where("device_type = ?", device)
	}

	if search != "" {
		likeTerm := "%" + search + "%"
		query = query.Where(
			"ip LIKE ? OR path LIKE ? OR city LIKE ? OR country_name LIKE ? OR browser LIKE ? OR os LIKE ? OR referrer LIKE ?",
			likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm,
		)
	}

	var visits []models.Visit
	if err := query.Order("created_at DESC").Limit(5000).Find(&visits).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Error exportando visitas: " + err.Error()})
		return
	}

	buf := &bytes.Buffer{}
	// UTF-8 BOM for Microsoft Excel compatibility
	buf.WriteString("\xEF\xBB\xBF")

	writer := csv.NewWriter(buf)

	// Headers
	headers := []string{
		"ID Visita",
		"Fecha y Hora",
		"IP",
		"País",
		"Ciudad",
		"Región",
		"Proveedor (ISP)",
		"Ruta Visitada",
		"Título de Página",
		"Referente (Origen)",
		"Dominio Origen",
		"Campaña UTM",
		"Tipo Dispositivo",
		"Sistema Operativo",
		"Versión SO",
		"Navegador",
		"Versión Navegador",
		"Resolución Pantalla",
		"Tamaño Ventana",
		"Idioma Cliente",
		"Zona Horaria",
		"Tipo Red",
		"Núcleos CPU",
		"Memoria RAM (GB)",
		"Duración (seg)",
		"Es Admin",
	}
	_ = writer.Write(headers)

	for _, v := range visits {
		utm := ""
		if v.UTMCampaign != "" || v.UTMSource != "" {
			utm = fmt.Sprintf("Source:%s | Medium:%s | Campaign:%s", v.UTMSource, v.UTMMedium, v.UTMCampaign)
		}

		adminStr := "No"
		if v.IsAdmin {
			adminStr = "Sí"
		}

		row := []string{
			v.ID,
			v.CreatedAt.Format("2006-01-02 15:04:05"),
			v.IP,
			v.CountryName,
			v.City,
			v.Region,
			v.ISP,
			v.Path,
			v.PageTitle,
			v.Referrer,
			v.ReferrerDomain,
			utm,
			v.DeviceType,
			v.OS,
			v.OSVersion,
			v.Browser,
			v.BrowserVersion,
			v.ScreenResolution,
			v.ViewportSize,
			v.Language,
			v.Timezone,
			v.NetworkType,
			strconv.Itoa(v.HardwareConcurrency),
			fmt.Sprintf("%.1f", v.DeviceMemory),
			strconv.Itoa(v.DurationSeconds),
			adminStr,
		}
		_ = writer.Write(row)
	}

	writer.Flush()

	filename := fmt.Sprintf("reporte_visitas_%s.csv", time.Now().Format("20060102_150405"))
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Data(http.StatusOK, "text/csv; charset=utf-8", buf.Bytes())
}
