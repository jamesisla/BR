import uuid
import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.product import Product as ProductModel
from app.schemas.product import Product as ProductSchema, ProductCreate

router = APIRouter()

@router.get('/', response_model=List[ProductSchema])
def list_products(q: str = None, category: str = None, db: Session = Depends(get_db)):
    query = db.query(ProductModel).filter(ProductModel.is_active == True)
    
    if q:
        query = query.filter(
            (ProductModel.name.ilike(f"%{q}%")) | 
            (ProductModel.description.ilike(f"%{q}%"))
        )
    
    if category:
        query = query.filter(ProductModel.category == category)
        
    return query.all()

@router.get('/all', response_model=List[ProductSchema])
def admin_list_products(db: Session = Depends(get_db)):
    # Returns all products including inactive ones
    return db.query(ProductModel).all()

@router.post('/upload')
async def handle_image_upload(file: UploadFile = File(...)):
    # Use absolute path to avoid confusion
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    upload_dir = os.path.join(base_dir, "app", "static", "uploads")
    
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    return {"url": f"{backend_url}/static/uploads/{file.filename}"}

@router.post('/', response_model=ProductSchema)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    db_product = ProductModel(**product_in.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get('/{slug}', response_model=ProductSchema)
def get_product(slug: str, db: Session = Depends(get_db)):
    product = db.query(ProductModel).filter(ProductModel.slug == slug, ProductModel.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@router.put('/{product_id}', response_model=ProductSchema)
def update_product(product_id: str, product_in: ProductCreate, db: Session = Depends(get_db)):
    try:
        p_id = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de producto inválido")

    db_product = db.query(ProductModel).filter(ProductModel.id == p_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    update_data = product_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.patch('/{product_id}/toggle-active', response_model=ProductSchema)
def toggle_product_active(product_id: str, db: Session = Depends(get_db)):
    try:
        p_id = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de producto inválido")

    db_product = db.query(ProductModel).filter(ProductModel.id == p_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    db_product.is_active = not db_product.is_active
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete('/{product_id}')
def delete_product(product_id: str, db: Session = Depends(get_db)):
    try:
        p_id = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de producto inválido")

    db_product = db.query(ProductModel).filter(ProductModel.id == p_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    db.delete(db_product)
    db.commit()
    return {"status": "success", "message": "Producto eliminado permanentemente"}
