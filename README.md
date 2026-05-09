# Tienda Artisan 🕊️

Plataforma e-commerce minimalista y funcional diseñada para marcas que valoran la estética y la simplicidad.

## 🚀 Despliegue con Docker

Este proyecto está preparado para correr en cualquier entorno (Local, VPS, Nube) mediante contenedores.

### Requisitos
- Docker y Docker Compose

### Pasos para iniciar
1. Clona el repositorio.
2. En la raíz del proyecto, ejecuta:
   ```bash
   docker-compose up -d --build
   ```
3. La tienda estará disponible en `http://localhost:3000` y el backend en `http://localhost:8000`.

### Variables de Entorno (Opcional para Nube)
Si despliegas en un servidor remoto, puedes configurar:
- `NEXT_PUBLIC_API_URL`: URL pública de la API (ej: `https://api.tutienda.com/api`)
- `BACKEND_URL`: URL pública del backend para las imágenes (ej: `https://api.tutienda.com`)
- `DB_PASSWORD`: Contraseña para la base de datos PostgreSQL.

## 🛠️ Estructura del Proyecto
- **/frontend**: Next.js 14 + TailwindCSS + Framer Motion.
- **/backend**: FastAPI + SQLAlchemy + PostgreSQL.
- **/backend/app/static/uploads**: Directorio persistente para imágenes de productos y logos.

## 🔑 Acceso Administrativo
El panel de control está en `/admin`. 
*Nota: La contraseña maestra se configura en el backend.*
