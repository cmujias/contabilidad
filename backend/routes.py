"""
Rutas (endpoints) del API - Dashboard CXP
Autenticación, Multi-Empresa y Operaciones
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Depends, status
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional, List
import shutil
import services
from auth import get_current_user, create_access_token, verify_password, get_password_hash
import uuid
import io

router = APIRouter()

# ─── Modelos Pydantic ──────────────────────────────────────────────────────────

class CustomLoginData(BaseModel):
    username: str
    password: str
    empresa_id: Optional[str] = None

class EmpresaCreate(BaseModel):
    name: str

class EmpresaUpdate(BaseModel):
    name: str

class UserCreate(BaseModel):
    username: str
    password: str
    role: str
    empresa_id: Optional[str] = None
    modules: Optional[List[str]] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    empresa_id: Optional[str] = None
    modules: Optional[List[str]] = None

class PasswordUpdate(BaseModel):
    password: str

class ManualRecord(BaseModel):
    PROVEEDOR: str
    FECHA: Optional[str] = ""
    N_FACTURA: str = ""
    VALOR_BASE: float = 0
    IVA: float = 0
    BASE_IVA: float = 0
    NOTAS_CREDITO: float = 0
    RETENCION: float = 0
    VALOR_A_PAGAR: float = 0
    PAGO: float = 0
    DIAS_MORA: int = 0

class PaymentRecord(BaseModel):
    proveedor: str
    factura: str
    pago_realizado: float
    fecha: Optional[str] = ""

class PaymentUpdate(BaseModel):
    pago_realizado: Optional[float] = None
    fecha: Optional[str] = None

class RecordUpdate(BaseModel):
    PROVEEDOR: Optional[str] = None
    FECHA: Optional[str] = None
    N_FACTURA: Optional[str] = None
    VALOR_BASE: Optional[float] = None
    IVA: Optional[float] = None
    RETENCION: Optional[float] = None
    NOTAS_CREDITO: Optional[float] = None
    PAGO: Optional[float] = None
    DIAS_MORA: Optional[int] = None

class RecordUpdateByInvoiceBody(BaseModel):
    proveedor_original: str
    factura_original: str
    updates: RecordUpdate


# Helper para extraer el empresa_id contextual
def get_active_empresa(user: dict, request_empresa_id: str = None) -> str:
    """Valida y retorna el empresa_id para la operación actual."""
    if user["role"] == "admin":
        if not request_empresa_id:
            raise HTTPException(status_code=400, detail="Los administradores deben especificar una empresa (empresa_id).")
        return request_empresa_id
    else:
        # Rol normal, solo puede ver su propia empresa
        return user["empresa_id"]

# ─── Auth y Admin ─────────────────────────────────────────────────────────────

@router.post("/auth/login", summary="Iniciar Sesión")
def login(login_data: CustomLoginData):
    users = services.load_users()
    user = next((u for u in users if u["username"] == login_data.username), None)
    
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
    # Validar que si eligió empresa, pertenezca a la misma (no aplica a admins)
    if user["role"] != "admin" and login_data.empresa_id:
        if user["empresa_id"] != login_data.empresa_id:
            raise HTTPException(status_code=403, detail="No perteneces a esta empresa seleccionada.")

    # Emitir token
    access_token = create_access_token(data={"sub": user["username"], "role": user["role"]})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "username": user["username"],
            "role": user["role"],
            "empresa_id": user["empresa_id"],
            "modules": user.get("modules", ["dashboard", "charts", "table", "payments", "builder"])
        }
    }


@router.get("/admin/empresas", summary="Listar empresas (Admin)")
def get_empresas(current_user: dict = Depends(get_current_user)):
    return {"empresas": services.load_empresas()}

@router.post("/admin/empresas", summary="Crear empresa (Admin)")
def create_empresa(empresa: EmpresaCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    empresas = services.load_empresas()
    new_empresa = {
        "id": "emp_" + str(uuid.uuid4())[:8],
        "name": empresa.name
    }
    empresas.append(new_empresa)
    services.save_empresas(empresas)
    return {"success": True, "empresa": new_empresa}

@router.put("/admin/empresas/{emp_id}", summary="Actualizar empresa")
def update_empresa(emp_id: str, empresa: EmpresaUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin": raise HTTPException(403, "Solo adm")
    empresas = services.load_empresas()
    for e in empresas:
        if e["id"] == emp_id:
            e["name"] = empresa.name
            services.save_empresas(empresas)
            return {"success": True}
    raise HTTPException(404, "Empresa no encontrada")

@router.delete("/admin/empresas/{emp_id}", summary="Eliminar empresa")
def delete_empresa(emp_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin": raise HTTPException(403, "Solo adm")
    users = services.load_users()
    if any(u.get("empresa_id") == emp_id for u in users):
        raise HTTPException(400, "No puedes borrar la empresa porque tiene empleados vinculados")
    empresas = services.load_empresas()
    empresas = [e for e in empresas if e["id"] != emp_id]
    services.save_empresas(empresas)
    return {"success": True}


@router.get("/admin/users", summary="Listar usuarios (Admin)")
def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    users = services.load_users()
    # Ocultar hashes
    safe_users = [{k: v for k, v in u.items() if k != "password_hash"} for u in users]
    return {"users": safe_users}

@router.post("/admin/users", summary="Crear usuario (Admin)")
def create_user(user: UserCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    users = services.load_users()
    
    if any(u["username"] == user.username for u in users):
        raise HTTPException(status_code=400, detail="Username ya existe")
        
    new_user = {
        "id": "usr_" + str(uuid.uuid4())[:8],
        "username": user.username,
        "password_hash": get_password_hash(user.password),
        "role": user.role,
        "empresa_id": user.empresa_id,
        "modules": user.modules if user.modules is not None else ["dashboard", "charts", "table", "payments", "builder"]
    }
    users.append(new_user)
    services.save_users(users)
    return {"success": True, "message": "Usuario creado exitosamente"}

@router.put("/admin/users/{user_id}", summary="Actualizar usuario")
def update_user(user_id: str, user: UserUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin": raise HTTPException(403, "Solo adm")
    users = services.load_users()
    for u in users:
        if u["id"] == user_id:
            if user.username: u["username"] = user.username
            if user.role: u["role"] = user.role
            if user.empresa_id is not None: u["empresa_id"] = user.empresa_id
            if user.modules is not None: u["modules"] = user.modules
            services.save_users(users)
            return {"success": True}
    raise HTTPException(404, "Usuario no encontrado")

@router.delete("/admin/users/{user_id}", summary="Eliminar usuario")
def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin": raise HTTPException(403, "Solo adm")
    users = services.load_users()
    
    # Evitar que el admin principal se borre a sí mismo
    user_to_delete = next((u for u in users if u["id"] == user_id), None)
    if not user_to_delete: raise HTTPException(404, "Usuario no encontrado")
    if user_to_delete["username"] == current_user["sub"] and user_to_delete["role"] == "admin":
        raise HTTPException(400, "No puedes eliminar tu propia cuenta de administrador activo")

    users = [u for u in users if u["id"] != user_id]
    services.save_users(users)
    return {"success": True}

@router.put("/admin/users/{user_id}/password", summary="Cambiar clave de usuario")
def update_password(user_id: str, p_update: PasswordUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin": raise HTTPException(403, "Solo adm")
    users = services.load_users()
    for u in users:
        if u["id"] == user_id:
            u["password_hash"] = get_password_hash(p_update.password)
            services.save_users(users)
            return {"success": True}
    raise HTTPException(404, "Usuario no encontrado")


# ─── Endpoints de CXP (Protegidos) ──────────────────────────────────────────────

@router.post("/upload", summary="Subir archivo Excel CXP o Copia de Seguridad")
async def upload_excel(
    file: UploadFile = File(...), 
    empresa_id: str = Query(None),
    current_user: dict = Depends(get_current_user)
):
    active_empresa = get_active_empresa(current_user, empresa_id)
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Solo Excel permitidos")

    excel_path = services.get_excel_path(active_empresa)
    try:
        with open(excel_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    import pandas as pd
    try:
        xls = pd.ExcelFile(excel_path, engine="openpyxl")
        sheet_names = xls.sheet_names
        msg_parts = []
        
        # Restaurar registros manuales si existen en la copia de seguridad
        if "REGISTROS MANUALES" in sheet_names:
            df_manual = pd.read_excel(xls, sheet_name="REGISTROS MANUALES")
            df_manual = df_manual.where(pd.notnull(df_manual), None)
            records = df_manual.to_dict(orient="records")
            services.save_manual_records(active_empresa, records)
            msg_parts.append(f"✓ {len(records)} Registros Manuales restaurados")
            
        # Restaurar pagos si existen en la copia de seguridad
        if "PAGOS" in sheet_names:
            df_pay = pd.read_excel(xls, sheet_name="PAGOS")
            df_pay = df_pay.where(pd.notnull(df_pay), None)
            payments = df_pay.to_dict(orient="records")
            services.save_payments(active_empresa, payments)
            msg_parts.append(f"✓ {len(payments)} Pagos previos restaurados")
            
        df = services.read_excel(excel_path)
        df = services.normalize_dataframe(df)
        rows = len(df)
        msg_parts.insert(0, f"✓ {rows} filas cargadas desde la Plantilla Base")
    except Exception as e:
        raise HTTPException(status_code=422, detail="Error leyendo Excel o restaurando backup")

    entry = services.add_upload_entry(active_empresa, file.filename, rows)
    final_message = "\n".join(msg_parts) if msg_parts else f"{rows} filas cargadas."
    return {"success": True, "message": final_message, "upload_id": entry["id"]}


@router.get("/upload-history", summary="Historial de cargues")
def get_upload_history(empresa_id: str = Query(None), current_user: dict = Depends(get_current_user)):
    active_empresa = get_active_empresa(current_user, empresa_id)
    history = services.load_upload_history(active_empresa)
    return {"history": history}


@router.get("/export", summary="Exportar Copia de Seguridad Completa")
def export_excel_data(empresa_id: str = Query(None), current_user: dict = Depends(get_current_user)):
    active_empresa = get_active_empresa(current_user, empresa_id)
    pd = __import__("pandas")
    
    # 1. Base Excel
    excel_path = services.get_excel_path(active_empresa)
    df_base = pd.DataFrame()
    if __import__("os").path.exists(excel_path):
        try:
            df_base = services.read_excel(excel_path)
        except Exception:
            pass
            
    # 2. Manual Records
    manual = services.load_manual_records(active_empresa)
    df_manual = pd.DataFrame(manual) if manual else pd.DataFrame()
    
    # 3. Payments
    payments = services.load_payments(active_empresa)
    df_payments = pd.DataFrame(payments) if payments else pd.DataFrame()
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        if not df_base.empty:
            df_base.to_excel(writer, index=False, sheet_name=services.SHEET_NAME)
        else:
            pd.DataFrame(columns=services.COLUMNS).to_excel(writer, index=False, sheet_name=services.SHEET_NAME)
            
        if not df_manual.empty:
            df_manual.to_excel(writer, index=False, sheet_name="REGISTROS MANUALES")
            
        if not df_payments.empty:
            df_payments.to_excel(writer, index=False, sheet_name="PAGOS")
            
    output.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename="Backup_CXP.xlsx"'
    }
    return StreamingResponse(
        output, 
        headers=headers, 
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )



@router.get("/dashboard-data", summary="Datos del Dashboard")
def get_dashboard_data(
    empresa_id: str = Query(None),
    proveedor: Optional[str] = Query(None),
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    factura: Optional[str] = Query(None),
    dias_mora_min: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    active_empresa = get_active_empresa(current_user, empresa_id)
    
    df = services.get_full_dataframe(
        empresa_id=active_empresa,
        proveedor=proveedor,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        factura=factura,
        dias_mora_min=dias_mora_min,
        search=search,
    )
    df_latest = services.get_latest_per_invoice(active_empresa, df)

    return {
        "kpis": services.calculate_kpis(df_latest),
        "charts": services.get_chart_data(df_latest),
        "records": services.get_table_records(df_latest),
    }

@router.get("/chart-data-custom", summary="Gráficos custom")
def get_chart_data_custom(
    variable: str = Query(...),
    empresa_id: str = Query(None),
    current_user: dict = Depends(get_current_user)
):
    active_empresa = get_active_empresa(current_user, empresa_id)
    df = services.get_full_dataframe(empresa_id=active_empresa)
    df_latest = services.get_latest_per_invoice(active_empresa, df)
    return {"data": services.get_chart_data_custom(df_latest, variable)}

@router.get("/status", summary="Estado del sistema")
def get_status(empresa_id: str = Query(None), current_user: dict = Depends(get_current_user)):
    active_empresa = get_active_empresa(current_user, empresa_id)
    has_excel = __import__("os").path.exists(services.get_excel_path(active_empresa))
    return {
        "has_excel": has_excel,
        "manual_records": len(services.load_manual_records(active_empresa)),
        "payment_records": len(services.load_payments(active_empresa)),
    }

@router.get("/filters", summary="Filtros disponibles")
def get_filters(empresa_id: str = Query(None), current_user: dict = Depends(get_current_user)):
    active_empresa = get_active_empresa(current_user, empresa_id)
    df = services.get_full_dataframe(empresa_id=active_empresa)
    return services.get_filter_options(df)


# ─── Módulo de Pagos ──────────────────────────────────────────────────────────

@router.get("/payments", summary="Listar pagos")
def get_payments(
    empresa_id: str = Query(None),
    proveedor: Optional[str] = Query(None),
    factura: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    active_empresa = get_active_empresa(current_user, empresa_id)
    payments = services.get_payments_filtered(active_empresa, proveedor, factura)
    return {"payments": payments, "total": len(payments)}

@router.post("/add-payment", summary="Añadir pago")
def add_payment(payment: PaymentRecord, empresa_id: str = Query(None), current_user: dict = Depends(get_current_user)):
    active_empresa = get_active_empresa(current_user, empresa_id)
    res = services.add_payment(active_empresa, payment.proveedor, payment.factura, payment.pago_realizado, payment.fecha)
    return {"success": True, "payment": res}

@router.get("/invoices-by-provider")
def invoices_by_provider(proveedor: str, empresa_id: str = Query(None), current_user: dict = Depends(get_current_user)):
    active_empresa = get_active_empresa(current_user, empresa_id)
    return {"invoices": services.get_invoices_by_provider(active_empresa, proveedor)}

@router.get("/invoice-last-record")
def invoice_last_record(proveedor: str, factura: str, empresa_id: str = Query(None), current_user: dict = Depends(get_current_user)):
    active_empresa = get_active_empresa(current_user, empresa_id)
    data = services.get_last_record_for_invoice(active_empresa, proveedor, factura)
    if not data:
        raise HTTPException(status_code=404, detail="No data")
    return {"data": data}

@router.delete("/payments/{payment_id}")
def delete_payment(payment_id: str, empresa_id: str = Query(None), current_user: dict = Depends(get_current_user)):
    active_empresa = get_active_empresa(current_user, empresa_id)
    success = services.delete_payment(active_empresa, payment_id)
    if not success: 
        raise HTTPException(status_code=404)
    return {"success": True}

@router.put("/payments/{payment_id}")
def update_payment(payment_id: str, updates: PaymentUpdate, empresa_id: str = Query(None), current_user: dict = Depends(get_current_user)):
    active_empresa = get_active_empresa(current_user, empresa_id)
    upd = {k: v for k, v in updates.dict().items() if v is not None}
    res = services.update_payment(active_empresa, payment_id, upd)
    if not res: 
        raise HTTPException(status_code=404)
    return {"success": True, "payment": res}

@router.delete("/records/{record_index}")
def delete_manual_record(record_index: int, empresa_id: str = Query(None), current_user: dict = Depends(get_current_user)):
    active_empresa = get_active_empresa(current_user, empresa_id)
    success = services.delete_manual_record(active_empresa, record_index)
    if not success: 
        raise HTTPException(status_code=404)
    return {"success": True}

@router.put("/records/update-by-invoice", summary="Update record across manual and excel base")
def update_record_by_invoice(payload: RecordUpdateByInvoiceBody, empresa_id: str = Query(None), current_user: dict = Depends(get_current_user)):
    active_empresa = get_active_empresa(current_user, empresa_id)
    upd = {}
    for k, v in payload.updates.dict().items():
        if v is not None:
            if k == "N_FACTURA": upd["N° FACTURA"] = v
            elif k == "VALOR_BASE": upd["VALOR BASE"] = v
            elif k == "NOTAS_CREDITO": upd["NOTAS CREDITO"] = v
            else: upd[k] = v
            
    success = services.update_record_by_invoice(active_empresa, payload.proveedor_original, payload.factura_original, upd)
    if not success:
        raise HTTPException(status_code=404, detail="Record not found in manual records or Excel base")
    return {"success": True}

@router.put("/records/{record_index}")
def update_manual_record(record_index: int, updates: RecordUpdate, empresa_id: str = Query(None), current_user: dict = Depends(get_current_user)):
    active_empresa = get_active_empresa(current_user, empresa_id)
    upd = {k: v for k, v in updates.dict().items() if v is not None}
    res = services.update_manual_record(active_empresa, record_index, upd)
    if not res:
        raise HTTPException(status_code=404)
    return {"success": True, "record": res}

@router.post("/add-record")
def add_record(record: ManualRecord, empresa_id: str = Query(None), current_user: dict = Depends(get_current_user)):
    active_empresa = get_active_empresa(current_user, empresa_id)
    records = services.load_manual_records(active_empresa)
    new_record = {
        "PROVEEDOR": record.PROVEEDOR,
        "FECHA": record.FECHA,
        "N° FACTURA": record.N_FACTURA,
        "VALOR BASE": record.VALOR_BASE,
        "IVA": record.IVA,
        "RETENCION": record.RETENCION,
        "VALOR A PAGAR": record.VALOR_A_PAGAR if record.VALOR_A_PAGAR > 0 else (record.VALOR_BASE + record.IVA - record.RETENCION - record.NOTAS_CREDITO),
        "BASE+IVA": record.BASE_IVA if record.BASE_IVA > 0 else record.VALOR_BASE + record.IVA,
        "NOTAS CREDITO": record.NOTAS_CREDITO,
        "PAGO": record.PAGO,
        "SALDO": (record.VALOR_A_PAGAR if record.VALOR_A_PAGAR > 0 else (record.VALOR_BASE + record.IVA - record.RETENCION - record.NOTAS_CREDITO)) - record.PAGO,
        "DIAS_MORA": record.DIAS_MORA,
    }
    records.append(new_record)
    services.save_manual_records(active_empresa, records)
    return {"success": True, "total_manual_records": len(records)}



