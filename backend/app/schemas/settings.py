
from pydantic import BaseModel
from typing import Optional

class StoreConfig(BaseModel):
    name: str = "TIENDA ARTISAN"
    logo_url: Optional[str] = ""
    primary_color: str = "#3d2b1f" 
    secondary_color: str = "#a67c52"
    footer_text: str = "© 2026 Tienda Artisan. Crafted for purity."

    class Config:
        from_attributes = True
