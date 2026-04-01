import React from 'react'
import { Search, Filter, X, RotateCcw } from 'lucide-react'

export default function Filters({ filters, setFilters, filterOptions, onReset }) {
  const update = (key, val) => setFilters(prev => ({ ...prev, [key]: val }))

  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'Todos')

  return (
    <div className="card p-5 animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-blue-400" />
          <h3 className="section-title">Filtros Dinámicos</h3>
          {hasActiveFilters && (
            <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-500/30">
              Activos
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button className="btn-secondary py-1 px-3 text-xs" onClick={onReset}>
            <RotateCcw size={12} /> Limpiar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Búsqueda rápida */}
        <div className="sm:col-span-2 xl:col-span-2">
          <label className="label">🔍 Búsqueda Rápida</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              className="input-field w-full pl-8"
              placeholder="Proveedor o factura..."
              value={filters.search || ''}
              onChange={e => update('search', e.target.value)}
            />
            {filters.search && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                onClick={() => update('search', '')}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Proveedor */}
        <div>
          <label className="label">Proveedor</label>
          <select
            className="select-field w-full"
            value={filters.proveedor || 'Todos'}
            onChange={e => update('proveedor', e.target.value)}
          >
            <option value="Todos">Todos</option>
            {(filterOptions?.proveedores || []).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Fecha inicio */}
        <div>
          <label className="label">Fecha Inicio</label>
          <input
            type="date"
            className="input-field w-full"
            value={filters.fecha_inicio || ''}
            onChange={e => update('fecha_inicio', e.target.value)}
          />
        </div>

        {/* Fecha fin */}
        <div>
          <label className="label">Fecha Fin</label>
          <input
            type="date"
            className="input-field w-full"
            value={filters.fecha_fin || ''}
            onChange={e => update('fecha_fin', e.target.value)}
          />
        </div>

        {/* Días mora mínimos */}
        <div>
          <label className="label">Días Mora Mín.</label>
          <input
            type="number"
            className="input-field w-full"
            placeholder="0"
            min="0"
            value={filters.dias_mora_min || ''}
            onChange={e => update('dias_mora_min', e.target.value ? Number(e.target.value) : '')}
          />
        </div>
      </div>

      {/* Tags de filtros activos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700/50">
          <span className="text-slate-500 text-xs self-center">Filtros activos:</span>
          {filters.search && (
            <FilterTag label={`Búsqueda: "${filters.search}"`} onRemove={() => update('search', '')} />
          )}
          {filters.proveedor && filters.proveedor !== 'Todos' && (
            <FilterTag label={`Proveedor: ${filters.proveedor}`} onRemove={() => update('proveedor', 'Todos')} />
          )}
          {filters.fecha_inicio && (
            <FilterTag label={`Desde: ${filters.fecha_inicio}`} onRemove={() => update('fecha_inicio', '')} />
          )}
          {filters.fecha_fin && (
            <FilterTag label={`Hasta: ${filters.fecha_fin}`} onRemove={() => update('fecha_fin', '')} />
          )}
          {filters.dias_mora_min && (
            <FilterTag label={`Mora ≥ ${filters.dias_mora_min} días`} onRemove={() => update('dias_mora_min', '')} />
          )}
        </div>
      )}
    </div>
  )
}

function FilterTag({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full px-3 py-1 text-xs">
      {label}
      <button onClick={onRemove} className="hover:text-blue-100 ml-1">
        <X size={10} />
      </button>
    </span>
  )
}
