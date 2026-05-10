# Configuración de Mercado Pago 💳

La tienda ya está integrada con Mercado Pago para procesar pagos de forma segura. Actualmente está configurada con un **Token de Prueba (Sandbox)**.

## Cómo cambiar al Token de Producción

Cuando estés listo para recibir dinero real, sigue estos pasos:

1.  **Obtén tus credenciales:**
    *   Ingresa al [Panel de Desarrolladores de Mercado Pago](https://www.mercadopago.cl/developers/panel/credentials).
    *   Selecciona tu aplicación (o crea una nueva).
    *   Busca la sección **"Credenciales de Producción"** y copia el **"Access Token"**.

2.  **Configura el Servidor:**
    *   Abre el archivo `backend/app/api/v1/payments.py`.
    *   Busca la línea:
        ```python
        MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN", "TEST-...")
        ```
    *   **Recomendado:** No pegues el token directamente en el código. Crea un archivo `.env` en la carpeta `backend/` y añade:
        ```env
        MP_ACCESS_TOKEN=tu_access_token_de_produccion_aqui
        ```

3.  **Configura el Webhook (Notificaciones):**
    *   Para que el pedido pase a "Pagado" automáticamente, Mercado Pago necesita avisarle a tu servidor.
    *   En el panel de MP, ve a **Webhooks**.
    *   Configura la URL de notificación como: `https://tu-dominio.com/api/v1/payments/webhook`.
    *   Asegúrate de marcar los eventos de "Pagos" (payments).

## Flujo del Usuario
1. El usuario llena sus datos en el checkout.
2. Al hacer clic en "Confirmar", se crea el pedido y se redirige a Mercado Pago.
3. El pago se realiza en la plataforma segura de MP.
4. MP devuelve al usuario a la página de "Éxito" de tu tienda.
5. El servidor de MP envía una notificación al tuyo y el pedido se marca como `paid`.
