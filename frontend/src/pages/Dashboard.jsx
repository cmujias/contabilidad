import React, { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, RefreshCw, AlertTriangle, Wifi, WifiOff,
  BarChart2, Table, Settings, CreditCard, Shield, LogOut, Building, User
} from 'lucide-react'
import KPICards from '../components/KPICards'
import Filters from '../components/Filters'
import DataTable from '../components/DataTable'
import DragDropPanel from '../components/DragDropPanel'
import AddRecordForm from '../components/AddRecordForm'
import UploadExcel from '../components/UploadExcel'
import UploadHistory from '../components/UploadHistory'
import PaymentsModule from '../components/PaymentsModule'
import AdminPanel from '../components/AdminPanel'
import {
  PagosPorProveedorChart,
  SaldoPorProveedorChart,
  PagosPorFechaChart,
  DistribucionMoraChart,
  CustomVariableChart,
} from '../components/Charts'
import { getDashboardData, getFilters, getEmpresasAPI } from '../api'

const EMPTY_FILTERS = {
  search: '', proveedor: 'Todos', fecha_inicio: '', fecha_fin: '',
  factura: '', dias_mora_min: '',
}

export default function Dashboard({ authData, setAuthData }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [data, setData]           = useState(null)
  const [filterOptions, setFilterOptions] = useState({ proveedores: [], facturas: [] })
  const [filters, setFilters]     = useState(EMPTY_FILTERS)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Admin states
  const [globalEmpresas, setGlobalEmpresas] = useState([])
  const [selectedEmpresaId, setSelectedEmpresaId] = useState(authData?.user?.empresa_id || '')
  
  const isAdmin = authData?.user?.role === 'admin'

  const RAW_NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard',    icon: LayoutDashboard },
    { id: 'charts',    label: 'Gráficos',     icon: BarChart2        },
    { id: 'table',     label: 'Tabla',        icon: Table            },
    { id: 'payments',  label: 'Pagos',        icon: CreditCard       },
    { id: 'builder',   label: 'Constructor',  icon: Settings         },
    ...(isAdmin ? [{ id: 'admin', label: 'Panel Admin', icon: Shield }] : [])
  ]

  const userModules = authData?.user?.modules || ["dashboard", "charts", "table", "payments", "builder"];
  
  const NAV_ITEMS = RAW_NAV_ITEMS.filter(item => {
      if (isAdmin) return true;
      if (item.id === 'admin') return false;
      return userModules.includes(item.id);
  });

  // Cargar lista de empresas si es admin
  useEffect(() => {
    if (isAdmin) {
      getEmpresasAPI().then(res => {
        setGlobalEmpresas(res.data.empresas || [])
        if (!selectedEmpresaId && res.data.empresas?.length > 0) {
           setSelectedEmpresaId(res.data.empresas[0].id)
           localStorage.setItem("empresa_id", res.data.empresas[0].id)
        }
      }).catch(console.error)
    }
  }, [isAdmin])

  // Cargar datos del dashboard
  const fetchData = useCallback(async (activeFilters = filters) => {
    // Si no hay empresa seleccionada y es admin, espera
    if (isAdmin && !selectedEmpresaId) return;

    setLoading(true)
    setError(null)
    try {
      const res = await getDashboardData(activeFilters)
      setData(res.data)
      setLastUpdated(new Date())
    } catch (err) {
      setError('Error al consultar datos backend.')
    } finally {
      setLoading(false)
    }
  }, [filters, selectedEmpresaId, isAdmin])

  // Cargar opciones de filtros
  const fetchFilters = useCallback(async () => {
    if (isAdmin && !selectedEmpresaId) return;
    try {
      const res = await getFilters()
      setFilterOptions(res.data)
    } catch {}
  }, [selectedEmpresaId, isAdmin])

  // Carga inicial y cambio de empresa
  useEffect(() => {
    fetchData(EMPTY_FILTERS)
    fetchFilters()
  }, [selectedEmpresaId])

  // Re-fetch cuando cambian filtros locales
  useEffect(() => {
    const timer = setTimeout(() => fetchData(filters), 300)
    return () => clearTimeout(timer)
  }, [filters])

  const handleReset = () => {
    setFilters(EMPTY_FILTERS)
  }

  const handleDataChange = () => {
    fetchData(filters)
    fetchFilters()
  }
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("username");
    localStorage.removeItem("empresa_id");
    setAuthData({ isAuthenticated: false, user: null })
  }

  const handleEmpresaChange = (e) => {
    const newVal = e.target.value;
    setSelectedEmpresaId(newVal);
    localStorage.setItem("empresa_id", newVal);
    handleReset();
  }

  const charts = data?.charts || {}
  const kpis   = data?.kpis   || {}
  const records = data?.records || []

  return (
    <div className="min-h-screen bg-slate-950 bg-grid">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-slate-900/95 border-r border-slate-800/80 
                        backdrop-blur-sm z-30 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 
                            flex items-center justify-center shadow-glow-blue">
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-sm tracking-tight leading-none">
                Dashboard CXP
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">Cuentas por Pagar</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-5 py-4 border-b border-slate-800/60 text-sm flex justify-between items-center text-slate-300">
           <div className="flex items-center gap-2">
             <User size={14} className="text-blue-400" />
             <span className="font-semibold">{authData?.user?.username}</span>
           </div>
           <button onClick={handleLogout} className="text-rose-400 hover:text-rose-300 transition-colors" title="Cerrar sesión">
            <LogOut size={16} />
           </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                            font-medium transition-all duration-200 text-left
                            ${active
                              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                            }`}
              >
                <Icon size={16} className={active ? 'text-blue-400' : ''} />
                {item.label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Status panel en sidebar */}
        <div className="px-4 py-4 border-t border-slate-800/60">
          <div className={`flex items-center gap-2 text-xs ${error ? 'text-rose-400' : 'text-emerald-400'}`}>
            {error ? <WifiOff size={12} /> : <Wifi size={12} />}
            {error ? 'Sin conexión' : 'Backend conectado'}
          </div>
          {lastUpdated && (
            <p className="text-slate-600 text-xs mt-1">
              {lastUpdated.toLocaleTimeString('es-CO')}
            </p>
          )}
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────── */}
      <main className="ml-60 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800/60 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-white text-xl tracking-tight">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {data?.total_records ?? 0} registros visualizados
            </p>
          </div>

          <div className="flex items-center gap-3">
             {/* Admin: Selector de Empresa Global */}
             {isAdmin && activeTab !== 'admin' && (
               <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden h-9 mr-2">
                 <div className="pl-3 pr-2 py-2 bg-slate-800/50 text-slate-400">
                    <Building size={14} />
                 </div>
                 <select 
                   className="bg-transparent border-none text-slate-200 text-sm focus:ring-0 w-44 py-0 h-full"
                   value={selectedEmpresaId}
                   onChange={handleEmpresaChange}
                 >
                   {globalEmpresas.map(emp => (
                     <option key={emp.id} value={emp.id} className="bg-slate-900 text-white">{emp.name}</option>
                   ))}
                 </select>
               </div>
             )}

            {/* Error indicator o loading */}
            {loading && (
              <div className="flex items-center gap-2 text-blue-400 text-xs mr-2">
                <RefreshCw size={13} className="animate-spin" />
                Actualizando...
              </div>
            )}

            {/* Refresh button */}
            <button
              className="btn-secondary py-1.5 px-3"
              onClick={() => handleDataChange()}
              disabled={loading || (isAdmin && !selectedEmpresaId)}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refrescar
            </button>
          </div>
        </header>

        {/* Error banner */}
        {error && activeTab !== 'admin' && (
          <div className="mx-8 mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl 
                          text-rose-300 text-sm flex items-start gap-3">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error de comunicación</p>
              <p className="text-rose-400/80 text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="px-8 py-6 space-y-6">

          {/* ── TAB: PANEL ADMIN ────────────────────────── */}
          {activeTab === 'admin' && isAdmin && (
            <AdminPanel />
          )}

          {/* ── TAB: DASHBOARD ──────────────────────────── */}
          {activeTab === 'dashboard' && (
            <>
              {/* Carga de Excel */}
              <UploadExcel onSuccess={handleDataChange} />

              {/* Historial de cargues */}
              <UploadHistory onSuccess={handleDataChange} />

              {/* Filtros */}
              <Filters
                filters={filters}
                setFilters={setFilters}
                filterOptions={filterOptions}
                onReset={handleReset}
              />

              {/* KPIs */}
              <KPICards kpis={kpis} />

              {/* Gráficos principales (2x2) */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <PagosPorProveedorChart data={charts.pagos_por_proveedor} />
                <SaldoPorProveedorChart data={charts.saldo_por_proveedor} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <PagosPorFechaChart data={charts.pagos_por_fecha} />
                <DistribucionMoraChart data={charts.distribucion_mora} />
              </div>

              {/* Tabla resumida (primeros 50) */}
              <DataTable records={records.slice(0, 50)} onRefresh={handleDataChange} />

              {/* Formulario agregar */}
              <AddRecordForm onSuccess={handleDataChange} />
            </>
          )}

          {/* ── TAB: GRÁFICOS ───────────────────────────── */}
          {activeTab === 'charts' && (
            <>
              <Filters
                filters={filters}
                setFilters={setFilters}
                filterOptions={filterOptions}
                onReset={handleReset}
              />
              <KPICards kpis={kpis} />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <PagosPorProveedorChart data={charts.pagos_por_proveedor} />
                <SaldoPorProveedorChart data={charts.saldo_por_proveedor} />
                <PagosPorFechaChart data={charts.pagos_por_fecha} />
                <DistribucionMoraChart data={charts.distribucion_mora} />
              </div>
              <CustomVariableChart />
            </>
          )}

          {/* ── TAB: TABLA ──────────────────────────────── */}
          {activeTab === 'table' && (
            <>
              <Filters
                filters={filters}
                setFilters={setFilters}
                filterOptions={filterOptions}
                onReset={handleReset}
              />
              <DataTable records={records} onRefresh={handleDataChange} />
              <AddRecordForm onSuccess={handleDataChange} />
            </>
          )}

          {/* ── TAB: PAGOS ──────────────────────────────── */}
          {activeTab === 'payments' && (
            <PaymentsModule />
          )}

          {/* ── TAB: CONSTRUCTOR ────────────────────────── */}
          {activeTab === 'builder' && (
            <>
              <div className="card p-5 bg-gradient-to-br from-violet-500/5 to-blue-500/5 
                              border-violet-500/20">
                <h3 className="section-title text-violet-300 mb-1">Constructor de Vistas</h3>
                <p className="text-slate-500 text-xs">
                  Arrastra campos desde el panel izquierdo hacia las zonas para personalizar tu análisis.
                </p>
              </div>
              <DragDropPanel />
              <UploadExcel onSuccess={handleDataChange} />
              <AddRecordForm onSuccess={handleDataChange} />
            </>
          )}

        </div>
      </main>
    </div>
  )
}
