
from app.core.database import SessionLocal
from app.models.product import Product
from decimal import Decimal

def update_products():
    db = SessionLocal()
    products = db.query(Product).all()
    
    coffee_data = [
        {
            "name": "Etiopía Yirgacheffe",
            "slug": "etiopia-yirgacheffe",
            "description": "Notas florales y cítricas, con un cuerpo ligero y elegante. Tostado suave artisan.",
            "price": Decimal("18.500")
        },
        {
            "name": "Colombia Huila Reserva",
            "slug": "colombia-huila",
            "description": "Perfil clásico balanceado con notas a chocolate y caramelo. Cosecha seleccionada.",
            "price": Decimal("15.900")
        },
        {
            "name": "Brasil Bourbon Amarillo",
            "slug": "brasil-bourbon",
            "description": "Cuerpo denso, baja acidez y dulzor prolongado perfectos para espresso.",
            "price": Decimal("14.500")
        }
    ]
    
    for i, p in enumerate(products):
        if i < len(coffee_data):
            p.name = coffee_data[i]["name"]
            p.slug = coffee_data[i]["slug"]
            p.description = coffee_data[i]["description"]
            p.base_price = coffee_data[i]["price"]
            
    db.commit()
    db.close()
    print("Products updated to coffee themes!")

if __name__ == "__main__":
    update_products()
