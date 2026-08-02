'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { PoleaHistorico } from '@/lib/historico'

export function TrendChart({ polea }: { polea: PoleaHistorico }) {
  const data = polea.lecturas.map((lectura) => ({
    fecha: new Date(lectura.fecha).toLocaleDateString('es-PE'),
    izquierda: lectura.tempIzquierda,
    derecha: lectura.tempDerecha,
  }))

  return (
    <div className="rounded border bg-white p-3">
      <h3 className="mb-2 text-sm font-medium">
        Polea {polea.numero}{polea.tipo ? ` — ${polea.tipo}` : ''}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="fecha" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="izquierda" name="Lado izquierdo" stroke="#2563eb" />
          <Line type="monotone" dataKey="derecha" name="Lado derecho" stroke="#f97316" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
