# 🕊️ Tienda Artisan - Documentación Completa

Esta plataforma es un motor e-commerce genérico, minimalista y potente, diseñado para transformarse según las necesidades de cualquier marca a través de una interfaz administrativa intuitiva.

---

## 🚀 1. Despliegue Rápido (Docker)

El proyecto está 100% containerizado para correr en cualquier entorno (Local, VPS, Cloud).

```bash
# Clonar y entrar al directorio
cd TIENDA

# Levantar toda la infraestructura
docker-compose up -d --build
```
*   **Tienda:** `http://localhost:3000`
*   **Admin:** `http://localhost:3000/admin`
*   **API:** `http://localhost:8000`

---

## 🎨 2. Gestión de Identidad (El "Wizard")

La tienda es agnóstica al rubro. Puedes configurarla totalmente desde el **Panel Administrativo > Configuración**:

*   **Identidad Visual:** Sube el logo y define colores primarios/secundarios que se aplican a toda la interfaz automáticamente.
*   **Página de Inicio Dinámica:** Configura el título, subtítulo e imagen de portada (Hero Image) sin tocar una línea de código.
*   **Pie de Página:** Personaliza el mensaje de copyright y créditos.

---

## 📦 3. Motor de Inventario y Pedidos

El sistema gestiona el flujo completo de venta:
1.  **Stock Inteligente:** Al realizar una compra, el backend valida la disponibilidad y **descuenta automáticamente** las unidades del inventario.
2.  **Estado de Pedidos:** Los pedidos se registran con estados (`pending`, `paid`, `shipped`) que puedes gestionar desde el dashboard.
3.  **Eliminado Físico/Lógico:** Los productos pueden desactivarse (ocultarse) o eliminarse permanentemente de la base de datos.

---

## 💳 4. Pagos en Línea (Mercado Pago)

La tienda incluye una integración nativa con Mercado Pago:
*   **Checkout Pro:** Redirección automática a la pasarela segura tras confirmar el pedido.
*   **Webhooks:** Un sistema que escucha las notificaciones de Mercado Pago y marca los pedidos como "Pagados" en tiempo real sin intervención humana.
*   **Configuración:** Consulta el archivo `MERCADO_PAGO.md` para ver cómo activar tus llaves de producción.

---

## 🔍 5. Experiencia del Cliente (UX)

*   **Buscador Avanzado:** Filtros por categoría, sugerencias interactivas y búsqueda por texto.
*   **Carrito de Compras:** Animado con Framer Motion, persistente en el navegador del cliente.
*   **Compra como Invitado:** Permite finalizar pedidos sin necesidad de registro obligatorio, reduciendo el abandono de carrito.

---

## 🛠️ 6. Stack Tecnológico

*   **Backend:** FastAPI (Python 3.11), SQLAlchemy, PostgreSQL/SQLite.
*   **Frontend:** Next.js 14, TailwindCSS, Framer Motion, Lucide React.
*   **Infraestructura:** Docker & Docker Compose.

---

## 🔑 7. Variables de Entorno Clave

| Variable | Descripción | Valor Ejemplo |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | URL donde el frontend busca la API | `https://api.tusitio.com/api` |
| `BACKEND_URL` | URL base del servidor (imágenes) | `https://api.tusitio.com` |
| `MP_ACCESS_TOKEN` | Token de Mercado Pago | `APP_USR-1234...` |

---
*Documentación generada el 10 de Mayo de 2026.*
