# Manual de Operación - TIENDA

Este manual detalla los pasos para iniciar ("subir") y detener ("bajar") la aplicación completa.

## 🛠️ Método 1: Ejecución Manual (Recomendado si Docker no está disponible)

Este es el método que estamos utilizando actualmente. Cada componente se corre por separado.

### 1. Backend (FastAPI)
- **Carpeta:** `backend/`
- **Comando:**
  ```powershell
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  ```
- **Nota:** Por defecto usa SQLite (`ecommerce.db`). No requiere configurar una base de datos externa.

### 2. Frontend (Next.js)
- **Carpeta:** `frontend/`
- **Comando:**
  ```powershell
  npm run dev
  ```
- **Nota:** Asegúrate de que el backend esté corriendo primero para que el frontend pueda cargar los datos.

### 3. Detener servicios
- Presiona `Ctrl + C` en cada una de las terminales abiertas.

---

## 🚀 Método 2: Docker / Docker Compose

Usa este método si tienes Docker Desktop o Podman instalado y quieres una experiencia idéntica a producción.

### 1. Subir la aplicación
```powershell
docker compose up -d
```
*Si `docker compose` falla, intenta con `docker-compose` (con guion).*

### 2. Bajar la aplicación
```powershell
docker compose down
```

### 3. Solución de problemas (Docker)
Si recibes el error: *"El término 'docker' no se reconoce..."*:
- Verifica que Docker Desktop esté abierto y funcionando.
- Asegúrate de que Docker esté en el PATH de tu sistema Windows.
- Si usas Podman, reemplaza `docker` por `podman` en los comandos.

---

## 🔗 Enlaces de Acceso
- **Tienda (Local):** [http://localhost:3000](http://localhost:3000)
- **Documentación API:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend URL:** [http://localhost:8000/api](http://localhost:8000/api)
