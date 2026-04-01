"""
Genera un archivo Excel de ejemplo para el Dashboard CXP.
Ejecutar: python generate_sample.py
"""

import pandas as pd
import random
from datetime import date, timedelta
import os

os.makedirs("../data/uploads", exist_ok=True)

PROVEEDORES = [
    "Distribuidora Nacional S.A.S",
    "Suministros Técnicos Ltda",
    "Importaciones del Valle S.A",
    "Servicios Industriales C&M",
    "Papelería y Oficina Total",
    "Ferretería Central Medellín",
    "Tecnología y Soluciones SAS",
    "Alimentos y Bebidas del Norte",
]

random.seed(42)
rows = []
base_date = date(2024, 3, 1)

for i in range(60):
    proveedor = random.choice(PROVEEDORES)
    fecha = base_date + timedelta(days=random.randint(0, 28))
    valor_base = round(random.uniform(500_000, 15_000_000), 0)
    iva = round(valor_base * 0.19, 0)
    base_iva = valor_base + iva
    notas_credito = round(random.uniform(0, valor_base * 0.05), 0) if random.random() < 0.2 else 0
    retencion = round(valor_base * 0.035, 0) if random.random() < 0.6 else 0
    valor_a_pagar = base_iva - notas_credito - retencion
    pago_pct = random.choice([0, 0.5, 1.0, 1.0, 1.0])
    pago = round(valor_a_pagar * pago_pct, 0)
    saldo = valor_a_pagar - pago
    dias_mora = random.randint(0, 90) if saldo > 0 else 0

    rows.append({
        "PROVEEDOR": proveedor,
        "FECHA": fecha,
        "N° FACTURA": f"FAC-{str(i+1).zfill(4)}",
        "VALOR BASE": valor_base,
        "IVA": iva,
        "BASE+IVA": base_iva,
        "NOTAS CREDITO": notas_credito,
        "RETENCION": retencion,
        "VALOR A PAGAR": valor_a_pagar,
        "PAGO": pago,
        "SALDO": saldo,
        "DIAS_MORA": dias_mora,
    })

df = pd.DataFrame(rows)

with pd.ExcelWriter("../data/uploads/cxp_data.xlsx", engine="openpyxl") as writer:
    df.to_excel(writer, sheet_name="CXP MARZO", index=False)

print(f"✅ Excel generado: data/uploads/cxp_data.xlsx ({len(df)} filas)")
print("   Abre el dashboard y verás los datos cargados automáticamente.")
