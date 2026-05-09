
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    password: str

@router.post('/login')
def admin_login(req: LoginRequest):
    # This is a very simple check for the demo.
    # In production, use hashed passwords and a proper Users table.
    if req.password == "admin123":
        return {"status": "success", "token": "tienda-admin-token-2026"}
    else:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")
