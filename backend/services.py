"""
Servicios de procesamiento de datos con Pandas
Soporte Multi-Empresa y Autenticación
"""

import pandas as pd
import numpy as np
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
import json
import uuid

# Módulo para hacer import de utilidades de auth
# Usaremos auth.get_password_hash de manera controlada donde corresponda
from auth import get_password_hash

# Directorio base de datos
GLOBAL_DATA_DIR = "../data"
USERS_PATH = os.path.join(GLOBAL_DATA_DIR, "users.json")
EMPRESAS_PATH = os.path.join(GLOBAL_DATA_DIR, "empresas.json")

# Funciones de rutas dinámicas por empresa
def get_empresa_dir(empresa_id: str) -> str:
    if not empresa_id:
        empresa_id = "default"
    path = os.path.join(GLOBAL_DATA_DIR, "uploads", str(empresa_id))
    os.makedirs(path, exist_ok=True)
    return path

def get_excel_path(empresa_id: str) -> str:
    return os.path.join(get_empresa_dir(empresa_id), "cxp_data.xlsx")

def get_manual_records_path(empresa_id: str) -> str:
    return os.path.join(get_empresa_dir(empresa_id), "manual_records.json")

def get_upload_history_path(empresa_id: str) -> str:
    return os.path.join(get_empresa_dir(empresa_id), "upload_history.json")

def get_payments_path(empresa_id: str) -> str:
    return os.path.join(get_empresa_dir(empresa_id), "payments.json")

# Nombre de la hoja del Excel
SHEET_NAME = "CXP MARZO"

# Columnas esperadas
COLUMNS = [
    "PROVEEDOR", "FECHA", "N° FACTURA", "VALOR BASE", "IVA",
    "RETENCION", "VALOR A PAGAR", "BASE+IVA", "NOTAS CREDITO",
    "PAGO", "SALDO", "DIAS_MORA"
]

# ─── Auth y Usuarios (CRUD) ───────────────────────────────────────────────────

