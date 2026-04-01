import React, { useState, useEffect, useRef } from 'react'
import { Clock, FileSpreadsheet, RefreshCw, Upload, ChevronDown, ChevronUp } from 'lucide-react'
import { getUploadHistory, reUpload } from '../api'

export default function UploadHistory({ onSuccess }) {
  const [history, setHistory] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reuploadId, setReuploadId] = useState(null)
  const [result, setResult] = useState(null)
  const inputRef = useRef()

  const fetchHistory = async () => {
    try {
      const res = await getUploadHistory()
      setHistory(res.data.history || [])
    } catch {}
  }

  useEffect(() => { fetchHistory() }, [])

  const handleReUpload = async (file) => {
    if (!file || !reuploadId) return
    setLoading(true)
    setResult(null)
    try {
      const res = await reUpload(reuploadId, file)
      setResult({ success: true, message: res.data.message })
      fetchHistory()
      onSuccess?.()
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.detail || 'Error al re-cargar' })
    } finally {
      setLoading(false)
      setReuploadId(null)
    }
  }

  const triggerReUpload = (id) => {
    setReuploadId(id)
    inputRef.current?.click()
  }

  if (history.length === 0) return null

  return (
    <div className="card animate-fade-up">
      <button
        className="w-full flex items-center justify-between p-5 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-violet-400" />
          <h3 className="section-title">Historial de Cargues</h3>
          <span className="bg-violet-500/20 text-violet-400 text-xs px-2 py-0.5 rounded-full border border-violet-500/30">
            {history.length}
          </span>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={e => handleReUpload(e.target.files[0])}
      />

      {open && (
        <div className="px-5 pb-5 border-t border-slate-700/50">
          {result && (
            <div className={`flex items-center gap-2 mt-3 p-3 rounded-lg text-sm ${
              result.success
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
            }`}>
              {result.message}
            </div>
          )}

          <div className="mt-4 space-y-2">
            {history.map((entry, i) => (
              <div
                key={entry.id || i}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-700/40 
                           hover:border-slate-600/60 transition-all"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={16} className="text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-slate-200 text-sm font-medium">{entry.filename}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-slate-500 text-xs">
                        {new Date(entry.uploaded_at).toLocaleString('es-CO')}
                      </span>
                      <span className="text-slate-600 text-xs">•</span>
                      <span className="text-slate-500 text-xs">{entry.rows} registros</span>
                      {entry.updated && (
                        <>
                          <span className="text-slate-600 text-xs">•</span>
                          <span className="text-amber-400/70 text-xs">Actualizado</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="btn-secondary py-1.5 px-3 text-xs"
                  onClick={() => triggerReUpload(entry.id)}
                  disabled={loading}
                >
                  <RefreshCw size={12} className={loading && reuploadId === entry.id ? 'animate-spin' : ''} />
                  Re-cargar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
