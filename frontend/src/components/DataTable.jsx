import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle, CheckCircle, DownloadCloud, Edit3, X } from 'lucide-react'
import { exportDataAPI, updateRecordByInvoice } from '../api'

const fmt = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0)

const COLUMNS = [
  { key: 'proveedor',    label: 'Proveedor',      sortable: true  },
  { key: 'factura',      label: 'Factura',         sortable: true  },
  { key: 'fecha',        label: 'Fecha',           sortable: true  },
  { key: 'valor_base',   label: 'Valor Base',      sortable: true,  currency: true },
  { key: 'iva',          label: 'IVA',             sortable: true,  currency: true },
  { key: 'retencion',    label: 'Retención',       sortable: true,  currency: true },
  { key: 'valor_pagar',  label: 'Valor a Pagar',   sortable: true,  currency: true },
  { key: 'base_iva',     label: 'Base + IVA',      sortable: true,  currency: true },
  { key: 'notas_credito',label: 'Notas Crédito',   sortable: true,  currency: true },
  { key: 'pago',         label: 'Pago',            sortable: true,  currency: true },
  { key: 'saldo',        label: 'Saldo',           sortable: true,  currency: true },
  { key: 'dias_mora',    label: 'Días Mora',       sortable: true  },
  { key: 'en_mora',      label: 'Estado',          sortable: false },
  { key: 'acciones',     label: 'Acciones',        sortable: false },
]

const PAGE_SIZES = [10, 25, 50, 100]