def load_empresas() -> List[Dict]:
    os.makedirs(GLOBAL_DATA_DIR, exist_ok=True)
    if not os.path.exists(EMPRESAS_PATH):
        return []
    try:
        with open(EMPRESAS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_empresas(empresas: List[Dict]):
    with open(EMPRESAS_PATH, "w", encoding="utf-8") as f:
        json.dump(empresas, f, indent=2, ensure_ascii=False)

def load_users() -> List[Dict]:
    os.makedirs(GLOBAL_DATA_DIR, exist_ok=True)
    if not os.path.exists(USERS_PATH):
        return []
    try:
        with open(USERS_PATH, "r", encoding="utf-8") as f:
            users = json.load(f)
            ALL_MODULES = ["dashboard", "charts", "table", "payments", "builder"]
            modified = False
            for u in users:
                if "modules" not in u:
                    u["modules"] = ALL_MODULES
                    modified = True
            if modified:
                # Se lanza un aviso falso y se confía en que eventualmente 
                # cualquier guardado escribirá los módulos. O lo guardamos directo.
                pass
            return users
    except Exception:
        return []

def save_users(users: List[Dict]):
    with open(USERS_PATH, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

def initialize_default_data():
    """Crea un admin global, Empresa 1 y su usuario, si no existen."""
    empresas = load_empresas()
    users = load_users()

    # Si no hay admin o empresa, inicializamos
    if not any(u.get("role") == "admin" for u in users):
        admin_user = {
            "id": "admin-id-root",
            "username": "admin",
            "password_hash": get_password_hash("admin123"),
            "role": "admin",
            "empresa_id": None
        }
        users.append(admin_user)
        save_users(users)
        print("Admin default creado: admin / admin123")

    if not empresas:
        empresa_1 = {
            "id": "empresa-1-id",
            "name": "Empresa 1 (Ejemplo)"
        }
        empresas.append(empresa_1)
        save_empresas(empresas)
        print("Empresa por defecto creada.")

        user_1 = {
            "id": "user-1-id",
            "username": "usuario1",
            "password_hash": get_password_hash("user123"),
            "role": "user",
            "empresa_id": "empresa-1-id"
        }
        users.append(user_1)
        save_users(users)
        print("Usuario 1 creado: usuario1 / user123 (Asociado a Empresa 1)")

    # Migrar datos antiguos a Empresa 1 si existían en /uploads y no en empresa-1-id
    old_uploads = os.path.join(GLOBAL_DATA_DIR, "uploads")
    if os.path.exists(old_uploads):
        e1_path = os.path.join(old_uploads, "empresa-1-id")
        os.makedirs(e1_path, exist_ok=True)
        # Mover archivos huérfanos a la empresa 1
        for f_name in ["cxp_data.xlsx", "manual_records.json", "upload_history.json", "payments.json"]:
            old_file = os.path.join(old_uploads, f_name)
            new_file = os.path.join(e1_path, f_name)
            if os.path.exists(old_file) and not os.path.exists(new_file):
                try:
                    import shutil
                    shutil.move(old_file, new_file)
                except Exception as e:
                    print("Error migrando", f_name, e)

# ─── Upload History ────────────────────────────────────────────────────────────

def load_upload_history(empresa_id: str) -> List[Dict]:
    path = get_upload_history_path(empresa_id)
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_upload_history(empresa_id: str, history: List[Dict]):
    path = get_upload_history_path(empresa_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2, default=str)

def add_upload_entry(empresa_id: str, filename: str, row_count: int) -> Dict:
    history = load_upload_history(empresa_id)
    entry = {
        "id": str(uuid.uuid4())[:8],
        "filename": filename,
        "rows": row_count,
        "uploaded_at": datetime.now().isoformat(),
    }
    history.insert(0, entry)
    save_upload_history(empresa_id, history)
    return entry


# ─── Payments ──────────────────────────────────────────────────────────────────

def load_payments(empresa_id: str) -> List[Dict]:
    path = get_payments_path(empresa_id)
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_payments(empresa_id: str, payments: List[Dict]):
    path = get_payments_path(empresa_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payments, f, ensure_ascii=False, indent=2, default=str)

def get_payments_filtered(empresa_id: str, proveedor: Optional[str] = None, factura: Optional[str] = None) -> List[Dict]:
    payments = load_payments(empresa_id)
    if proveedor:
        payments = [p for p in payments if proveedor.lower() in p.get("proveedor", "").lower()]
    if factura:
        payments = [p for p in payments if factura.lower() in p.get("factura", "").lower()]
    return payments

def get_invoices_by_provider(empresa_id: str, proveedor: str) -> List[str]:
    df = get_full_dataframe(empresa_id=empresa_id)
    if df.empty:
        return []
    mask = df["PROVEEDOR"].str.contains(proveedor, case=False, na=False, regex=False)
    facturas = sorted(df.loc[mask, "N° FACTURA"].dropna().unique().tolist())
    return [f for f in facturas if f.strip()]

def get_last_record_for_invoice(empresa_id: str, proveedor: str, factura: str) -> Optional[Dict]:
    df = get_full_dataframe(empresa_id=empresa_id)
    if df.empty:
        return None

    mask = (
        df["PROVEEDOR"].str.contains(proveedor, case=False, na=False, regex=False) &
        df["N° FACTURA"].str.contains(factura, case=False, na=False, regex=False)
    )
    df_filtered = df[mask].copy()

    if df_filtered.empty:
        return None

    payments = load_payments(empresa_id)
    invoice_payments = [
        p for p in payments
        if proveedor.lower() in p.get("proveedor", "").lower()
        and factura.lower() in p.get("factura", "").lower()
    ]

    if invoice_payments:
        invoice_payments.sort(key=lambda x: x.get("fecha", ""), reverse=True)
        last_payment = invoice_payments[0]
        saldo_pendiente = last_payment.get("saldo_pendiente", 0)
    else:
        df_filtered = df_filtered.sort_values("FECHA", ascending=False, na_position="last")
        last_row = df_filtered.iloc[0]
        saldo_pendiente = float(last_row.get("SALDO", 0))

    df_filtered = df_filtered.sort_values("FECHA", ascending=True, na_position="last")
    first_row = df_filtered.iloc[0]
    fecha_inicial = first_row.get("FECHA")

    dias_mora = 0
    if pd.notna(fecha_inicial):
        dias_mora = (pd.Timestamp.now() - pd.Timestamp(fecha_inicial)).days

    return {
        "proveedor": proveedor,
        "factura": factura,
        "valor_base": round(saldo_pendiente, 2),
        "iva": 0,
        "base_iva": 0,
        "notas_credito": 0,
        "retencion": 0,
        "saldo_pendiente": round(saldo_pendiente, 2),
        "dias_mora": dias_mora,
        "fecha_inicial": str(fecha_inicial)[:10] if pd.notna(fecha_inicial) else "",
    }

def add_payment(empresa_id: str, proveedor: str, factura: str, pago_realizado: float, fecha: str = "") -> Dict:
    last = get_last_record_for_invoice(empresa_id, proveedor, factura)
    saldo_anterior = last["saldo_pendiente"] if last else 0
    saldo_nuevo = round(saldo_anterior - pago_realizado, 2)
    dias_mora = last["dias_mora"] if last else 0

    payment = {
        "id": str(uuid.uuid4())[:8],
        "proveedor": proveedor,
        "factura": factura,
        "fecha": fecha or datetime.now().strftime("%Y-%m-%d"),
        "valor_base": round(saldo_anterior, 2),
        "iva": 0,
        "base_iva": 0,
        "notas_credito": 0,
        "retencion": 0,
        "pago_realizado": round(pago_realizado, 2),
        "saldo_pendiente": saldo_nuevo,
        "dias_mora": dias_mora,
        "fecha_inicial": last["fecha_inicial"] if last else "",
        "created_at": datetime.now().isoformat(),
    }

    payments = load_payments(empresa_id)
    payments.insert(0, payment)
    save_payments(empresa_id, payments)
    return payment

# ─── Manual Records ────────────────────────────────────────────────────────────

def load_manual_records(empresa_id: str) -> List[Dict]:
    path = get_manual_records_path(empresa_id)
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_manual_records(empresa_id: str, records: List[Dict]):
    path = get_manual_records_path(empresa_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2, default=str)

def delete_payment(empresa_id: str, payment_id: str) -> bool:
    payments = load_payments(empresa_id)
    original = len(payments)
    payments = [p for p in payments if p.get("id") != payment_id]
    if len(payments) == original:
        return False
    save_payments(empresa_id, payments)
    return True

def update_payment(empresa_id: str, payment_id: str, updates: Dict) -> Optional[Dict]:
    payments = load_payments(empresa_id)
    for p in payments:
        if p.get("id") == payment_id:
            if "pago_realizado" in updates:
                p["pago_realizado"] = round(float(updates["pago_realizado"]), 2)
                p["saldo_pendiente"] = round(p.get("valor_base", 0) - p["pago_realizado"], 2)
            if "fecha" in updates:
                p["fecha"] = updates["fecha"]
            save_payments(empresa_id, payments)
            return p
    return None

def delete_manual_record(empresa_id: str, record_index: int) -> bool:
    records = load_manual_records(empresa_id)
    if record_index < 0 or record_index >= len(records):
        return False
    records.pop(record_index)
    save_manual_records(empresa_id, records)
    return True

def update_manual_record(empresa_id: str, record_index: int, updates: Dict) -> Optional[Dict]:
    records = load_manual_records(empresa_id)
    if record_index < 0 or record_index >= len(records):
        return None
    record = records[record_index]
    for key, val in updates.items():
        record[key] = val
    # Recalculate
    vb = float(record.get("VALOR BASE", 0))
    iva = float(record.get("IVA", 0))
    ret = float(record.get("RETENCION", 0))
    nc = float(record.get("NOTAS CREDITO", 0))
    pago = float(record.get("PAGO", 0))
    record["BASE+IVA"] = vb + iva
    record["VALOR A PAGAR"] = vb + iva - ret - nc
    record["SALDO"] = record["VALOR A PAGAR"] - pago
    records[record_index] = record
    save_manual_records(empresa_id, records)
    return record

def update_record_by_invoice(empresa_id: str, proveedor_original: str, factura_original: str, updates: Dict) -> bool:
    updated_any = False

    # 1. Prepare new names if changed to cascade to payments
    new_proveedor = updates.get("PROVEEDOR")
    new_factura = updates.get("N° FACTURA")
    cascaded_proveedor = str(new_proveedor).strip() if new_proveedor is not None else str(proveedor_original).strip()
    cascaded_factura = str(new_factura).strip() if new_factura is not None else str(factura_original).strip()

    # Cascade payments if name or invoice changed
    if cascaded_proveedor.lower() != str(proveedor_original).strip().lower() or cascaded_factura.lower() != str(factura_original).strip().lower():
        payments = load_payments(empresa_id)
        changed_payments = False
        for p in payments:
            if p.get("proveedor", "").strip().lower() == str(proveedor_original).strip().lower() and p.get("factura", "").strip().lower() == str(factura_original).strip().lower():
                p["proveedor"] = cascaded_proveedor
                p["factura"] = cascaded_factura
                changed_payments = True
        if changed_payments:
            save_payments(empresa_id, payments)

    # 2. Update Manual Records
    records = load_manual_records(empresa_id)
    changed_manual = False
    for record in records:
        if str(record.get("PROVEEDOR", "")).strip().lower() == str(proveedor_original).strip().lower() and str(record.get("N° FACTURA", "")).strip().lower() == str(factura_original).strip().lower():
            for key, val in updates.items():
                record[key] = val
            
            # Recalculate Totals
            vb = float(record.get("VALOR BASE", 0) or 0)
            iva = float(record.get("IVA", 0) or 0)
            ret = float(record.get("RETENCION", 0) or 0)
            nc = float(record.get("NOTAS CREDITO", 0) or 0)
            pago = float(record.get("PAGO", 0) or 0)
            record["BASE+IVA"] = vb + iva
            record["VALOR A PAGAR"] = vb + iva - ret - nc
            record["SALDO"] = record["VALOR A PAGAR"] - pago
            changed_manual = True
            updated_any = True

    if changed_manual:
        save_manual_records(empresa_id, records)

    # 3. Update Excel Document
    excel_path = get_excel_path(empresa_id)
    if os.path.exists(excel_path):
        try:
            df = read_excel(excel_path)
            df = normalize_dataframe(df)
            
            # Find matching rows
            prov_mask = df["PROVEEDOR"].astype(str).str.strip().str.lower() == str(proveedor_original).strip().lower()
            fac_mask = df["N° FACTURA"].astype(str).str.strip().str.lower() == str(factura_original).strip().lower()
            mask = prov_mask & fac_mask

            if mask.any():
                for key, val in updates.items():
                    if key in df.columns:
                        df.loc[mask, key] = val
                
                # Recalculate computed columns
                for col in ["VALOR BASE", "IVA", "RETENCION", "NOTAS CREDITO", "PAGO"]:
                    df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

                df["BASE+IVA"] = df["VALOR BASE"] + df["IVA"]
                df["VALOR A PAGAR"] = df["BASE+IVA"] - df["RETENCION"] - df["NOTAS CREDITO"]
                df["SALDO"] = df["VALOR A PAGAR"] - df["PAGO"]

                df.to_excel(excel_path, index=False, sheet_name=SHEET_NAME)
                updated_any = True
        except Exception as e:
            print(f"Error updating Excel file: {e}")

    return updated_any


# ─── Excel Processing ─────────────────────────────────────────────────────────

def read_excel(file_path: str) -> pd.DataFrame:
    try:
        df = pd.read_excel(file_path, sheet_name=SHEET_NAME, engine="openpyxl")
    except Exception:
        df = pd.read_excel(file_path, sheet_name=0, engine="openpyxl")
    df.columns = [str(c).strip().upper() for c in df.columns]
    df = df.dropna(how="all")
    return df

def normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    column_mapping = {
        "PROVEEDOR": "PROVEEDOR", "FECHA": "FECHA", "N° FACTURA": "N° FACTURA",
        "N FACTURA": "N° FACTURA", "NUMERO FACTURA": "N° FACTURA",
        "VALOR BASE": "VALOR BASE", "IVA": "IVA", "BASE+IVA": "BASE+IVA",
        "NOTAS CREDITO": "NOTAS CREDITO", "NOTAS CRÉDITO": "NOTAS CREDITO",
        "RETENCION": "RETENCION", "RETENCIÓN": "RETENCION",
        "VALOR A PAGAR": "VALOR A PAGAR", "PAGO": "PAGO", "SALDO": "SALDO",
        "DIAS_MORA": "DIAS_MORA", "DIAS MORA": "DIAS_MORA", "DÍAS MORA": "DIAS_MORA",
    }
    df = df.rename(columns=column_mapping)
    for col in COLUMNS:
        if col not in df.columns:
            if col in ["VALOR BASE", "IVA", "BASE+IVA", "NOTAS CREDITO", 
                       "RETENCION", "VALOR A PAGAR", "PAGO", "SALDO", "DIAS_MORA"]:
                df[col] = 0
            else:
                df[col] = ""

    numeric_cols = ["VALOR BASE", "IVA", "BASE+IVA", "NOTAS CREDITO", "RETENCION", "VALOR A PAGAR", "PAGO", "SALDO", "DIAS_MORA"]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    df["SALDO"] = df["VALOR A PAGAR"] - df["PAGO"]
    df["FECHA"] = pd.to_datetime(df["FECHA"], errors="coerce")
    df["FECHA_STR"] = df["FECHA"].dt.strftime("%Y-%m-%d").fillna("")
    df["PROVEEDOR"] = df["PROVEEDOR"].fillna("Sin proveedor").astype(str).str.strip()
    df["N° FACTURA"] = df["N° FACTURA"].fillna("").astype(str).str.strip()
    df["EN_MORA"] = df["DIAS_MORA"] > 30
    return df

def get_full_dataframe(
    empresa_id: str,
    proveedor: Optional[str] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    factura: Optional[str] = None,
    dias_mora_min: Optional[int] = None,
    search: Optional[str] = None,
) -> pd.DataFrame:
    dfs = []
    excel_path = get_excel_path(empresa_id)
    if os.path.exists(excel_path):
        try:
            df_excel = read_excel(excel_path)
            df_excel = normalize_dataframe(df_excel)
            dfs.append(df_excel)
        except Exception as e:
            print(f"Error leyendo Excel: {e}")

    manual = load_manual_records(empresa_id)
    if manual:
        df_manual = pd.DataFrame(manual)
        df_manual = normalize_dataframe(df_manual)
        dfs.append(df_manual)

    if not dfs:
        return pd.DataFrame(columns=COLUMNS + ["FECHA_STR", "EN_MORA"])

    df = pd.concat(dfs, ignore_index=True)

    if proveedor and proveedor != "Todos":
        df = df[df["PROVEEDOR"].str.contains(proveedor, case=False, na=False, regex=False)]
    if fecha_inicio:
        df = df[df["FECHA"] >= pd.to_datetime(fecha_inicio, errors="coerce")]
    if fecha_fin:
        df = df[df["FECHA"] <= pd.to_datetime(fecha_fin, errors="coerce")]
    if factura:
        df = df[df["N° FACTURA"].str.contains(factura, case=False, na=False, regex=False)]
    if dias_mora_min is not None:
        df = df[df["DIAS_MORA"] >= dias_mora_min]
    if search:
        mask = (
            df["PROVEEDOR"].str.contains(search, case=False, na=False, regex=False) |
            df["N° FACTURA"].str.contains(search, case=False, na=False, regex=False)
        )
        df = df[mask]

    return df

def get_latest_per_invoice(empresa_id: str, df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    df_sorted = df.sort_values("FECHA", ascending=False, na_position="last")
    latest = df_sorted.groupby(["PROVEEDOR", "N° FACTURA"], as_index=False).first()

    payments = load_payments(empresa_id)
    if payments:
        for idx, row in latest.iterrows():
            prov = str(row["PROVEEDOR"]).strip()
            fac = str(row["N° FACTURA"]).strip()
            if not fac:
                continue

            inv_payments = [
                p for p in payments
                if p.get("proveedor", "").strip().lower() == prov.lower()
                and p.get("factura", "").strip().lower() == fac.lower()
            ]

            if inv_payments:
                inv_payments.sort(key=lambda x: x.get("fecha", ""), reverse=True)
                last_payment = inv_payments[0]
                total_pagos = sum(p.get("pago_realizado", 0) for p in inv_payments)

                latest.at[idx, "SALDO"] = last_payment.get("saldo_pendiente", row["SALDO"])
                latest.at[idx, "PAGO"] = float(row.get("PAGO", 0)) + total_pagos
                
                payment_fecha = last_payment.get("fecha", "")
                if payment_fecha:
                    try:
                        latest.at[idx, "FECHA"] = pd.to_datetime(payment_fecha)
                        latest.at[idx, "FECHA_STR"] = payment_fecha
                    except Exception:
                        pass

                fecha_inicial = last_payment.get("fecha_inicial", "")
                if fecha_inicial:
                    try:
                        dias = (pd.Timestamp.now() - pd.Timestamp(fecha_inicial)).days
                        latest.at[idx, "DIAS_MORA"] = dias
                        latest.at[idx, "EN_MORA"] = dias > 30
                    except Exception:
                        pass

    return latest

def calculate_kpis(df: pd.DataFrame) -> Dict[str, Any]:
    if df.empty:
        return {
            "total_valor_base": 0, "total_iva": 0, "total_retencion": 0,
            "total_valor_pagar": 0, "total_base_iva": 0, "total_notas_credito": 0,
            "total_pagado": 0, "saldo_total": 0, "facturas_mora": 0,
            "total_facturas": 0, "porcentaje_pagado": 0,
        }

    total_valor_pagar = float(df["VALOR A PAGAR"].sum())
    total_pagado = float(df["PAGO"].sum())

    return {
        "total_valor_base": round(float(df["VALOR BASE"].sum()), 2),
        "total_iva": round(float(df["IVA"].sum()), 2),
        "total_retencion": round(float(df["RETENCION"].sum()), 2),
        "total_valor_pagar": round(total_valor_pagar, 2),
        "total_base_iva": round(float(df["BASE+IVA"].sum()), 2),
        "total_notas_credito": round(float(df["NOTAS CREDITO"].sum()), 2),
        "total_pagado": round(total_pagado, 2),
        "saldo_total": round(float(df["SALDO"].sum()), 2),
        "facturas_mora": int(df["EN_MORA"].sum()),
        "total_facturas": len(df),
        "porcentaje_pagado": round((total_pagado / total_valor_pagar * 100) if total_valor_pagar > 0 else 0, 1),
    }

def get_chart_data(df: pd.DataFrame) -> Dict[str, Any]:
    if df.empty:
        return {"pagos_por_proveedor": [], "saldo_por_proveedor": [], "pagos_por_fecha": [], "distribucion_mora": []}

    pagos_prov = df.groupby("PROVEEDOR")["PAGO"].sum().sort_values(ascending=False).head(10).reset_index()
    pagos_por_proveedor = [{"proveedor": row["PROVEEDOR"], "pago": round(float(row["PAGO"]), 2)} for _, row in pagos_prov.iterrows()]

    saldo_prov = df.groupby("PROVEEDOR")["SALDO"].sum().sort_values(ascending=False).head(10).reset_index()
    saldo_por_proveedor = [{"proveedor": row["PROVEEDOR"], "saldo": round(float(row["SALDO"]), 2)} for _, row in saldo_prov.iterrows()]

    df_fecha = df[df["FECHA"].notna()].copy()
    if not df_fecha.empty:
        pagos_fecha = df_fecha.groupby(df_fecha["FECHA"].dt.to_period("M"))["PAGO"].sum().reset_index()
        pagos_por_fecha = [{"fecha": str(row["FECHA"]), "pago": round(float(row["PAGO"]), 2)} for _, row in pagos_fecha.iterrows()]
    else:
        pagos_por_fecha = []

    en_mora = int(df["EN_MORA"].sum())
    al_dia = len(df) - en_mora
    distribucion_mora = [{"categoria": "Al día", "cantidad": al_dia}, {"categoria": "En mora (>30 días)", "cantidad": en_mora}]

    return {
        "pagos_por_proveedor": pagos_por_proveedor,
        "saldo_por_proveedor": saldo_por_proveedor,
        "pagos_por_fecha": pagos_por_fecha,
        "distribucion_mora": distribucion_mora,
    }

def get_chart_data_custom(df: pd.DataFrame, variable: str) -> List[Dict]:
    valid_vars = {
        "valor_base": "VALOR BASE", "iva": "IVA", "retencion": "RETENCION",
        "base_iva": "BASE+IVA", "notas_credito": "NOTAS CREDITO",
        "valor_pagar": "VALOR A PAGAR", "pago": "PAGO", "saldo": "SALDO", "dias_mora": "DIAS_MORA",
    }
    col = valid_vars.get(variable)
    if not col or df.empty:
        return []
    grouped = df.groupby("PROVEEDOR")[col].sum().sort_values(ascending=False).head(15).reset_index()
    return [{"proveedor": row["PROVEEDOR"], "valor": round(float(row[col]), 2)} for _, row in grouped.iterrows()]

def get_table_records(df: pd.DataFrame) -> List[Dict]:
    if df.empty:
        return []
    records = []
    for _, row in df.iterrows():
        records.append({
            "proveedor": str(row.get("PROVEEDOR", "")),
            "fecha": str(row.get("FECHA_STR", "")),
            "factura": str(row.get("N° FACTURA", "")),
            "valor_base": round(float(row.get("VALOR BASE", 0)), 2),
            "iva": round(float(row.get("IVA", 0)), 2),
            "retencion": round(float(row.get("RETENCION", 0)), 2),
            "valor_pagar": round(float(row.get("VALOR A PAGAR", 0)), 2),
            "base_iva": round(float(row.get("BASE+IVA", 0)), 2),
            "notas_credito": round(float(row.get("NOTAS CREDITO", 0)), 2),
            "pago": round(float(row.get("PAGO", 0)), 2),
            "saldo": round(float(row.get("SALDO", 0)), 2),
            "dias_mora": int(row.get("DIAS_MORA", 0)),
            "en_mora": bool(row.get("EN_MORA", False)),
        })
    return records

def get_filter_options(df: pd.DataFrame) -> Dict[str, List]:
    if df.empty:
        return {"proveedores": [], "facturas": []}
    return {
        "proveedores": sorted(df["PROVEEDOR"].dropna().unique().tolist()),
        "facturas": sorted(df["N° FACTURA"].dropna().unique().tolist()),
    }
