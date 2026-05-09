
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.order import Order as OrderModel, OrderItem as OrderItemModel
from app.models.product import Product as ProductModel
from app.schemas.order import Order, OrderCreate
import uuid

router = APIRouter()

@router.post('/', response_model=Order)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    # 1. Create the main order
    db_order = OrderModel(
        email=order_in.email,
        first_name=order_in.first_name,
        last_name=order_in.last_name,
        address=order_in.address,
        total=order_in.total
    )
    db.add(db_order)
    db.flush() # To get the order.id

    # 2. Add items and deduct stock
    for item in order_in.items:
        # Check and deduct stock
        product = db.query(ProductModel).filter(ProductModel.id == uuid.UUID(item.product_id)).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Producto {item.product_id} no encontrado")
        
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Stock insuficiente para {product.name}. Disponible: {product.stock}"
            )
        
        # Deduct stock
        product.stock -= item.quantity
        
        db_item = OrderItemModel(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price_at_purchase=item.price_at_purchase
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get('/', response_model=List[Order])
def list_orders(db: Session = Depends(get_db)):
    return db.query(OrderModel).all()

@router.get('/{order_id}', response_model=Order)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return order

@router.patch('/{order_id}/status', response_model=Order)
def update_order_status(order_id: str, status: str, db: Session = Depends(get_db)):
    order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    order.status = status
    db.commit()
    db.refresh(order)
    return order
