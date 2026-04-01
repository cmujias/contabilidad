import React, { useState } from 'react'
import { GripVertical, X, Plus, Layers } from 'lucide-react'

const ALL_FIELDS = [
  { id: 'proveedor',    label: 'Proveedor',      type: 'text'    },
  { id: 'fecha',        label: 'Fecha',          type: 'date'    },
  { id: 'factura',      label: 'Factura',        type: 'text'    },
  { id: 'valor_base',   label: 'Valor Base',     type: 'number'  },
  { id: 'iva',          label: 'IVA',            type: 'number'  },
  { id: 'retencion',    label: 'Retención',      type: 'number'  },
  { id: 'valor_pagar',  label: 'Valor a Pagar',  type: 'number'  },
  { id: 'base_iva',     label: 'Base + IVA',     type: 'number'  },
  { id: 'notas_credito',label: 'Notas Crédito',  type: 'number'  },
  { id: 'pago',         label: 'Pago',           type: 'number'  },
  { id: 'saldo',        label: 'Saldo',          type: 'number'  },
  { id: 'dias_mora',    label: 'Días Mora',      type: 'number'  },
]

const ZONES = [
  { id: 'filters',   label: 'Filtros',    color: 'blue',   icon: '🔽' },
  { id: 'group',     label: 'Agrupación', color: 'violet', icon: '📊' },
  { id: 'columns',   label: 'Columnas',   color: 'cyan',   icon: '📋' },
  { id: 'values',    label: 'Valores',    color: 'amber',  icon: '🔢' },
]

const zoneColors = {
  blue:   'border-blue-500/30 bg-blue-500/5',
  violet: 'border-violet-500/30 bg-violet-500/5',
  cyan:   'border-cyan-500/30 bg-cyan-500/5',
  amber:  'border-amber-500/30 bg-amber-500/5',
}

const zoneTextColors = {
  blue: 'text-blue-400', violet: 'text-violet-400',
  cyan: 'text-cyan-400', amber: 'text-amber-400',
}

const tagColors = {
  blue: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
  violet: 'bg-violet-500/20 border-violet-500/30 text-violet-300',
  cyan: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
  amber: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
}

export default function DragDropPanel() {
  const [zones, setZones] = useState({ filters: [], group: [], columns: [], values: [] })
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const usedFields = Object.values(zones).flat().map(f => f.id)
  const availableFields = ALL_FIELDS.filter(f => !usedFields.includes(f.id))

  const handleDragStart = (e, field, fromZone = null) => {
    setDragging({ field, fromZone })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, zoneId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(zoneId)
  }

  const handleDrop = (e, zoneId) => {
    e.preventDefault()
    if (!dragging) return

    const { field, fromZone } = dragging

    setZones(prev => {
      const next = { ...prev }
      // Quitar del origen si venía de una zona
      if (fromZone) {
        next[fromZone] = next[fromZone].filter(f => f.id !== field.id)
      }
      // Agregar a la zona destino si no está ya
      if (!next[zoneId].find(f => f.id === field.id)) {
        next[zoneId] = [...next[zoneId], field]
      }
      return next
    })

    setDragging(null)
    setDragOver(null)
  }

  const handleDragEnd = () => {
    setDragging(null)
    setDragOver(null)
  }

  const removeFromZone = (zoneId, fieldId) => {
    setZones(prev => ({
      ...prev,
      [zoneId]: prev[zoneId].filter(f => f.id !== fieldId),
    }))
  }

  const addToZone = (field, zoneId) => {
    if (!zones[zoneId].find(f => f.id === field.id)) {
      setZones(prev => ({ ...prev, [zoneId]: [...prev[zoneId], field] }))
    }
  }

  return (
    <div className="card p-5 animate-fade-up">
      <div className="flex items-center gap-2 mb-5">
        <Layers size={16} className="text-violet-400" />
        <h3 className="section-title">Panel de Campos — Estilo PowerBI</h3>
        <span className="text-slate-500 text-xs">Arrastra campos hacia las zonas</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Panel izquierdo: campos disponibles */}
        <div className="lg:col-span-1">
          <p className="label mb-2 text-slate-500">Campos disponibles</p>
          <div className="space-y-1.5 min-h-[160px] p-3 rounded-lg border border-slate-700/50 bg-slate-900/40">
            {availableFields.length === 0 ? (
              <p className="text-slate-600 text-xs text-center pt-4">Todos los campos están en uso</p>
            ) : (
              availableFields.map(field => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={e => handleDragStart(e, field)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
                             cursor-grab active:cursor-grabbing hover:border-blue-500/40 hover:bg-slate-700
                             transition-all group text-xs"
                >
                  <GripVertical size={12} className="text-slate-600 group-hover:text-slate-400 flex-shrink-0" />
                  <span className="text-slate-300 flex-1">{field.label}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {ZONES.map(z => (
                      <button
                        key={z.id}
                        onClick={() => addToZone(field, z.id)}
                        title={`Agregar a ${z.label}`}
                        className={`p-0.5 rounded text-xs ${zoneTextColors[z.color]} hover:bg-slate-600`}
                      >
                        <Plus size={9} />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zonas de drop */}
        <div className="lg:col-span-4 grid grid-cols-2 xl:grid-cols-4 gap-3">
          {ZONES.map(zone => (
            <div
              key={zone.id}
              onDragOver={e => handleDragOver(e, zone.id)}
              onDrop={e => handleDrop(e, zone.id)}
              onDragLeave={() => setDragOver(null)}
              className={`
                rounded-xl border-2 border-dashed p-3 min-h-[120px] transition-all duration-200
                ${zoneColors[zone.color]}
                ${dragOver === zone.id ? 'scale-[1.02] border-opacity-60' : 'border-opacity-30'}
              `}
            >
              <p className={`text-xs font-semibold uppercase tracking-wide ${zoneTextColors[zone.color]} mb-2`}>
                {zone.icon} {zone.label}
              </p>
              <div className="space-y-1.5">
                {zones[zone.id].length === 0 ? (
                  <p className="text-slate-600 text-xs text-center py-2">Arrastra aquí</p>
                ) : (
                  zones[zone.id].map(field => (
                    <div
                      key={field.id}
                      draggable
                      onDragStart={e => handleDragStart(e, field, zone.id)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-xs border
                                  cursor-grab active:cursor-grabbing ${tagColors[zone.color]}
                                  hover:opacity-80 transition-opacity`}
                    >
                      <div className="flex items-center gap-1.5">
                        <GripVertical size={10} className="opacity-60" />
                        {field.label}
                      </div>
                      <button
                        onClick={() => removeFromZone(zone.id, field.id)}
                        className="opacity-60 hover:opacity-100 ml-1"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
