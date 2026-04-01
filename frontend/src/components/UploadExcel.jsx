import React, { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react'
import { uploadExcel } from '../api'

export default function UploadExcel({ onSuccess }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // { success, message }
  const inputRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      setResult({ success: false, message: 'Solo se permiten archivos Excel (.xlsx, .xls)' })
      return
    }
    setFile(f)
    setResult(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)
    try {
      const res = await uploadExcel(file)
      setResult({ success: true, message: res.data.message })
      onSuccess?.()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al cargar el archivo'
      setResult({ success: false, message: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5 animate-fade-up">
      <div className="flex items-center gap-2 mb-4">
        <FileSpreadsheet size={16} className="text-emerald-400" />
        <h3 className="section-title">Cargar Archivo Excel</h3>
        <span className="text-slate-500 text-xs">Hoja: "CXP MARZO"</span>
      </div>

      {/* Zona de drop */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${dragging
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
            : file
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-slate-700 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-800/40'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />

        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileSpreadsheet size={32} className="text-emerald-400" />
            <p className="text-slate-200 font-medium">{file.name}</p>
            <p className="text-slate-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
            <button
              className="text-slate-500 hover:text-rose-400 text-xs flex items-center gap-1 mt-1"
              onClick={e => { e.stopPropagation(); setFile(null); setResult(null) }}
            >
              <X size={12} /> Quitar archivo
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={32} className="text-slate-600" />
            <p className="text-slate-400 font-medium">Arrastra tu Excel aquí</p>
            <p className="text-slate-600 text-xs">o haz clic para seleccionar</p>
            <p className="text-slate-700 text-xs mt-1">.xlsx / .xls</p>
          </div>
        )}
      </div>

      {/* Botón de carga */}
      {file && (
        <button
          className="btn-primary w-full justify-center mt-3"
          onClick={handleUpload}
          disabled={loading}
        >
          <Upload size={16} />
          {loading ? 'Procesando Excel...' : 'Cargar y Procesar Excel'}
        </button>
      )}

      {/* Resultado */}
      {result && (
        <div className={`flex items-start gap-2 mt-3 p-3 rounded-lg text-sm
          ${result.success
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
          }`}
        >
          {result.success
            ? <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
            : <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          }
          <div className="whitespace-pre-wrap font-medium">{result.message}</div>
        </div>
      )}
    </div>
  )
}
