# 🕊️ Tienda Artisan - Motor E-commerce Nativo de Alto Rendimiento (Go + Next.js)

**Tienda Artisan** es una plataforma e-commerce genérica, minimalista y ultra-rápida orientada a emprendedores. Diseñada para operar de forma **100% nativa (sin Docker)** en instancias en la nube con recursos limitados como **Oracle Cloud Infrastructure (OCI) Always Free E2.1.Micro (1 vCPU, 1 GB RAM)**.

---

## 🏷️ Versión Estable
> **Release:** `v1.0.0-sin-pago-electronico`  
> **Modo:** Tienda Catálogo Digital con Pedidos por WhatsApp y Transferencia Bancaria (Sin pasarela de pago electrónico).

---

## ✨ Características Principales
- 🐹 **Backend Nativo en Go (Golang):** Consumo ultrabajo de memoria (~15-20 MB RAM), alta concurrencia y tiempos de respuesta de microsegundos.
- 🎨 **Panel Administrativo Total (Wizard):** Personaliza nombre, logo, colores, favicon, textos, título, subtítulo, altura del Hero banner (mitad de pantalla, compacto, pantalla completa u ocultar) y WhatsApp de contacto.
- 📸 **Galería Multi-Foto & Lightbox Fullscreen:** Múltiples imágenes por producto, selector de foto de portada principal y visor Lightbox con zoom y navegación por teclado.
- 📦 **Control Estricto de Stock e Inventario:** Topes de cantidad en fichas y carrito según existencias disponibles, badges dinámicos (`¡Últimas X!`, `Agotado`) y consultas de reposición automáticas.
- 📊 **Motor de Visitas y Analítica en Vivo:** Métricas detalladas de visitas, visitantes únicos, gráficos de tendencias, desglose por dispositivos, navegadores, países y ciudades, exportación CSV y purga configurable.
- 🏆 **Rendimiento de Catálogo y Ranking de Productos:** Monitoreo en tiempo real de qué productos se visualizan más, visitantes únicos por producto y producto estrella del catálogo.
- 💬 **Checkout Optimizado por WhatsApp & Transferencia:** Envío de pedidos estructurados a WhatsApp con detalles de entrega (domicilio o retiro) y datos bancarios para transferencia (CuentaRUT / Cta Corriente).
- ⚡ **Despliegue Nativo en 1 Comando para OCI:** Scripts `install.sh` y `update.sh` optimizados para Ubuntu Always Free (1 vCPU, 1 GB RAM).

---

## 🚀 Despliegue Nativo en Oracle Cloud (Ubuntu Minimal)

### Instalación en 1 Comando

Conéctate a tu instancia de OCI por SSH y ejecuta:

```bash
# 1. Clonar el repositorio
git clone <URL_DE_TU_REPOSITORIO_GITHUB> tienda
cd tienda

# 2. Ejecutar el instalador nativo
sudo bash install.sh
```

El instalador nativo se encargará de:
1. Crear 2 GB de memoria SWAP para garantizar estabilidad total durante builds.
2. Instalar Go 1.22+, Node.js 20 LTS y el servidor web nativo Caddy.
3. Abrir los puertos necesarios en iptables y UFW (80, 443, 3000, 8000).
4. Compilar el backend Go como binario nativo estático optimizado.
5. Generar el build de producción Standalone de Next.js.
6. Configurar y activar los servicios nativos `systemd` (`tienda-backend.service`, `tienda-frontend.service`, `caddy.service`).

---

## 🔄 Actualizaciones desde GitHub en 1 Comando

Para desplegar nuevas versiones o cambios subidos a tu repositorio:

```bash
sudo bash update.sh
```

Este script hace `git pull`, recompila los binarios nativos y recarga los servicios con tiempo de inactividad prácticamente nulo.

---

## 🔐 Accesos Rápidos
- **Tienda Pública:** `http://<IP_DE_TU_SERVIDOR>/`
- **Panel de Administración:** `http://<IP_DE_TU_SERVIDOR>/admin`
- **Contraseña Master por Defecto:** `admin123`
- **API Health Check:** `http://<IP_DE_TU_SERVIDOR>/api/health`

---

## 🛠️ Gestión de Servicios en el Servidor (Ubuntu)

```bash
# Ver estado de los servicios
sudo systemctl status tienda-backend tienda-frontend caddy

# Ver logs en tiempo real
sudo journalctl -u tienda-backend -f
sudo journalctl -u tienda-frontend -f
sudo journalctl -u caddy -f

# Reiniciar servicios
sudo systemctl restart tienda-backend
sudo systemctl restart tienda-frontend
sudo systemctl restart caddy
```

---

## 📚 Documentación Adicional
- [Documentación Técnica y Arquitectura](./DOCUMENTACION.md)
- [Manual de Operación](./MANUAL_OPERACION.md)
- [Guía de Integración con Mercado Pago](./MERCADO_PAGO.md)
