
from sqlalchemy import Column, String, Integer
from app.core.database import Base

class StoreSettings(Base):
    __tablename__ = "store_settings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="TIENDA ARTISAN")
    primary_color = Column(String, default="#3d2b1f")
    secondary_color = Column(String, default="#a67c52")
    logo_url = Column(String, nullable=True)
    footer_text = Column(String, default="© 2026 Tienda Artisan. Crafted for purity.")
