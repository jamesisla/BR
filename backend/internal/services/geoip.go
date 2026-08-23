package services

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"
)

type GeoInfo struct {
	CountryCode string `json:"countryCode"`
	CountryName string `json:"country"`
	City        string `json:"city"`
	Region      string `json:"regionName"`
	ISP         string `json:"isp"`
}

type GeoService struct {
	cache sync.Map // map[string]GeoInfo
	client *http.Client
}

var (
	geoInstance *GeoService
	geoOnce     sync.Once
)

func GetGeoService() *GeoService {
	geoOnce.Do(func() {
		geoInstance = &GeoService{
			client: &http.Client{
				Timeout: 2500 * time.Millisecond,
			},
		}
	})
	return geoInstance
}

// GetClientIP extracts real client IP with support for proxies, CDNs and Cloudflare
func (g *GeoService) GetClientIP(r *http.Request) string {
	// 1. Cloudflare header
	if cfIP := r.Header.Get("CF-Connecting-IP"); cfIP != "" {
		return strings.TrimSpace(cfIP)
	}

	// 2. True-Client-IP (Akamai, Cloudflare Enterprise)
	if tcIP := r.Header.Get("True-Client-IP"); tcIP != "" {
		return strings.TrimSpace(tcIP)
	}

	// 3. X-Real-IP
	if realIP := r.Header.Get("X-Real-IP"); realIP != "" {
		return strings.TrimSpace(realIP)
	}

	// 4. X-Forwarded-For (first non-internal IP)
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		for _, ipStr := range ips {
			ipStr = strings.TrimSpace(ipStr)
			ip := net.ParseIP(ipStr)
			if ip != nil && !g.isPrivateIP(ip) {
				return ipStr
			}
		}
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	// 5. RemoteAddr
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}
	return r.RemoteAddr
}

func (g *GeoService) isPrivateIP(ip net.IP) bool {
	if ip == nil {
		return true
	}
	if ip.IsLoopback() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() || ip.IsUnspecified() {
		return true
	}
	// Private IPv4 ranges
	ip4 := ip.To4()
	if ip4 != nil {
		return ip4[0] == 10 ||
			(ip4[0] == 172 && ip4[1] >= 16 && ip4[1] <= 31) ||
			(ip4[0] == 192 && ip4[1] == 168) ||
			(ip4[0] == 127)
	}
	// Private IPv6 (ULA fc00::/7)
	return len(ip) == 16 && (ip[0]&0xfe == 0xfc)
}

// ResolveLocation determines geo location from headers or IP lookup
func (g *GeoService) ResolveLocation(r *http.Request, ipStr string) GeoInfo {
	// 1. Direct Cloudflare Headers if available
	cfCountry := r.Header.Get("CF-IPCountry")
	cfCity := r.Header.Get("CF-IPCity")
	cfRegion := r.Header.Get("CF-Region")

	if cfCountry != "" && cfCountry != "XX" && cfCountry != "T1" {
		countryName := g.getCountryName(cfCountry)
		city := cfCity
		if city == "" {
			city = "Ubicación detectada"
		}
		return GeoInfo{
			CountryCode: strings.ToUpper(cfCountry),
			CountryName: countryName,
			City:        city,
			Region:      cfRegion,
			ISP:         "Cloudflare CDN",
		}
	}

	// 2. Check private / loopback IP
	ip := net.ParseIP(ipStr)
	if ip == nil || g.isPrivateIP(ip) {
		return GeoInfo{
			CountryCode: "CL",
			CountryName: "Chile (Red Local)",
			City:        "Servidor / Localhost",
			Region:      "Desarrollo",
			ISP:         "Red Local",
		}
	}

	// 3. Check in-memory cache
	if cached, ok := g.cache.Load(ipStr); ok {
		return cached.(GeoInfo)
	}

	// 4. Fallback lookup (ip-api.com)
	info := GeoInfo{
		CountryCode: "CL",
		CountryName: "Chile",
		City:        "Santiago",
		Region:      "Región Metropolitana",
		ISP:         "Internet Provider",
	}

	endpoint := fmt.Sprintf("http://ip-api.com/json/%s?fields=status,country,countryCode,regionName,city,isp", url.QueryEscape(ipStr))
	resp, err := g.client.Get(endpoint)
	if err == nil && resp != nil {
		defer resp.Body.Close()
		if resp.StatusCode == http.StatusOK {
			var result struct {
				Status      string `json:"status"`
				Country     string `json:"country"`
				CountryCode string `json:"countryCode"`
				RegionName  string `json:"regionName"`
				City        string `json:"city"`
				ISP         string `json:"isp"`
			}
			if jsonErr := json.NewDecoder(resp.Body).Decode(&result); jsonErr == nil && result.Status == "success" {
				info.CountryCode = result.CountryCode
				info.CountryName = result.Country
				info.City = result.City
				info.Region = result.RegionName
				info.ISP = result.ISP
			}
		}
	}

	g.cache.Store(ipStr, info)
	return info
}

