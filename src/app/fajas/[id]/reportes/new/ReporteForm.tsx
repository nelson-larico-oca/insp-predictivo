'use client'

import { useState } from 'react'
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
      <div className="grid grid-cols-2 gap-3 rounded border bg-white p-4">
        <input type="date" className="rounded border px-3 py-2" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        <input className="rounded border px-3 py-2" placeholder="Nº Aviso SAP" value={numeroAvisoSAP} onChange={(e) => setNumeroAvisoSAP(e.target.value)} required />
        <input className="rounded border px-3 py-2" placeholder="Especialista" value={especialista} onChange={(e) => setEspecialista(e.target.value)} required />
        <input className="rounded border px-3 py-2" placeholder="Supervisor" value={supervisor} onChange={(e) => setSupervisor(e.target.value)} required />
        <input className="col-span-2 rounded border px-3 py-2" placeholder="Observación general" value={observacionGeneral} onChange={(e) => setObservacionGeneral(e.target.value)} />
      </div>

      {faja.poleas.map((polea) => {
        const lectura = lecturas[polea.id]
        return (
          <div key={polea.id} className="space-y-3 rounded border bg-white p-4">
            <h3 className="font-medium">Polea {polea.numero}{polea.tipo ? ` — ${polea.tipo}` : ''}</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number" step="0.1"
                className="rounded border px-3 py-2"
                placeholder="Temp. izquierda (°C)"
                value={lectura.tempIzquierda}
                onChange={(e) => updateLectura(polea.id, { tempIzquierda: e.target.value })}
                required
              />
              <input
                type="number" step="0.1"
                className="rounded border px-3 py-2"
                placeholder="Temp. derecha (°C)"
                value={lectura.tempDerecha}
                onChange={(e) => updateLectura(polea.id, { tempDerecha: e.target.value })}
                required
              />
            </div>
            <select
              className="rounded border px-3 py-2"
              value={lectura.condicion}
              onChange={(e) => updateLectura(polea.id, { condicion: e.target.value as Condicion })}
            >
              {CONDICIONES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
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
            <textarea
              className="w-full rounded border px-3 py-2"
              rows={4}
              value={lectura.diagnosticoTexto}
              onChange={(e) => updateLectura(polea.id, { diagnosticoTexto: e.target.value })}
            />
          </div>
        )
      })}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
        {submitting ? 'Guardando...' : 'Guardar reporte'}
      </button>
    </form>
  )
}
