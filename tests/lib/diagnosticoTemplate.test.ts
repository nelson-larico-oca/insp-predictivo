import { describe, it, expect } from 'vitest'
import { buildDiagnosticoTexto } from '../../src/lib/diagnosticoTemplate'

describe('buildDiagnosticoTexto', () => {
  it('fills in the polea number, temperatures and condicion', () => {
    const texto = buildDiagnosticoTexto({
      numeroPolea: 3,
      tempIzquierda: 17.4,
      tempDerecha: 20.7,
      condicion: 'BUENO',
    })
    expect(texto).toContain('polea 3')
    expect(texto).toContain('17.4°C')
    expect(texto).toContain('20.7°C')
    expect(texto).toContain('Condición BUENO')
  })
})
