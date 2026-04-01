import React, { useState } from 'react'
import { Plus, X, CheckCircle, AlertCircle } from 'lucide-react'
import { addRecord } from '../api'

const INITIAL = {
  PROVEEDOR: '', FECHA: '', N_FACTURA: '',
  VALOR_BASE: '', IVA: '', BASE_IVA: '', NOTAS_CREDITO: '',
  RETENCION: '', VALOR_A_PAGAR: '', PAGO: '', DIAS_MORA: '0',
}

export default function AddRecordForm({ onSuccess }) {
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // 'success' | 'error'
  const [open, setOpen] = useState(false)

  const update = (k, v) => {
    setForm(prev => {
      const next = { ...prev, [k]: v }
      // Auto-calcular BASE+IVA
      if (k === 'VALOR_BASE' || k === 'IVA') {
        const base = parseFloat(k === 'VALOR_BASE' ? v : next.VALOR_BASE) || 0
        const iva = parseFloat(k === 'IVA' ? v : next.IVA) || 0
        next.BASE_IVA = String(base + iva)
      }
      // Auto-calcular VALOR A PAGAR
      if (['VALOR_BASE', 'IVA', 'NOTAS_CREDITO', 'RETENCION'].includes(k)) {
        const base = parseFloat(next.VALOR_BASE) || 0
        const iva  = parseFloat(next.IVA) || 0
        const nc   = parseFloat(next.NOTAS_CREDITO) || 0
        const ret  = parseFloat(next.RETENCION) || 0
        next.VALOR_A_PAGAR = String(base + iva - nc - ret)
      }
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.PROVEEDOR.trim()) {
      setStatus('error')
      return
    }

    setLoading(true)
    setStatus(null)
    try {
      const payload = {
        PROVEEDOR: form.PROVEEDOR,
        FECHA: form.FECHA,
        N_FACTURA: form.N_FACTURA,
        VALOR_BASE:     parseFloat(form.VALOR_BASE)     || 0,
        IVA:            parseFloat(form.IVA)            || 0,
        BASE_IVA:       parseFloat(form.BASE_IVA)       || 0,
        NOTAS_CREDITO:  parseFloat(form.NOTAS_CREDITO)  || 0,
        RETENCION:      parseFloat(form.RETENCION)      || 0,
        VALOR_A_PAGAR:  parseFloat(form.VALOR_A_PAGAR)  || 0,
        PAGO:           parseFloat(form.PAGO)           || 0,
        DIAS_MORA:      parseInt(form.DIAS_MORA)        || 0,
      }
      await addRecord(payload)
      setStatus('success')
      setForm(INITIAL)
      setTimeout(() => { setStatus(null); setOpen(false); onSuccess?.() }, 1500)
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card animate-fade-up">
      {/* Header / toggle */}
      <button
        className="w-full flex items-center justify-between p-5 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <Plus size={16} className="text-blue-400" />
          <h3 className="section-title">Agregar Registro Manual</h3>
        </div>
        <span className={`text-slate-500 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>
          <Plus size={18} />
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-700/50">
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Proveedor */}
              <div className="lg:col-span-2">
                <label className="label">Proveedor *</label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="Nombre del proveedor"
                  value={form.PROVEEDOR}
                  onChange={e => update('PROVEEDOR', e.target.value)}
                  required
                />
              </div>

              {/* Factura */}
              <div>
                <label className="label">N° Factura</label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="FAC-001"
                  value={form.N_FACTURA}
                  onChange={e => update('N_FACTURA', e.target.value)}
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="label">Fecha</label>
                <input
                  type="date"
                  className="input-field w-full"
                  value={form.FECHA}
                  onChange={e => update('FECHA', e.target.value)}
                />
              </div>

              {/* Valor Base */}
              <div>
                <label className="label">Valor Base</label>
                <input type="number" step="0.01" className="input-field w-full" placeholder="0"
                  value={form.VALOR_BASE} onChange={e => update('VALOR_BASE', e.target.value)} />
              </div>

              {/* IVA */}
              <div>
                <label className="label">IVA</label>
                <input type="number" step="0.01" className="input-field w-full" placeholder="0"
                  value={form.IVA} onChange={e => update('IVA', e.target.value)} />
              </div>

              {/* BASE+IVA */}
              <div>
                <label className="label">Base + IVA (auto)</label>
                <input type="number" step="0.01" className="input-field w-full bg-slate-900/40"
                  value={form.BASE_IVA} readOnly />
              </div>

              {/* Notas Crédito */}
              <div>
                <label className="label">Notas Crédito</label>
                <input type="number" step="0.01" className="input-field w-full" placeholder="0"
                  value={form.NOTAS_CREDITO} onChange={e => update('NOTAS_CREDITO', e.target.value)} />
              </div>

              {/* Retención */}
              <div>
                <label className="label">Retención</label>
                <input type="number" step="0.01" className="input-field w-full" placeholder="0"
                  value={form.RETENCION} onChange={e => update('RETENCION', e.target.value)} />
              </div>

              {/* Valor a Pagar */}
              <div>
                <label className="label">Valor a Pagar (auto)</label>
                <input type="number" step="0.01" className="input-field w-full bg-slate-900/40"
                  value={form.VALOR_A_PAGAR} readOnly />
              </div>

              {/* Pago */}
              <div>
                <label className="label">Pago Realizado</label>
                <input type="number" step="0.01" className="input-field w-full" placeholder="0"
                  value={form.PAGO} onChange={e => update('PAGO', e.target.value)} />
              </div>

              {/* Días Mora */}
              <div>
                <label className="label">Días en Mora</label>
                <input type="number" min="0" className="input-field w-full" placeholder="0"
                  value={form.DIAS_MORA} onChange={e => update('DIAS_MORA', e.target.value)} />
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-700/50">
              <div>
                {status === 'success' && (
                  <span className="flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle size={16} /> Registro guardado exitosamente
                  </span>
                )}
                {status === 'error' && (
                  <span className="flex items-center gap-2 text-rose-400 text-sm">
                    <AlertCircle size={16} /> Error al guardar. Verifica los datos.
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setForm(INITIAL); setStatus(null) }}
                >
                  <X size={14} /> Limpiar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  <Plus size={14} />
                  {loading ? 'Guardando...' : 'Guardar Registro'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
