import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.product import Product
from decimal import Decimal
import uuid

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:pass@db:5432/ecommerce')
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def seed():
    db = SessionLocal()
    
    # Check if products exist
    if db.query(Product).count() > 0:
        print("Database already seeded.")
        return

    products = [
        Product(
            name="Aura Headphones",
            slug="aura-headphones",
            description="Experience pure sound with adaptive noise cancellation and 40-hour battery life.",
            base_price=Decimal("299.99"),
            is_active=True
        ),
        Product(
            name="Nebula Watch",
            slug="nebula-watch",
            description="The future on your wrist. Advanced health tracking and seamless connectivity.",
            base_price=Decimal("499.00"),
            is_active=True
        ),
        Product(
            name="Lumina Desk Lamp",
            slug="lumina-lamp",
            description="Intelligent lighting that adapts to your mood and productivity needs.",
            base_price=Decimal("89.50"),
            is_active=True
        )
    ]
    
    db.add_all(products)
    db.commit()
    print("Seed complete!")

if __name__ == "__main__":
    seed()
