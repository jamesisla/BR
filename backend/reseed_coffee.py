
from app.core.database import SessionLocal, engine, Base
from app.models.product import Product
from decimal import Decimal
import uuid

def reseed():
    # Ensure tables are created (though main.py does it, let's be sure)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Clean old data if any
    db.query(Product).delete()
    
    coffee_data = [
        {
            "name": "Etiopía Yirgacheffe",
            "slug": "etiopia-yirgacheffe",
            "description": "Notas florales y cítricas, con un cuerpo ligero y elegante. Tostado suave artisan.",
            "price": Decimal("18500"),
            "category": "cafes",
            "stock": 15,
            "image": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800"
        },
        {
            "name": "Colombia Huila Reserva",
            "slug": "colombia-huila",
            "description": "Perfil clásico balanceado con notas a chocolate y caramelo. Cosecha seleccionada.",
            "price": Decimal("15900"),
            "category": "cafes",
            "stock": 20,
            "image": "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?q=80&w=800"
        },
        {
            "name": "Brasil Bourbon Amarillo",
            "slug": "brasil-bourbon",
            "description": "Cuerpo denso, baja acidez y dulzor prolongado perfectos para espresso.",
            "price": Decimal("14500"),
            "category": "cafes",
            "stock": 10,
            "image": "https://images.unsplash.com/photo-1580915411954-282cb1b0d780?q=80&w=800"
        },
        {
            "name": "Prensa Francesa Oro",
            "slug": "prensa-francesa",
            "description": "Acero inoxidable con acabado en oro cepillado. Capacidad para 3 tazas.",
            "price": Decimal("35000"),
            "category": "accesorios",
            "stock": 5,
            "image": "https://images.unsplash.com/photo-1544193277-2287f39a0497?q=80&w=800"
        }
    ]
    
    for item in coffee_data:
        p = Product(
            name=item["name"],
            slug=item["slug"],
            description=item["description"],
            base_price=item["price"],
            category=item["category"],
            stock=item["stock"],
            image_url=item["image"],
            is_active=True
        )
        db.add(p)
        
    db.commit()
    db.close()
    print("Base de datos reiniciada con café y accesorios!")

if __name__ == "__main__":
    reseed()
