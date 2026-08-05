import type { ReporteConDetalle } from '@/lib/types'

type Lectura = ReporteConDetalle['lecturas'][number]

export function PoleaDiagnosticoBlock({ lectura }: { lectura: Lectura }) {
  return (
    <div className="rounded border bg-white">
      <div className="bg-blue-900 p-2 text-sm font-semibold text-white">
        DIAGNÓSTICO POLEA {String(lectura.polea.numero).padStart(2, '0')}
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        <p className="whitespace-pre-line text-sm">{lectura.diagnosticoTexto}</p>
        <div className="grid grid-cols-2 gap-2">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lectura.fotoIzquierdaUrl} alt="Termograma izquierda" className="w-full rounded" />
            <figcaption className="text-center text-xs">Izquierda — {lectura.tempIzquierda}°C</figcaption>
          </figure>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lectura.fotoDerechaUrl} alt="Termograma derecha" className="w-full rounded" />
            <figcaption className="text-center text-xs">Derecha — {lectura.tempDerecha}°C</figcaption>
          </figure>
        </div>
      </div>
    </div>
  )
}
