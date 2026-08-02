'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { Condicion } from '@prisma/client'
import type { FajaConDetalle } from '@/server/actions/fajas'
import { ImageUploader } from '@/components/ImageUploader'
import { createReporte } from '@/server/actions/reportes'
import { buildDiagnosticoTexto } from '@/lib/diagnosticoTemplate'

interface LecturaFormState {
  tempIzquierda: string
  tempDerecha: string
  fotoIzquierdaUrl?: string
  fotoDerechaUrl?: string
  condicion: Condicion
  diagnosticoTexto: string
}

const CONDICIONES: Condicion[] = ['NORMAL', 'TOLERABLE', 'PRECAUCION', 'CRITICO']

function isLecturaCompleta(lectura: LecturaFormState): boolean {
  return Boolean(lectura.tempIzquierda && lectura.tempDerecha && lectura.fotoIzquierdaUrl && lectura.fotoDerechaUrl)
}

export function ReporteForm({ faja }: { faja: FajaConDetalle }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [especialista, setEspecialista] = useState('')
  const [supervisor, setSupervisor] = useState('')
  const [numeroAvisoSAP, setNumeroAvisoSAP] = useState('')
  const [observacionGeneral, setObservacionGeneral] = useState('Equipo sin indicaciones')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [lecturas, setLecturas] = useState<Record<string, LecturaFormState>>(
    Object.fromEntries(
      faja.poleas.map((polea) => [
        polea.id,
        { tempIzquierda: '', tempDerecha: '', condicion: 'NORMAL' as Condicion, diagnosticoTexto: '' },
      ])
    )
  )

  const completadas = useMemo(
    () => faja.poleas.filter((polea) => isLecturaCompleta(lecturas[polea.id])).length,
    [faja.poleas, lecturas]
  )

  function updateLectura(poleaId: string, patch: Partial<LecturaFormState>) {
    setLecturas((prev) => {
      const next = { ...prev[poleaId], ...patch }
      const tempIzquierda = Number(next.tempIzquierda)
      const tempDerecha = Number(next.tempDerecha)
      if (next.tempIzquierda && next.tempDerecha && !patch.diagnosticoTexto) {
        const polea = faja.poleas.find((p) => p.id === poleaId)!
        next.diagnosticoTexto = buildDiagnosticoTexto({
          numeroPolea: polea.numero,
          tempIzquierda,
          tempDerecha,
          condicion: next.condicion,
        })
      }
      return { ...prev, [poleaId]: next }
    })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await createReporte({
        fajaId: faja.id,
        fecha: new Date(fecha),
        especialista,
        supervisor,
        numeroAvisoSAP,
        observacionGeneral,
        createdByUserId: (session?.user as { id?: string } | undefined)?.id ?? '',
        lecturas: faja.poleas.map((polea) => {
          const l = lecturas[polea.id]
          return {
            poleaId: polea.id,
            tempIzquierda: Number(l.tempIzquierda),
            tempDerecha: Number(l.tempDerecha),
            fotoIzquierdaUrl: l.fotoIzquierdaUrl ?? '',
            fotoDerechaUrl: l.fotoDerechaUrl ?? '',
            condicion: l.condicion,
            diagnosticoTexto: l.diagnosticoTexto,
          }
        }),
      })
      router.push(`/fajas/${faja.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el reporte')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="sticky top-0 z-10 flex items-center justify-between rounded border bg-white/95 p-3 text-sm shadow-sm backdrop-blur">
        <span className="font-medium text-gray-700">
          Progreso: {completadas} de {faja.poleas.length} poleas completas
        </span>
        <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${(completadas / faja.poleas.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded border bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">Fecha</span>
          <input type="date" className="w-full rounded border px-3 py-2" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">Nº Aviso SAP</span>
          <input className="w-full rounded border px-3 py-2" value={numeroAvisoSAP} onChange={(e) => setNumeroAvisoSAP(e.target.value)} required />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">Especialista</span>
          <input className="w-full rounded border px-3 py-2" value={especialista} onChange={(e) => setEspecialista(e.target.value)} required />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">Supervisor</span>
          <input className="w-full rounded border px-3 py-2" value={supervisor} onChange={(e) => setSupervisor(e.target.value)} required />
        </label>
        <label className="col-span-2 text-sm">
          <span className="mb-1 block text-gray-600">Observación general</span>
          <input className="w-full rounded border px-3 py-2" value={observacionGeneral} onChange={(e) => setObservacionGeneral(e.target.value)} />
        </label>
      </div>

      {faja.poleas.map((polea) => {
        const lectura = lecturas[polea.id]
        const completa = isLecturaCompleta(lectura)
        return (
          <div
            key={polea.id}
            className={`space-y-3 rounded border bg-white p-4 transition ${completa ? 'border-green-300' : ''}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Polea {polea.numero}{polea.tipo ? ` — ${polea.tipo}` : ''}</h3>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${completa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {completa ? '✓ Completo' : 'Pendiente'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">Temp. izquierda (°C)</span>
                <input
                  type="number" step="0.1"
                  className="w-full rounded border px-3 py-2"
                  value={lectura.tempIzquierda}
                  onChange={(e) => updateLectura(polea.id, { tempIzquierda: e.target.value })}
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">Temp. derecha (°C)</span>
                <input
                  type="number" step="0.1"
                  className="w-full rounded border px-3 py-2"
                  value={lectura.tempDerecha}
                  onChange={(e) => updateLectura(polea.id, { tempDerecha: e.target.value })}
                  required
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">Condición</span>
              <select
                className="rounded border px-3 py-2"
                value={lectura.condicion}
                onChange={(e) => updateLectura(polea.id, { condicion: e.target.value as Condicion })}
              >
                {CONDICIONES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <ImageUploader
                folder={`insp-predictivo/reportes/${faja.tag}`}
                value={lectura.fotoIzquierdaUrl}
                onUploaded={(url) => updateLectura(polea.id, { fotoIzquierdaUrl: url })}
                label="Foto izquierda"
              />
              <ImageUploader
                folder={`insp-predictivo/reportes/${faja.tag}`}
                value={lectura.fotoDerechaUrl}
                onUploaded={(url) => updateLectura(polea.id, { fotoDerechaUrl: url })}
                label="Foto derecha"
              />
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">Diagnóstico</span>
              <textarea
                className="w-full rounded border px-3 py-2"
                rows={4}
                value={lectura.diagnosticoTexto}
                onChange={(e) => updateLectura(polea.id, { diagnosticoTexto: e.target.value })}
              />
            </label>
          </div>
        )
      })}

      {error && <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Guardando...' : 'Guardar reporte'}
      </button>
    </form>
  )
}
