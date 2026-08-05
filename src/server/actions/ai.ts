'use server'

import { generateText, Output, NoObjectGeneratedError } from 'ai'
import { z } from 'zod'
import { requireUser } from '@/lib/session'
import type { Condicion, CriterioAceptacion } from '@prisma/client'

const AnalisisSchema = z.object({
  tempIzquierda: z.number(),
  tempDerecha: z.number(),
  condicion: z.enum(['BUENO', 'ACEPTABLE', 'INSATISFACTORIO', 'INACEPTABLE']),
  diagnosticoTexto: z.string(),
})

export interface AnalizarTermogramaInput {
  numeroPolea: number
  fotoIzquierdaUrl: string
  fotoDerechaUrl: string
  criterios: Pick<CriterioAceptacion, 'nivel' | 'tempMin' | 'tempMax' | 'deltaMin' | 'deltaMax'>[]
}

export interface AnalisisTermograma {
  tempIzquierda: number
  tempDerecha: number
  condicion: Condicion
  diagnosticoTexto: string
}

export async function analizarTermograma(input: AnalizarTermogramaInput): Promise<AnalisisTermograma> {
  await requireUser()

  const criteriosTexto = input.criterios
    .map((c) => `- ${c.nivel}: temperatura ${c.tempMin}–${c.tempMax}°C, delta entre chumaceras ${c.deltaMin}–${c.deltaMax}°C`)
    .join('\n')

  try {
    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-5',
      output: Output.object({ schema: AnalisisSchema }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                `Eres un especialista en termografía industrial revisando chumaceras de fajas transportadoras. ` +
                `Te comparto dos fotos de termograma de la polea ${input.numeroPolea}: chumacera lado izquierdo y chumacera lado derecho. ` +
                `Cada cámara térmica imprime la lectura de temperatura directamente sobre la imagen — léela con precisión, no la estimes por el color.\n\n` +
                `Criterios de aceptación de esta faja:\n${criteriosTexto}\n\n` +
                `Responde con:\n` +
                `- tempIzquierda y tempDerecha: la temperatura exacta (°C) leída en cada foto.\n` +
                `- condicion: el nivel que corresponde según los criterios de arriba, usando la temperatura más alta entre ambas lecturas y el delta entre ellas.\n` +
                `- diagnosticoTexto: un diagnóstico breve en español, técnico y directo, mencionando ambas temperaturas y la condición resultante.`,
            },
            { type: 'text', text: 'Foto chumacera izquierda:' },
            { type: 'file', mediaType: 'image', data: input.fotoIzquierdaUrl },
            { type: 'text', text: 'Foto chumacera derecha:' },
            { type: 'file', mediaType: 'image', data: input.fotoDerechaUrl },
          ],
        },
      ],
    })
    return output
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error('La IA no pudo leer la temperatura de las imágenes. Intenta de nuevo o ingresa los valores manualmente.')
    }
    throw error
  }
}

export interface GenerarObservacionInput {
  lecturas: { numeroPolea: number; tempIzquierda: number; tempDerecha: number; condicion: Condicion }[]
}

export async function generarObservacionGeneral(input: GenerarObservacionInput): Promise<string> {
  await requireUser()
  if (input.lecturas.length === 0) {
    throw new Error('Completa al menos una lectura antes de generar la observación')
  }

  const resumen = input.lecturas
    .map((l) => `Polea ${l.numeroPolea}: chumacera izquierda ${l.tempIzquierda}°C, chumacera derecha ${l.tempDerecha}°C, condición ${l.condicion}`)
    .join('\n')

  const { text } = await generateText({
    model: 'anthropic/claude-haiku-4.5',
    prompt:
      `Eres un especialista en termografía industrial. Con estas lecturas de todas las poleas de una faja transportadora, ` +
      `escribe la observación general del reporte de inspección: 1 o 2 oraciones, en español, técnicas y directas.\n` +
      `Si todas las condiciones son BUENO, la observación debe ser exactamente "Equipo sin indicaciones".\n` +
      `Si alguna polea tiene condición ACEPTABLE, INSATISFACTORIO o INACEPTABLE, menciona qué polea(s) y qué se recomienda hacer.\n\n` +
      `Lecturas:\n${resumen}`,
  })
  return text.trim()
}
