# 🗺️ Roadmap de Futuras Mejoras - Tienda Artisan

Este documento registra las iniciativas y características planificadas para futuras versiones de la plataforma.

---

## 📌 Iniciativas Planificadas

### 1. 🏷️ Sistema de Cupones de Descuento y Promociones
- **Descripción**: Permitir al comerciante crear y gestionar códigos promocionales desde el panel de administración.
- **Capacidades**:
  - Cupones de descuento porcentual (ej: `10% OFF`, `20% OFF`).
  - Cupones de monto fijo en pesos chilenos (ej: `$5.000 CLP de descuento`).
  - Restricciones opcionales: monto mínimo de compra, límite de usos totales o fecha de expiración.
  - Aplicación y validación en tiempo real en el Carrito y Checkout.

---

### 2. 📤 Botón de "Compartir Producto" en Redes Sociales
- **Descripción**: Herramienta de difusión viral para clientes y comerciantes directamente desde la ficha del producto.
- **Capacidades**:
  - Botón de **Copiar Enlace Directo** con retroalimentación visual (*"¡Enlace copiado!"*).
  - Botón de **Compartir en WhatsApp**: Abre chat con texto predefinido y enlace al producto.
  - Botón de **Compartir en Instagram Stories / Facebook / X**: Facilita la promoción en redes sociales.
  - Generación de metaetiquetas OpenGraph (OG Title, OG Image, OG Description) para vistas previas atractivas al pegar enlaces.

---

### 3. 🌐 Configuración de Dominio Propio con HTTPS (SSL Candado Verde)
- **Descripción**: Asignación de un dominio personalizado (ej: `mitienda.cl`, `comerciolocal.com`) con certificado SSL gratuito y renovable.
- **Capacidades**:
  - Script automatizado `ssl-certbot.sh` para emisión de certificados Let's Encrypt.
  - Configuración automática de renovación periódica vía cron.
  - Redirección automática de HTTP a HTTPS con cabeceras de seguridad HSTS.
  - Soporte para Caddy Server y Nginx con proxy inverso nativo.

---

## 🚀 Estado Actual del Motor (v1.0.0+)
- ✅ **Catálogo Digital Ultra Rápido** con buscador y categorías.
- ✅ **Ficha de Producto Multi-Foto** con Lightbox Fullscreen y zoom.
- ✅ **Control Estricto de Stock e Inventario** con topes en carrito y alertas de agotado.
- ✅ **Motor Modular de Pasarelas de Pago** (WhatsApp/Transferencia, Mercado Pago, Flow).
- ✅ **Inteligencia y Analítica de Visitas en Vivo** con ranking de productos más populares.
- ✅ **Notificaciones Instantáneas vía Telegram Bot** para pedidos nuevos.
- ✅ **Generador de Comprobantes de Pedido / Recibos en PDF**.
