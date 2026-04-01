import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { getChartDataCustom } from '../api'

const fmt = (n) =>
  new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0)

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16', '#ec4899']
const MORA_COLORS = ['#10b981', '#f43f5e']

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid rgba(59,130,246,0.3)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={tooltipStyle} className="p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

const ChartCard = ({ title, children }) => (
  <div className="card p-5 animate-fade-up">
    <h3 className="section-title mb-5">{title}</h3>
    {children}
  </div>
)

// Gráfico 1: Pagos por proveedor
export function PagosPorProveedorChart({ data }) {
  if (!data?.length) return <ChartCard title="Pagos por Proveedor"><EmptyState /></ChartCard>
  return (
    <ChartCard title="💰 Pagos por Proveedor (Top 10)">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 0, right: 10, bottom: 60, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
          <XAxis
            dataKey="proveedor"
            tick={{ fill: '#64748b', fontSize: 10 }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={fmt} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="pago" name="Pago" fill="#3b82f6" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// Gráfico 2: Saldo pendiente por proveedor
export function SaldoPorProveedorChart({ data }) {
  if (!data?.length) return <ChartCard title="Saldo por Proveedor"><EmptyState /></ChartCard>
  return (
    <ChartCard title="⏳ Saldo Pendiente por Proveedor (Top 10)">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={fmt} />
          <YAxis type="category" dataKey="proveedor" tick={{ fill: '#94a3b8', fontSize: 10 }} width={75} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="saldo" name="Saldo" fill="#f59e0b" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={`hsl(${30 + i * 15}, 90%, 55%)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// Gráfico 3: Pagos por fecha
export function PagosPorFechaChart({ data }) {
  if (!data?.length) return <ChartCard title="Pagos por Fecha"><EmptyState /></ChartCard>
  const formatted = data.map(d => ({ ...d, fecha: d.fecha?.slice(0, 7) || d.fecha }))
  return (
    <ChartCard title="📅 Evolución de Pagos por Fecha">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={formatted} margin={{ top: 0, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
          <XAxis dataKey="fecha" tick={{ fill: '#64748b', fontSize: 10 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={fmt} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="pago"
            name="Pago"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#10b981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// Gráfico 4: Distribución mora
export function DistribucionMoraChart({ data }) {
  if (!data?.length) return <ChartCard title="Distribución Mora"><EmptyState /></ChartCard>
  const total = data.reduce((s, d) => s + d.cantidad, 0)
  return (
    <ChartCard title="🔴 Distribución Facturas en Mora">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="cantidad"
            nameKey="categoria"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={45}
            paddingAngle={3}
            label={({ categoria, cantidad }) =>
              `${categoria}: ${((cantidad / total) * 100).toFixed(1)}%`
            }
            labelLine={{ stroke: '#475569', strokeWidth: 1 }}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={MORA_COLORS[i % MORA_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0]
              return (
                <div style={tooltipStyle} className="p-3">
                  <p style={{ color: d.payload.fill }} className="font-medium">{d.name}</p>
                  <p className="text-slate-300">{d.value} facturas</p>
                </div>
              )
            }}
          />
          <Legend
            formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// Gráfico 5: Variable personalizable
const VARIABLE_OPTIONS = [
  { value: 'valor_base',   label: 'Valor Base' },
  { value: 'iva',          label: 'IVA' },
  { value: 'retencion',    label: 'Retención' },
  { value: 'base_iva',     label: 'Base + IVA' },
  { value: 'notas_credito',label: 'Notas Crédito' },
  { value: 'valor_pagar',  label: 'Valor a Pagar' },
  { value: 'pago',         label: 'Pago' },
  { value: 'saldo',        label: 'Saldo' },
  { value: 'dias_mora',    label: 'Días Mora' },
]

const VAR_COLORS = {
  valor_base: '#3b82f6',
  iva: '#06b6d4',
  retencion: '#f97316',
  base_iva: '#14b8a6',
  notas_credito: '#ec4899',
  valor_pagar: '#8b5cf6',
  pago: '#10b981',
  saldo: '#f59e0b',
  dias_mora: '#f43f5e',
}

export function CustomVariableChart() {
  const [variable, setVariable] = useState('saldo')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getChartDataCustom(variable)
      .then(res => setData(res.data.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [variable])

  const label = VARIABLE_OPTIONS.find(o => o.value === variable)?.label || variable
  const barColor = VAR_COLORS[variable] || '#3b82f6'

  return (
    <div className="card p-5 animate-fade-up">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title">📊 Gráfico Personalizado por Proveedor</h3>
        <div className="flex items-center gap-2">
          <label className="label mb-0 text-slate-500">Variable:</label>
          <select
            className="select-field py-1.5 text-xs w-40"
            value={variable}
            onChange={e => setVariable(e.target.value)}
          >
            {VARIABLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-blue-400 text-sm">Cargando datos...</p>
        </div>
      ) : data.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 0, right: 10, bottom: 70, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
            <XAxis
              dataKey="proveedor"
              tick={{ fill: '#64748b', fontSize: 10 }}
              angle={-40}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={fmt} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="valor" name={label} fill={barColor} radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={`${barColor}${i === 0 ? '' : Math.max(40, 100 - i * 6).toString(16)}`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="h-64 flex items-center justify-center">
      <p className="text-slate-600 text-sm">Sin datos para mostrar</p>
    </div>
  )
}
