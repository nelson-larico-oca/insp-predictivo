import type { Condicion } from '@prisma/client'

export interface DiagnosticoInput {
  numeroPolea: number
  tempIzquierda: number
  tempDerecha: number
  condicion: Condicion
}

export function buildDiagnosticoTexto(input: DiagnosticoInput): string {
  const { numeroPolea, tempIzquierda, tempDerecha, condicion } = input
  return (
    `Se efectuó inspección termográfica a las chumaceras de la polea ${numeroPolea}, ` +
    `no evidenciándose anomalías térmicas ni gradientes de temperatura fuera de los rangos operativos normales.\n\n` +
    `Temperatura de chumaceras:\n` +
    ` - Polea ${numeroPolea}: Chumacera lado izquierdo (${tempIzquierda.toFixed(1)}°C) ` +
    `Chumacera lado derecho (${tempDerecha.toFixed(1)}°C).\n\n` +
    `Observaciones: Condición ${condicion}.`
  )
}
