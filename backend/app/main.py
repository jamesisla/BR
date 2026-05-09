
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.router import api_router
from app.core.database import Base, engine
from app.models import product, order, settings # Ensure models are loaded

Base.metadata.create_all(bind=engine)

app = FastAPI(title='Ecommerce API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix='/api')
app.mount("/static", StaticFiles(directory="app/static"), name="static")
