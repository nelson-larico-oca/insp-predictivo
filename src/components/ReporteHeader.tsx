import type { ReporteConDetalle } from '@/lib/types'
import { CONDICION_COLORS } from '@/lib/condicion'

export function ReporteHeader({ reporte }: { reporte: ReporteConDetalle }) {
  const { faja } = reporte
  return (
    <div className="rounded border bg-white">
      <div className="flex flex-col gap-3 border-b bg-blue-900 p-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold">REPORTE DETALLADO {faja.tag}</h1>
        <div className="flex items-center gap-4">
          {faja.cliente.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={faja.cliente.logoUrl} alt={faja.cliente.nombre} className="h-8 bg-white p-1" />
          )}
          {faja.contratista.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={faja.contratista.logoUrl} alt={faja.contratista.nombre} className="h-8 bg-white p-1" />
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 p-4 text-sm sm:grid-cols-2">
        <p><strong>Cliente:</strong> {faja.cliente.nombre}</p>
        <p><strong>Lugar:</strong> {faja.lugar}</p>
        <p><strong>Fecha monitoreo:</strong> {new Date(reporte.fecha).toLocaleDateString('es-PE')}</p>
        <p><strong>Sistema:</strong> {faja.tag}</p>
        <p><strong>Supervisor:</strong> {reporte.supervisor}</p>
        <p><strong>Componentes:</strong> CHUMACERAS</p>
        <p><strong>Especialista:</strong> {reporte.especialista}</p>
        <p><strong>Nº Aviso SAP:</strong> {reporte.numeroAvisoSAP}</p>
      </div>
      <div className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm">{reporte.observacionGeneral}</span>
        <span
          className="inline-block w-fit rounded px-3 py-1 text-sm font-semibold text-white"
          style={{ backgroundColor: CONDICION_COLORS[reporte.condicionGeneral] }}
        >
          CONDICIÓN: {reporte.condicionGeneral}
        </span>
      </div>
    </div>
  )
}