// UserAgentDetails contains parsed browser/OS details
type UserAgentDetails struct {
	Browser        string
	BrowserVersion string
	OS             string
	OSVersion      string
	DeviceType     string // desktop, mobile, tablet, bot
	IsBot          bool
}

// ParseUserAgent extracts structured device/browser/OS info
func ParseUserAgent(ua string) UserAgentDetails {
	res := UserAgentDetails{
		Browser:    "Otro Navegador",
		OS:         "Otro SO",
		DeviceType: "desktop",
		IsBot:      false,
	}

	if ua == "" {
		return res
	}

	uaLower := strings.ToLower(ua)

	// 1. Detect Bots / Crawlers
	botKeywords := []string{"googlebot", "bingbot", "yandexbot", "duckduckbot", "baiduspider", "facebookexternalhit", "twitterbot", "whatsapp", "telegrambot", "slackbot", "semrushbot", "ahrefsbot", "dotbot", "mj12bot", "petalbot", "bytespider", "bot", "crawler", "spider"}
	for _, kw := range botKeywords {
		if strings.Contains(uaLower, kw) {
			res.IsBot = true
			res.DeviceType = "bot"
			res.Browser = "Bot / Indexador (" + strings.ToUpper(kw[:1]) + kw[1:] + ")"
			res.OS = "Servidor Web"
			return res
		}
	}

	// 2. Detect Device Type
	if strings.Contains(uaLower, "ipad") || strings.Contains(uaLower, "tablet") || strings.Contains(uaLower, "playbook") || strings.Contains(uaLower, "silk") || strings.Contains(uaLower, "kindle") || (strings.Contains(uaLower, "android") && !strings.Contains(uaLower, "mobile")) {
		res.DeviceType = "tablet"
	} else if strings.Contains(uaLower, "mobile") || strings.Contains(uaLower, "iphone") || strings.Contains(uaLower, "ipod") || strings.Contains(uaLower, "android") || strings.Contains(uaLower, "blackberry") || strings.Contains(uaLower, "iemobile") || strings.Contains(uaLower, "opera mini") {
		res.DeviceType = "mobile"
	} else {
		res.DeviceType = "desktop"
	}

	// 3. Detect Operating System
	if strings.Contains(ua, "iPhone") || strings.Contains(ua, "iPad") || strings.Contains(ua, "iPod") {
		res.OS = "iOS"
		re := regexp.MustCompile(`OS (\d+[_\d]*)`)
		if matches := re.FindStringSubmatch(ua); len(matches) > 1 {
			res.OSVersion = strings.ReplaceAll(matches[1], "_", ".")
		}
	} else if strings.Contains(ua, "Android") {
		res.OS = "Android"
		re := regexp.MustCompile(`Android (\d+[\.\d]*)`)
		if matches := re.FindStringSubmatch(ua); len(matches) > 1 {
			res.OSVersion = matches[1]
		}
	} else if strings.Contains(ua, "Windows NT 10.0") || strings.Contains(ua, "Windows NT 11.0") {
		res.OS = "Windows"
		res.OSVersion = "10/11"
	} else if strings.Contains(ua, "Windows NT 6.3") {
		res.OS = "Windows"
		res.OSVersion = "8.1"
	} else if strings.Contains(ua, "Windows NT 6.1") {
		res.OS = "Windows"
		res.OSVersion = "7"
	} else if strings.Contains(ua, "Windows") {
		res.OS = "Windows"
	} else if strings.Contains(ua, "Macintosh") || strings.Contains(ua, "Mac OS X") {
		res.OS = "macOS"
		re := regexp.MustCompile(`Mac OS X (\d+[_\d]*)`)
		if matches := re.FindStringSubmatch(ua); len(matches) > 1 {
			res.OSVersion = strings.ReplaceAll(matches[1], "_", ".")
		}
	} else if strings.Contains(ua, "CrOS") {
		res.OS = "Chrome OS"
	} else if strings.Contains(ua, "Linux") || strings.Contains(ua, "X11") {
		res.OS = "Linux"
	}

	// 4. Detect Browser
	if strings.Contains(ua, "Instagram") {
		res.Browser = "Instagram App"
	} else if strings.Contains(ua, "FBAN") || strings.Contains(ua, "FBAV") {
		res.Browser = "Facebook App"
	} else if strings.Contains(ua, "WhatsApp") {
		res.Browser = "WhatsApp"
	} else if strings.Contains(ua, "TikTok") || strings.Contains(ua, "musical_ly") {
		res.Browser = "TikTok App"
	} else if strings.Contains(ua, "SamsungBrowser/") {
		res.Browser = "Samsung Internet"
		re := regexp.MustCompile(`SamsungBrowser/(\d+[\.\d]*)`)
		if matches := re.FindStringSubmatch(ua); len(matches) > 1 {
			res.BrowserVersion = matches[1]
		}
	} else if strings.Contains(ua, "Edg/") || strings.Contains(ua, "Edge/") {
		res.Browser = "Microsoft Edge"
		re := regexp.MustCompile(`Edg[e]?/(\d+[\.\d]*)`)
		if matches := re.FindStringSubmatch(ua); len(matches) > 1 {
			res.BrowserVersion = matches[1]
		}
	} else if strings.Contains(ua, "OPR/") || strings.Contains(ua, "Opera") {
		res.Browser = "Opera"
		re := regexp.MustCompile(`OPR/(\d+[\.\d]*)`)
		if matches := re.FindStringSubmatch(ua); len(matches) > 1 {
			res.BrowserVersion = matches[1]
		}
	} else if strings.Contains(ua, "Firefox/") || strings.Contains(ua, "FxiOS/") {
		res.Browser = "Mozilla Firefox"
		re := regexp.MustCompile(`(Firefox|FxiOS)/(\d+[\.\d]*)`)
		if matches := re.FindStringSubmatch(ua); len(matches) > 2 {
			res.BrowserVersion = matches[2]
		}
	} else if strings.Contains(ua, "Chrome/") || strings.Contains(ua, "CriOS/") {
		res.Browser = "Google Chrome"
		re := regexp.MustCompile(`(Chrome|CriOS)/(\d+[\.\d]*)`)
		if matches := re.FindStringSubmatch(ua); len(matches) > 2 {
			res.BrowserVersion = matches[2]
		}
	} else if strings.Contains(ua, "Safari/") && strings.Contains(ua, "Version/") {
		res.Browser = "Apple Safari"
		re := regexp.MustCompile(`Version/(\d+[\.\d]*)`)
		if matches := re.FindStringSubmatch(ua); len(matches) > 1 {
			res.BrowserVersion = matches[1]
		}
	} else if strings.Contains(ua, "Safari/") {
		res.Browser = "Apple Safari"
	}

	return res
}

func (g *GeoService) getCountryName(code string) string {
	countries := map[string]string{
		"CL": "Chile",
		"AR": "Argentina",
		"PE": "Perú",
		"CO": "Colombia",
		"MX": "México",
		"BR": "Brasil",
		"UY": "Uruguay",
		"PY": "Paraguay",
		"BO": "Bolivia",
		"EC": "Ecuador",
		"VE": "Venezuela",
		"US": "Estados Unidos",
		"ES": "España",
		"CA": "Canadá",
		"DE": "Alemania",
		"FR": "Francia",
		"GB": "Reino Unido",
		"IT": "Italia",
		"CN": "China",
		"JP": "Japón",
	}
	if name, ok := countries[strings.ToUpper(code)]; ok {
		return name
	}
	return code
}