export default function DataTable({ records = [], onRefresh }) {
  const [sortKey, setSortKey] = useState('proveedor')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [editingRecord, setEditingRecord] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  const handleExport = async () => {
    try {
      const res = await exportDataAPI();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CXP_Backup_${new Date().toISOString().slice(0,10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error al exportar los datos", error);
      alert("Hubo un error al exportar la descarga.");
    }
  }

  const handleEditClick = (row) => {
    setEditingRecord(row)
    setEditForm({
      PROVEEDOR: row.proveedor,
      N_FACTURA: row.factura,
      FECHA: row.fecha,
      VALOR_BASE: row.valor_base,
      IVA: row.iva,
      RETENCION: row.retencion,
      NOTAS_CREDITO: row.notas_credito,
      PAGO: row.pago,
      DIAS_MORA: row.dias_mora,
      BASE_IVA: row.base_iva,
      VALOR_A_PAGAR: row.valor_pagar,
      SALDO: row.saldo,
    })
  }

  const updateEditForm = (k, v) => {
    setEditForm(prev => {
      const next = { ...prev, [k]: v }
      const base = parseFloat(next.VALOR_BASE) || 0
      const iva = parseFloat(next.IVA) || 0
      const ret = parseFloat(next.RETENCION) || 0
      const nc = parseFloat(next.NOTAS_CREDITO) || 0
      const pago = parseFloat(next.PAGO) || 0
      
      next.BASE_IVA = base + iva
      next.VALOR_A_PAGAR = next.BASE_IVA - ret - nc
      next.SALDO = next.VALOR_A_PAGAR - pago

      return next
    })
  }

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true)
      const payload = {
        PROVEEDOR: editForm.PROVEEDOR,
        FECHA: editForm.FECHA,
        N_FACTURA: editForm.N_FACTURA,
        VALOR_BASE: parseFloat(editForm.VALOR_BASE) || 0,
        IVA: parseFloat(editForm.IVA) || 0,
        RETENCION: parseFloat(editForm.RETENCION) || 0,
        NOTAS_CREDITO: parseFloat(editForm.NOTAS_CREDITO) || 0,
        PAGO: parseFloat(editForm.PAGO) || 0,
        DIAS_MORA: parseInt(editForm.DIAS_MORA) || 0,
      };
      await updateRecordByInvoice(editingRecord.proveedor, editingRecord.factura, payload)
      setEditingRecord(null)
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error(err)
      alert("Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const sorted = useMemo(() => {
    return [...records].sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey]
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [records, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <ChevronsUpDown size={12} className="text-slate-600" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-blue-400" />
      : <ChevronDown size={12} className="text-blue-400" />
  }

  const renderCell = (row, col) => {
    const val = row[col.key]
    switch (col.key) {
      case 'proveedor':
        return <td key={col.key} className="px-4 py-3 font-medium text-slate-200 max-w-[160px] truncate" title={val}>{val}</td>
      case 'factura':
        return <td key={col.key} className="px-4 py-3 font-mono text-blue-400 text-xs">{val || '—'}</td>
      case 'fecha':
        return <td key={col.key} className="px-4 py-3 text-slate-400 text-xs">{val || '—'}</td>
      case 'valor_base':
        return <td key={col.key} className="px-4 py-3 text-slate-300 text-right">{fmt(val)}</td>
      case 'iva':
        return <td key={col.key} className="px-4 py-3 text-slate-400 text-right">{fmt(val)}</td>
      case 'retencion':
        return <td key={col.key} className="px-4 py-3 text-orange-300 text-right">{fmt(val)}</td>
      case 'valor_pagar':
        return <td key={col.key} className="px-4 py-3 text-violet-300 font-medium text-right">{fmt(val)}</td>
      case 'base_iva':
        return <td key={col.key} className="px-4 py-3 text-cyan-300 text-right">{fmt(val)}</td>
      case 'notas_credito':
        return <td key={col.key} className="px-4 py-3 text-pink-300 text-right">{fmt(val)}</td>
      case 'pago':
        return <td key={col.key} className="px-4 py-3 text-emerald-400 text-right">{fmt(val)}</td>
      case 'saldo':
        return <td key={col.key} className={`px-4 py-3 font-medium text-right ${val > 0 ? 'text-amber-400' : 'text-slate-400'}`}>{fmt(val)}</td>
      case 'dias_mora':
        return (
          <td key={col.key} className="px-4 py-3 text-center">
            <span className={`font-mono text-xs font-medium ${
              val > 60 ? 'text-rose-400' : val > 30 ? 'text-amber-400' : 'text-slate-400'
            }`}>{val}</span>
          </td>
        )
      case 'en_mora':
        return (
          <td key={col.key} className="px-4 py-3 text-center">
            {val ? (
              <span className="tag-mora"><AlertTriangle size={10} /> Mora</span>
            ) : (
              <span className="tag-ok"><CheckCircle size={10} /> Al día</span>
            )}
          </td>
        )
      case 'acciones':
        return (
          <td key={col.key} className="px-4 py-3 text-center">
             <button onClick={() => handleEditClick(row)} className="text-blue-400 hover:text-blue-300 transition-colors" title="Editar Registro">
               <Edit3 size={14} />
             </button>
          </td>
        )
      default:
        return <td key={col.key} className="px-4 py-3 text-slate-300">{String(val)}</td>
    }
  }

  return (
    <div className="card animate-fade-up" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
        <h3 className="section-title">📋 Detalle de Facturas</h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport} 
            className="btn-primary py-1 px-3 text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500"
            title="Descargar copia de seguridad completa (Plantilla, Registros manuales y Pagos)"
          >
            <DownloadCloud size={14} /> Full Backup
          </button>
          <span className="text-slate-500 text-xs">{records.length} registros</span>
          <div className="flex items-center gap-2">
            <label className="label mb-0 text-slate-500">Mostrar:</label>
            <select
              className="select-field py-1 text-xs w-16"
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide whitespace-nowrap
                    ${col.sortable ? 'cursor-pointer hover:text-blue-400 select-none' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="text-center py-12 text-slate-600">
                  No hay registros que mostrar
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr
                  key={i}
                  className={`
                    border-b border-slate-800/60 transition-colors
                    ${row.en_mora
                      ? 'bg-rose-500/5 hover:bg-rose-500/10'
                      : 'hover:bg-slate-700/30'
                    }
                  `}
                >
                  {COLUMNS.map(col => renderCell(row, col))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/50">
          <span className="text-slate-500 text-xs">
            Página {page} de {totalPages} · {sorted.length} registros
          </span>
          <div className="flex gap-1">
            <button
              className="btn-secondary py-1 px-2 text-xs"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >«</button>
            <button
              className="btn-secondary py-1 px-2 text-xs"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p
              if (totalPages <= 5) p = i + 1
              else if (page <= 3) p = i + 1
              else if (page >= totalPages - 2) p = totalPages - 4 + i
              else p = page - 2 + i
              return (
                <button
                  key={p}
                  className={`py-1 px-3 text-xs rounded-lg transition-all ${
                    p === page
                      ? 'bg-blue-600 text-white'
                      : 'btn-secondary'
                  }`}
                  onClick={() => setPage(p)}
                >{p}</button>
              )
            })}
            <button
              className="btn-secondary py-1 px-2 text-xs"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >›</button>
            <button
              className="btn-secondary py-1 px-2 text-xs"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >»</button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingRecord && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 size={18} className="text-blue-400" /> Editar Registro
              </h2>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-rose-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh] custom-scroll">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Proveedor</label>
                  <input type="text" className="input-field w-full" value={editForm.PROVEEDOR || ''} onChange={e => updateEditForm('PROVEEDOR', e.target.value)} />
                </div>
                <div>
                  <label className="label">Número Factura</label>
                  <input type="text" className="input-field w-full" value={editForm.N_FACTURA || ''} onChange={e => updateEditForm('N_FACTURA', e.target.value)} />
                </div>
                <div>
                  <label className="label">Fecha</label>
                  <input type="date" className="input-field w-full" value={editForm.FECHA || ''} onChange={e => updateEditForm('FECHA', e.target.value)} />
                </div>
                <div>
                  <label className="label">Valor Base</label>
                  <input type="number" step="0.01" className="input-field w-full" value={editForm.VALOR_BASE === 0 ? 0 : editForm.VALOR_BASE || ''} onChange={e => updateEditForm('VALOR_BASE', e.target.value)} />
                </div>
                <div>
                  <label className="label">IVA</label>
                  <input type="number" step="0.01" className="input-field w-full" value={editForm.IVA === 0 ? 0 : editForm.IVA || ''} onChange={e => updateEditForm('IVA', e.target.value)} />
                </div>
                <div>
                  <label className="label">Base + IVA (Auto)</label>
                  <input type="number" className="input-field w-full bg-slate-900/40 text-slate-400" value={editForm.BASE_IVA === 0 ? 0 : editForm.BASE_IVA || ''} readOnly />
                </div>
                <div>
                  <label className="label">Retención</label>
                  <input type="number" step="0.01" className="input-field w-full" value={editForm.RETENCION === 0 ? 0 : editForm.RETENCION || ''} onChange={e => updateEditForm('RETENCION', e.target.value)} />
                </div>
                <div>
                  <label className="label">Notas Crédito</label>
                  <input type="number" step="0.01" className="input-field w-full" value={editForm.NOTAS_CREDITO === 0 ? 0 : editForm.NOTAS_CREDITO || ''} onChange={e => updateEditForm('NOTAS_CREDITO', e.target.value)} />
                </div>
                <div>
                  <label className="label">Valor a Pagar (Auto)</label>
                  <input type="number" className="input-field w-full bg-slate-900/40 text-violet-300 font-medium" value={editForm.VALOR_A_PAGAR === 0 ? 0 : editForm.VALOR_A_PAGAR || ''} readOnly />
                </div>
                <div>
                  <label className="label">Pago Realizado</label>
                  <input type="number" step="0.01" className="input-field w-full" value={editForm.PAGO === 0 ? 0 : editForm.PAGO || ''} onChange={e => updateEditForm('PAGO', e.target.value)} />
                </div>
                <div>
                  <label className="label">Saldo (Auto)</label>
                  <input type="number" className="input-field w-full bg-slate-900/40 text-amber-400 font-medium" value={editForm.SALDO === 0 ? 0 : editForm.SALDO || ''} readOnly />
                </div>
                <div>
                  <label className="label">Días Mora</label>
                  <input type="number" min="0" className="input-field w-full" value={editForm.DIAS_MORA === 0 ? 0 : editForm.DIAS_MORA || ''} onChange={e => updateEditForm('DIAS_MORA', e.target.value)} />
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-800 flex justify-end gap-3">
               <button onClick={() => setEditingRecord(null)} className="btn-secondary py-2 px-4">Cancelar</button>
               <button onClick={handleSaveEdit} disabled={isSaving} className="btn-primary py-2 px-6 flex items-center gap-2">
                 {isSaving ? 'Guardando...' : 'Guardar Cambios'}
               </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
