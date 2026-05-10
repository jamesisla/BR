
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.settings import StoreSettings
from app.schemas.settings import StoreConfig

router = APIRouter()

@router.get("/", response_model=StoreConfig)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(StoreSettings).first()
    if not settings:
        # Create default if not exists
        settings = StoreSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.post("/", response_model=StoreConfig)
def update_settings(config: StoreConfig, db: Session = Depends(get_db)):
    settings = db.query(StoreSettings).first()
    if not settings:
        settings = StoreSettings()
        db.add(settings)
    
    settings.name = config.name
    settings.primary_color = config.primary_color
    settings.secondary_color = config.secondary_color
    settings.logo_url = config.logo_url
    settings.footer_text = config.footer_text
    settings.hero_title = config.hero_title
    settings.hero_subtitle = config.hero_subtitle
    settings.hero_image_url = config.hero_image_url
    
    db.commit()
    db.refresh(settings)
    return settings
