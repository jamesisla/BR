
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class OrderItemBase(BaseModel):
    product_id: UUID
    quantity: int
    price_at_purchase: Decimal

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    order_id: UUID

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    email: str
    first_name: str
    last_name: str
    address: str
    total: Decimal

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class Order(OrderBase):
    id: UUID
    status: str
    created_at: datetime
    items: List[OrderItem]

    class Config:
        from_attributes = True
