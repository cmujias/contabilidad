import React, { useState, useEffect, useCallback } from 'react'
import {
  CreditCard, Search, Plus, X, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, DollarSign, FileText, User,
  Trash2, Pencil, Save
} from 'lucide-react'
import {
  getPayments, addPayment, getInvoicesByProvider, getInvoiceLastRecord,
  getFilters, deletePayment, updatePayment
} from '../api'

const fmt = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0)

export default function PaymentsModule() {
  // Search state
  const [searchProv, setSearchProv] = useState('')
  const [searchFac, setSearchFac] = useState('')
  const [payments, setPayments] = useState([])
  const [loadingPayments, setLoadingPayments] = useState(false)

  // Add payment form
  const [showForm, setShowForm] = useState(false)
  const [proveedores, setProveedores] = useState([])
  const [facturas, setFacturas] = useState([])
  const [formProv, setFormProv] = useState('')
  const [formFac, setFormFac] = useState('')
  const [formPago, setFormPago] = useState('')
  const [formFecha, setFormFecha] = useState('')
  const [autoData, setAutoData] = useState(null)
  const [loadingAuto, setLoadingAuto] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState(null)

  // Provider search for form
  const [provSearch, setProvSearch] = useState('')
  const [showProvDropdown, setShowProvDropdown] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editPago, setEditPago] = useState('')
  const [editFecha, setEditFecha] = useState('')

  // Load proveedores on mount
  useEffect(() => {
    getFilters().then(res => {
      setProveedores(res.data.proveedores || [])
    }).catch(() => {})
  }, [])

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true)
    try {
      const res = await getPayments({
        proveedor: searchProv || undefined,
        factura: searchFac || undefined,
      })
      setPayments(res.data.payments || [])
    } catch {
      setPayments([])
    } finally {
      setLoadingPayments(false)
    }
  }, [searchProv, searchFac])

  useEffect(() => {
    const timer = setTimeout(() => fetchPayments(), 300)
    return () => clearTimeout(timer)
  }, [searchProv, searchFac, fetchPayments])

  // When provider selected in form, fetch their invoices
  useEffect(() => {
    if (!formProv) {
      setFacturas([])
      setFormFac('')
      setAutoData(null)
      return
    }
    getInvoicesByProvider(formProv).then(res => {
      setFacturas(res.data.invoices || [])
    }).catch(() => setFacturas([]))
  }, [formProv])

  // When both provider and invoice selected, auto-fill
  useEffect(() => {
    if (!formProv || !formFac) {
      setAutoData(null)
      return
    }
    setLoadingAuto(true)
    getInvoiceLastRecord(formProv, formFac).then(res => {
      setAutoData(res.data.data)
    }).catch(() => {
      setAutoData(null)
    }).finally(() => setLoadingAuto(false))
  }, [formProv, formFac])

  const handleSelectProv = (prov) => {
    setFormProv(prov)
    setProvSearch(prov)
    setShowProvDropdown(false)
    setFormFac('')
    setAutoData(null)
  }

  const filteredProveedores = proveedores.filter(p =>
    p.toLowerCase().includes(provSearch.toLowerCase())
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formProv || !formFac || !formPago) {
      setStatus({ type: 'error', msg: 'Completa todos los campos requeridos' })
      return
    }
    setSubmitting(true)
    setStatus(null)
    try {
      const res = await addPayment({
        proveedor: formProv,
        factura: formFac,
        pago_realizado: parseFloat(formPago) || 0,
        fecha: formFecha || '',
      })
      setStatus({ type: 'success', msg: res.data.message })
      setFormPago('')
      setFormFecha('')
      setAutoData(null)
      fetchPayments()
      if (formProv && formFac) {
        getInvoiceLastRecord(formProv, formFac).then(r => setAutoData(r.data.data)).catch(() => {})
      }
      setTimeout(() => setStatus(null), 3000)
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.detail || 'Error al registrar pago' })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Delete payment ────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este pago?')) return
    try {
      await deletePayment(id)
      setStatus({ type: 'success', msg: 'Pago eliminado exitosamente' })
      fetchPayments()
      setTimeout(() => setStatus(null), 3000)
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.detail || 'Error al eliminar' })
    }
  }

  // ─── Start editing ────────────────────────────────────────
  const startEdit = (p) => {
    setEditingId(p.id)
    setEditPago(String(p.pago_realizado || 0))
    setEditFecha(p.fecha || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditPago('')
    setEditFecha('')
  }

  // ─── Save edit ────────────────────────────────────────────
  const handleSaveEdit = async (id) => {
    try {
      const data = {}
      if (editPago) data.pago_realizado = parseFloat(editPago)
      if (editFecha) data.fecha = editFecha
      await updatePayment(id, data)
      setStatus({ type: 'success', msg: 'Pago actualizado exitosamente' })
      setEditingId(null)
      fetchPayments()
      setTimeout(() => setStatus(null), 3000)
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.detail || 'Error al actualizar' })
    }
  }

  const pagoNum = parseFloat(formPago) || 0
  const saldoResultante = autoData ? (autoData.saldo_pendiente - pagoNum) : 0

  return (
    <div className="space-y-6">
      {/* Status message (global) */}
      {status && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm animate-fade-up ${
          status.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
        }`}>
          {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {status.msg}
        </div>
      )}

      {/* Search Bar */}
      <div className="card p-5 animate-fade-up">
        <div className="flex items-center gap-2 mb-4">
          <Search size={16} className="text-blue-400" />
          <h3 className="section-title">Consultar Pagos</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Proveedor</label>
            <input type="text" className="input-field w-full" placeholder="Buscar por proveedor..."
              value={searchProv} onChange={e => setSearchProv(e.target.value)} />
          </div>
          <div>
            <label className="label">Factura</label>
            <input type="text" className="input-field w-full" placeholder="Buscar por factura..."
              value={searchFac} onChange={e => setSearchFac(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Add Payment CTA */}
      <div className="card animate-fade-up">
        <button className="w-full flex items-center justify-between p-5 text-left"
          onClick={() => setShowForm(o => !o)}>
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-emerald-400" />
            <h3 className="section-title">Añadir Pago</h3>
          </div>
          {showForm ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </button>

        {showForm && (
          <div className="px-5 pb-5 border-t border-slate-700/50">
            <form onSubmit={handleSubmit} className="mt-4 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Provider search */}
                <div className="relative">
                  <label className="label">Proveedor *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" className="input-field w-full pl-8" placeholder="Buscar proveedor..."
                      value={provSearch}
                      onChange={e => { setProvSearch(e.target.value); setShowProvDropdown(true); if (!e.target.value) setFormProv('') }}
                      onFocus={() => setShowProvDropdown(true)} />
                  </div>
                  {showProvDropdown && provSearch && filteredProveedores.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-2xl">
                      {filteredProveedores.slice(0, 20).map(p => (
                        <button key={p} type="button"
                          className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          onClick={() => handleSelectProv(p)}>{p}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invoice select */}
                <div>
                  <label className="label">Factura *</label>
                  <select className="select-field w-full" value={formFac}
                    onChange={e => setFormFac(e.target.value)} disabled={!formProv || facturas.length === 0}>
                    <option value="">
                      {!formProv ? 'Selecciona un proveedor primero' : facturas.length === 0 ? 'Sin facturas' : 'Seleccionar factura...'}
                    </option>
                    {facturas.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {/* Auto-fill data display */}
              {loadingAuto && (
                <div className="text-blue-400 text-sm flex items-center gap-2">
                  <RefreshCwSmall /> Cargando datos del último registro...
                </div>
              )}
              {autoData && (
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Datos automáticos del último registro</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    <InfoBox label="Valor Base (Saldo)" value={fmt(autoData.valor_base)} color="text-blue-300" />
                    <InfoBox label="IVA" value={fmt(autoData.iva)} color="text-slate-400" />
                    <InfoBox label="Base + IVA" value={fmt(autoData.base_iva)} color="text-slate-400" />
                    <InfoBox label="Notas Crédito" value={fmt(autoData.notas_credito)} color="text-slate-400" />
                    <InfoBox label="Retención" value={fmt(autoData.retencion)} color="text-slate-400" />
                    <InfoBox label="Días en Mora" value={`${autoData.dias_mora} días`} color={
                      autoData.dias_mora > 60 ? 'text-rose-400' : autoData.dias_mora > 30 ? 'text-amber-400' : 'text-slate-300'
                    } />
                  </div>
                </div>
              )}

              {/* Payment amount + date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Pago Realizado *</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input type="number" step="0.01" min="0" className="input-field w-full pl-8 text-emerald-300 font-medium"
                      placeholder="0" value={formPago} onChange={e => setFormPago(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Fecha del Pago</label>
                  <input type="date" className="input-field w-full"
                    value={formFecha} onChange={e => setFormFecha(e.target.value)} />
                </div>
                {autoData && (
                  <div>
                    <label className="label">Saldo Resultante</label>
                    <div className={`input-field w-full flex items-center font-bold text-lg ${
                      saldoResultante > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>{fmt(saldoResultante)}</div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-slate-700/50">
                <button type="submit" className="btn-primary" disabled={submitting}>
                  <CreditCard size={14} />
                  {submitting ? 'Registrando...' : 'Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Payments Table */}
      <div className="card animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-blue-400" />
            <h3 className="section-title">Registros de Pagos</h3>
          </div>
          <span className="text-slate-500 text-xs">{payments.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Proveedor', 'Factura', 'Fecha', 'Valor Base', 'Pago Realizado', 'Saldo Pendiente', 'Días Mora', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-600">
                    {loadingPayments ? 'Cargando...' : 'No hay pagos registrados'}
                  </td>
                </tr>
              ) : (
                payments.map((p, i) => (
                  <tr key={p.id || i} className="border-b border-slate-800/60 hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-200 max-w-[160px] truncate" title={p.proveedor}>{p.proveedor}</td>
                    <td className="px-4 py-3 font-mono text-blue-400 text-xs">{p.factura}</td>

                    {/* Fecha - editable */}
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {editingId === p.id ? (
                        <input type="date" className="input-field py-1 text-xs w-32"
                          value={editFecha} onChange={e => setEditFecha(e.target.value)} />
                      ) : p.fecha}
                    </td>

                    <td className="px-4 py-3 text-slate-300 text-right">{fmt(p.valor_base)}</td>

                    {/* Pago - editable */}
                    <td className="px-4 py-3 text-right">
                      {editingId === p.id ? (
                        <input type="number" step="0.01" className="input-field py-1 text-xs w-28 text-emerald-400 text-right"
                          value={editPago} onChange={e => setEditPago(e.target.value)} />
                      ) : (
                        <span className="text-emerald-400 font-medium">{fmt(p.pago_realizado)}</span>
                      )}
                    </td>

                    <td className={`px-4 py-3 font-medium text-right ${p.saldo_pendiente > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {fmt(p.saldo_pendiente)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-mono text-xs font-medium ${
                        p.dias_mora > 60 ? 'text-rose-400' : p.dias_mora > 30 ? 'text-amber-400' : 'text-slate-400'
                      }`}>{p.dias_mora}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-center">
                        {editingId === p.id ? (
                          <>
                            <button className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                              title="Guardar" onClick={() => handleSaveEdit(p.id)}>
                              <Save size={13} />
                            </button>
                            <button className="p-1.5 rounded-lg bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-colors"
                              title="Cancelar" onClick={cancelEdit}>
                              <X size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                              title="Editar" onClick={() => startEdit(p)}>
                              <Pencil size={13} />
                            </button>
                            <button className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                              title="Eliminar" onClick={() => handleDelete(p.id)}>
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function InfoBox({ label, value, color = 'text-slate-300' }) {
  return (
    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/30">
      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${color}`}>{value}</p>
    </div>
  )
}

function RefreshCwSmall() {
  return <span className="inline-block animate-spin"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></span>
}
