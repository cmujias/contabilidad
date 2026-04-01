# 📊 Dashboard CXP — Cuentas por Pagar a Proveedores

Dashboard interactivo tipo PowerBI para analizar facturas y cuentas por pagar.  
Funciona **100% local** en tu PC. No requiere internet después de instalado.

---

## 🗂️ Estructura del Proyecto

```
project/
├── backend/
│   ├── main.py              ← FastAPI app principal
│   ├── routes.py            ← Endpoints del API
│   ├── services.py          ← Lógica de negocio con Pandas
│   └── generate_sample.py  ← Script para generar datos de ejemplo
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── KPICards.jsx
│   │   │   ├── Charts.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── Filters.jsx
│   │   │   ├── DragDropPanel.jsx
│   │   │   ├── AddRecordForm.jsx
│   │   │   └── UploadExcel.jsx
│   │   ├── pages/
│   │   │   └── Dashboard.jsx
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
├── data/
│   └── uploads/             ← Aquí se guarda el Excel cargado
└── requirements.txt
```

---

## ⚙️ Requisitos

- **Python** 3.10 o superior
- **Node.js** 18 o superior
- **npm** 9 o superior

---

## 🚀 Instalación y Ejecución

### 1. Clonar / descomprimir el proyecto

```bash
cd project/
```

### 2. Instalar dependencias del Backend

```bash
pip install -r requirements.txt
```

### 3. (Opcional) Generar datos de ejemplo

```bash
cd backend/
python generate_sample.py
cd ..
```

Esto crea un Excel de prueba con 60 facturas de 8 proveedores ficticios en `data/uploads/cxp_data.xlsx`.

### 4. Iniciar el Backend

```bash
cd backend/
py -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ El API quedará disponible en: `http://localhost:8000`  
📖 Documentación interactiva: `http://localhost:8000/docs`

### 5. Instalar dependencias del Frontend

Abre **otra terminal**:

```bash
cd frontend/
npm install
```

### 6. Iniciar el Frontend

```bash
npm run dev
```

✅ El dashboard quedará disponible en: `http://localhost:5173`

---

## 📌 Uso del Dashboard

### Cargar tu Excel

1. Ve a la sección **"Cargar Archivo Excel"**
2. Arrastra tu archivo `.xlsx` o haz clic para seleccionarlo
3. El sistema espera una hoja llamada **`CXP MARZO`**
4. Columnas requeridas (en cualquier orden):
   - `PROVEEDOR`, `FECHA`, `N° FACTURA`
   - `VALOR BASE`, `IVA`, `BASE+IVA`
   - `NOTAS CREDITO`, `RETENCION`, `VALOR A PAGAR`
   - `PAGO`, `SALDO`, `DIAS_MORA`

> ⚠️ El sistema **recalcula automáticamente** `SALDO = VALOR A PAGAR - PAGO`

### Filtros

- Usa el panel de filtros para combinar criterios
- Los filtros son **en tiempo real** y combinables entre sí
- Haz clic en **"Limpiar"** para resetear todos

### Agregar Registros Manuales

1. Haz clic en **"Agregar Registro Manual"**
2. Completa el formulario (los cálculos se hacen automáticamente)
3. Haz clic en **"Guardar Registro"**
4. El dashboard se actualiza inmediatamente

### Constructor (Drag & Drop)

- Ve a la pestaña **"Constructor"**
- Arrastra campos desde el panel izquierdo hacia las zonas:
  - **Filtros** — campos para filtrar
  - **Agrupación** — agrupar resultados
  - **Columnas** — seleccionar columnas
  - **Valores** — métricas a calcular

---

## 🔌 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/upload` | Sube el archivo Excel |
| `GET` | `/dashboard-data` | KPIs + gráficos + tabla (con filtros) |
| `POST` | `/add-record` | Agrega registro manual |
| `GET` | `/filters` | Opciones para los filtros |
| `GET` | `/status` | Estado del sistema |
| `DELETE` | `/clear-manual` | Limpia registros manuales |

### Parámetros de `/dashboard-data`

```
GET /dashboard-data?proveedor=Distribuidora&fecha_inicio=2024-03-01&dias_mora_min=30
```

---

## 🎨 Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite |
| Estilos | TailwindCSS 3 |
| Gráficos | Recharts |
| Drag & Drop | HTML5 nativo |
| Backend | Python + FastAPI |
| Datos | Pandas + openpyxl |

---

## 🐛 Solución de Problemas

**El frontend no conecta con el backend:**
- Verifica que el backend esté corriendo en el puerto 8000
- Revisa que no haya firewall bloqueando el puerto

**Error al leer el Excel:**
- Verifica que la hoja se llame exactamente `CXP MARZO`
- Asegúrate que las columnas tengan los nombres correctos

**Puerto 8000 ocupado:**
```bash
uvicorn main:app --reload --port 8001
# Y cambia el proxy en vite.config.js: target: 'http://localhost:8001'
```

---

## 📝 Notas

- Los datos del Excel se guardan en `data/uploads/cxp_data.xlsx`
- Los registros manuales se guardan en `data/uploads/manual_records.json`
- Ambos archivos persisten entre reinicios del servidor
