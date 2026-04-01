"""
Dashboard CXP - Backend Principal
FastAPI + Pandas + openpyxl
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
import os

# Crear directorio de uploads si no existe
os.makedirs("../data/uploads", exist_ok=True)

from services import initialize_default_data
initialize_default_data()

app = FastAPI(
    title="Dashboard CXP API",
    description="API para Dashboard de Cuentas por Pagar a Proveedores",
    version="1.0.0"
)

# Configurar CORS para permitir conexión desde el frontend React
app.add_middleware(
    CORSMiddleware,
    #allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rutas
app.include_router(router)

@app.get("/")
def root():
    return {"message": "Dashboard CXP API funcionando correctamente", "version": "1.0.0"}
