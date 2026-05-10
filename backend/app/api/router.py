
from fastapi import APIRouter
from app.api.v1.products import router as products
from app.api.v1.settings import router as settings
from app.api.v1.orders import router as orders
from app.api.v1.auth import router as auth
from app.api.v1.payments import router as payments

api_router = APIRouter()
api_router.include_router(products, prefix='/products', tags=['products'])
api_router.include_router(settings, prefix='/settings', tags=['settings'])
api_router.include_router(orders, prefix='/orders', tags=['orders'])
api_router.include_router(auth, prefix='/auth', tags=['auth'])
api_router.include_router(payments, prefix='/payments', tags=['payments'])
