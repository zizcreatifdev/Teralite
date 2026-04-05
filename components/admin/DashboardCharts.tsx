'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface VentesPoint {
  date: string
  montant: number
}

interface RepartitionPoint {
  nom: string
  valeur: number
  couleur: string
}

interface Props {
  ventesData: VentesPoint[]
  repartitionData: RepartitionPoint[]
}

type Periode = '7j' | '30j' | '3m'

const formatDateLabel = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

const formatMontantK = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)

export default function DashboardCharts({ ventesData, repartitionData }: Props) {
  const [periode, setPeriode] = useState<Periode>('7j')

  const maintenant = new Date()
  const filteredVentes = ventesData.filter((p) => {
    const d = new Date(p.date)
    const diffJours = (maintenant.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    if (periode === '7j') return diffJours <= 7
    if (periode === '30j') return diffJours <= 30
    return diffJours <= 90
  })

  const totalVentes = filteredVentes.reduce((s, p) => s + p.montant, 0)
  const totalCommandes = repartitionData.reduce((s, p) => s + p.valeur, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Graphique ventes */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-border-main p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-main">Ventes</h2>
            <p className="text-xs text-text-light mt-0.5">
              {totalVentes.toLocaleString('fr-SN')} F sur la période
            </p>
          </div>
          <div className="flex gap-1 bg-gray-fond rounded-lg p-1">
            {(['7j', '30j', '3m'] as Periode[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriode(p)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                  periode === p
                    ? 'bg-blue-teralite text-white'
                    : 'text-text-mid hover:text-text-main'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {filteredVentes.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm text-text-light">Aucune vente sur cette période</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={filteredVentes} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                tick={{ fontSize: 11, fill: '#888' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatMontantK}
                tick={{ fontSize: 11, fill: '#888' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString('fr-SN') + ' F', 'Ventes']}
                labelFormatter={formatDateLabel}
                contentStyle={{
                  border: '1px solid #E5E5E5',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="montant"
                stroke="#004880"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#004880' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Donut répartition paiements */}
      <div className="bg-white rounded-xl border border-border-main p-5">
        <h2 className="text-sm font-semibold text-text-main mb-1">Répartition paiements</h2>
        <p className="text-xs text-text-light mb-4">{totalCommandes} commandes au total</p>

        {repartitionData.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm text-text-light text-center">Aucune commande</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={repartitionData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                dataKey="valeur"
                nameKey="nom"
                paddingAngle={2}
              >
                {repartitionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.couleur} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [value, name]}
                contentStyle={{ border: '1px solid #E5E5E5', borderRadius: 8, fontSize: 12 }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
