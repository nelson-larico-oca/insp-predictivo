import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import puppeteer from 'puppeteer'
import { authOptions } from '@/lib/auth'
import { generatePrintToken } from '@/lib/printToken'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000'
  const token = generatePrintToken(params.id)
  const printUrl = `${baseUrl}/reportes/${params.id}/print?token=${token}`

  const browser = await puppeteer.launch({ headless: true })
  try {
    const page = await browser.newPage()
    const response = await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 30000 })
    if (!response || !response.ok()) {
      throw new Error('No se pudo cargar la vista de impresión del reporte')
    }
    await page.waitForSelector('#print-ready', { timeout: 30000 })
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-${params.id}.pdf"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar el PDF' },
      { status: 500 }
    )
  } finally {
    await browser.close()
  }
}
