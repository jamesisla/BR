from app.core.database import Base, engine
from app.models.product import Product

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Tables created!")
