
import uuid
from sqlalchemy import Column, String, Numeric, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class Product(Base):
    __tablename__ = 'products'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True, default='cafes')
    base_price = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, default=10)
    image_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
