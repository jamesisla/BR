package payments

import (
	"sync"
	"tienda-backend/internal/models"
)

type Registry struct {
	mu        sync.RWMutex
	providers map[string]PaymentProvider
}

var (
	defaultRegistry *Registry
	once            sync.Once
)

// GetRegistry returns the global singleton PaymentRegistry
func GetRegistry() *Registry {
	once.Do(func() {
		defaultRegistry = &Registry{
			providers: make(map[string]PaymentProvider),
		}
		// Register built-in payment modules
		defaultRegistry.Register(NewWhatsAppManualProvider())
		defaultRegistry.Register(NewMercadoPagoProvider())
		defaultRegistry.Register(NewFlowProvider())
	})
	return defaultRegistry
}

// Register adds or replaces a payment provider
func (r *Registry) Register(p PaymentProvider) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.providers[p.ID()] = p
}

// Get returns a specific provider by its ID
func (r *Registry) Get(id string) (PaymentProvider, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, ok := r.providers[id]
	return p, ok
}

// GetAvailableMethods returns a list of all payment methods enabled in settings
func (r *Registry) GetAvailableMethods(settings *models.StoreSettings) []PaymentMethodInfo {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []PaymentMethodInfo
	// Prioritize order: whatsapp_manual, mercadopago, flow
	orderKeys := []string{"whatsapp_manual", "mercadopago", "flow"}

	for _, k := range orderKeys {
		if p, ok := r.providers[k]; ok && p.IsEnabled(settings) {
			list = append(list, PaymentMethodInfo{
				ID:          p.ID(),
				Name:        p.Name(),
				Description: p.Description(),
				Icon:        p.Icon(),
				Type:        p.Type(),
				Config:      p.GetClientConfig(settings),
			})
		}
	}

	// Any other registered providers
	for k, p := range r.providers {
		found := false
		for _, okKey := range orderKeys {
			if okKey == k {
				found = true
				break
			}
		}
		if !found && p.IsEnabled(settings) {
			list = append(list, PaymentMethodInfo{
				ID:          p.ID(),
				Name:        p.Name(),
				Description: p.Description(),
				Icon:        p.Icon(),
				Type:        p.Type(),
				Config:      p.GetClientConfig(settings),
			})
		}
	}

	return list
}
