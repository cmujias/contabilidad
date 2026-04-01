import React from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle, FileText,
  Shield, Receipt, CreditCard
} from 'lucide-react'

const fmt = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0)

const KPICard = ({ title, value, icon: Icon, color, subtitle, isCurrency = true, delay = 0 }) => {
  const colors = {
    blue:    { bg: 'from-blue-500/10 to-blue-600/5',    border: 'border-blue-500/30',    text: 'text-blue-400',    glow: 'shadow-glow-blue' },
    emerald: { bg: 'from-emerald-500/10 to-emerald-600/5', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-glow-emerald' },
    rose:    { bg: 'from-rose-500/10 to-rose-600/5',    border: 'border-rose-500/30',    text: 'text-rose-400',    glow: 'shadow-glow-rose' },
    amber:   { bg: 'from-amber-500/10 to-amber-600/5',  border: 'border-amber-500/30',  text: 'text-amber-400',  glow: '' },
    violet:  { bg: 'from-violet-500/10 to-violet-600/5', border: 'border-violet-500/30', text: 'text-violet-400', glow: '' },
    cyan:    { bg: 'from-cyan-500/10 to-cyan-600/5',    border: 'border-cyan-500/30',    text: 'text-cyan-400',    glow: '' },
    orange:  { bg: 'from-orange-500/10 to-orange-600/5', border: 'border-orange-500/30', text: 'text-orange-400', glow: '' },
    pink:    { bg: 'from-pink-500/10 to-pink-600/5',    border: 'border-pink-500/30',    text: 'text-pink-400',    glow: '' },
    teal:    { bg: 'from-teal-500/10 to-teal-600/5',    border: 'border-teal-500/30',    text: 'text-teal-400',    glow: '' },
  }
  const c = colors[color] || colors.blue

  return (
    <div
      className={`kpi-card bg-gradient-to-br ${c.bg} border ${c.border} animate-fade-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Icono decorativo de fondo */}
      <div className="absolute right-4 top-4 opacity-5">
        <Icon size={56} />
      </div>

      <div className="relative z-10">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-3">{title}</p>
        <p className={`font-display font-bold text-2xl ${c.text} leading-none mb-2`}>
          {isCurrency ? fmt(value) : value?.toLocaleString('es-CO') || '0'}
        </p>
        {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
      </div>

      {/* Borde glow inferior */}
      <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent ${c.text} opacity-30`} />
    </div>
  )
}

export default function KPICards({ kpis }) {
  if (!kpis) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 animate-stagger">
      <KPICard
        title="Valor Base Total"
        value={kpis.total_valor_base}
        icon={DollarSign}
        color="blue"
        delay={0}
      />
      <KPICard
        title="Total IVA"
        value={kpis.total_iva}
        icon={TrendingUp}
        color="cyan"
        delay={50}
      />
      <KPICard
        title="Total Retención"
        value={kpis.total_retencion}
        icon={Shield}
        color="orange"
        delay={100}
      />
      <KPICard
        title="Total a Pagar"
        value={kpis.total_valor_pagar}
        icon={FileText}
        color="violet"
        delay={150}
      />
      <KPICard
        title="Base + IVA"
        value={kpis.total_base_iva}
        icon={Receipt}
        color="teal"
        delay={200}
      />
      <KPICard
        title="Notas Crédito"
        value={kpis.total_notas_credito}
        icon={CreditCard}
        color="pink"
        delay={250}
      />
      <KPICard
        title="Total Pagado"
        value={kpis.total_pagado}
        icon={CheckCircle}
        color="emerald"
        subtitle={`${kpis.porcentaje_pagado}% del total`}
        delay={300}
      />
      <KPICard
        title="Saldo Pendiente"
        value={kpis.saldo_total}
        icon={TrendingDown}
        color="amber"
        delay={350}
      />
      <KPICard
        title="Facturas en Mora"
        value={kpis.facturas_mora}
        icon={AlertTriangle}
        color="rose"
        isCurrency={false}
        subtitle={`de ${kpis.total_facturas} facturas`}
        delay={400}
      />
    </div>
  )
}
