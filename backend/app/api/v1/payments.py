
import os
import mercadopago
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.order import Order
from pydantic import BaseModel

router = APIRouter()

# --- DOCUMENTACIÓN DE CREDENCIALES ---
# Para usar Mercado Pago en producción:
# 1. Ve a https://www.mercadopago.cl/developers/panel/credentials
# 2. Crea una aplicación y obtén tu "Access Token".
# 3. Reemplaza el valor de 'MP_ACCESS_TOKEN' en tu archivo .env
# -------------------------------------

MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN", "TEST-6447849483321584-051015-8d598585474747474747474747474747-000000000") # Token de prueba

class PaymentPreference(BaseModel):
    order_id: str

@router.post("/create-preference")
async def create_preference(pref: PaymentPreference, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == pref.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    sdk = mercadopago.SDK(MP_ACCESS_TOKEN)

    # Construir items para Mercado Pago
    items = []
    for item in order.items:
        items.append({
            "id": str(item.product_id),
            "title": item.product.name,
            "quantity": item.quantity,
            "unit_price": float(item.price_at_purchase)
        })

    # Añadir costo de envío si existe (en este caso fijo $5)
    items.append({
        "title": "Envío",
        "quantity": 1,
        "unit_price": 5.0
    })

    # Datos de la preferencia
    preference_data = {
        "items": items,
        "payer": {
            "email": order.email,
            "name": order.first_name,
            "surname": order.last_name,
        },
        "back_urls": {
            "success": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/checkout/success?orderId={order.id}",
            "failure": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/checkout",
            "pending": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/checkout"
        },
        "auto_return": "approved",
        "external_reference": str(order.id),
        "notification_url": f"{os.getenv('BACKEND_URL', 'http://localhost:8000')}/api/payments/webhook"
    }

    preference_response = sdk.preference().create(preference_data)
    preference = preference_response["response"]

    return {
        "id": preference["id"],
        "init_point": preference["init_point"] # URL para redirigir al usuario
    }

@router.post("/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    # Mercado Pago envía notificaciones por POST
    # Documentación: https://www.mercadopago.cl/developers/es/docs/checkout-pro/additional-content/webhooks
    
    data = await request.json()
    
    if data.get("type") == "payment":
        payment_id = data.get("data", {}).get("id")
        
        sdk = mercadopago.SDK(MP_ACCESS_TOKEN)
        payment_info = sdk.payment().get(payment_id)
        
        if payment_info["status"] == 200:
            payment = payment_info["response"]
            external_reference = payment.get("external_reference")
            status = payment.get("status")
            
            if external_reference and status == "approved":
                order = db.query(Order).filter(Order.id == external_reference).first()
                if order:
                    order.status = "paid"
                    db.commit()
                    print(f"Pedido {external_reference} marcado como PAGADO.")

    return {"status": "ok"}
