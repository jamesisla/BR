# 🕊️ Tienda Artisan - Motor E-commerce Nativo de Alto Rendimiento (Go + Next.js)

**Tienda Artisan** es una plataforma e-commerce genérica, minimalista y ultra-rápida orientada a emprendedores. Diseñada para operar de forma **100% nativa (sin Docker)** en instancias en la nube con recursos limitados como **Oracle Cloud Infrastructure (OCI) Always Free E2.1.Micro (1 vCPU, 1 GB RAM)**.

---

## ✨ Características Principales
- 🐹 **Backend Nativo en Go (Golang):** Consumo ultrabajo de memoria (~15-20 MB RAM), alta concurrencia y tiempos de respuesta de microsegundos.
- 🎨 **Panel Administrativo Total (Wizard):** Personaliza el nombre de la tienda, logo, colores de marca, textos del pie de página, título, subtítulo e imagen de portada (Hero) sin tocar código.
- 📦 **Gestión de Catálogo e Inventario:** Control de stock con descuento atómico en cada compra, estados de pedidos (`pending`, `paid`, `shipped`, `cancelled`) y categorías personalizables.
- 💳 **Pagos con Mercado Pago:** Integración lista para producción con Checkout Pro y Webhook para actualización automática de pedidos a "Pagado".
- ⚡ **Instalador Nativo en 1 Comando para OCI:** Script `install.sh` que configura automáticamente Swap, dependencias (Go, Node 20, Caddy), firewall y servicios `systemd`.
- 🔄 **Actualizador Nativo en 1 Comando:** Script `update.sh` que descarga los cambios desde GitHub y recompila en caliente.

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
