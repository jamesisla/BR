from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from uuid import UUID
from typing import Optional

class ProductBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    category: Optional[str] = 'cafes'
    base_price: Decimal
    stock: int = 10
    image_url: Optional[str] = None
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    name: Optional[str] = None
    slug: Optional[str] = None
    base_price: Optional[Decimal] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None

class Product(ProductBase):
    id: UUID
    
    model_config = ConfigDict(from_attributes=True)
