import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { PDFDocument } from 'pdf-lib'

export async function POST(request: NextRequest) {
  try {
    const { frenteHTML, versoHTML, nomeArquivo } = await request.json()

    // Inicia o browser com otimizações
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    })

    try {
      const page = await browser.newPage()
      
      // Configura viewport e otimizações
      await page.setViewport({ width: 950, height: 670 })
      await page.setCacheEnabled(false)
      
      // Gera PDF da frente com otimizações
      await page.setContent(frenteHTML, { waitUntil: 'domcontentloaded' })
      const pdfFrente = await page.pdf({
        printBackground: true,
        width: '950px',
        height: '670px',
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        preferCSSPageSize: true
      })
      
      // Gera PDF do verso com otimizações
      await page.setContent(versoHTML, { waitUntil: 'domcontentloaded' })
      const pdfVerso = await page.pdf({
        printBackground: true,
        width: '950px',
        height: '670px',
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        preferCSSPageSize: true
      })
      
      // Combina os PDFs em um só (igual ao script original)
      const pdfDoc = await PDFDocument.create()
      
      const pdfFrenteDoc = await PDFDocument.load(pdfFrente)
      const pdfVersoDoc = await PDFDocument.load(pdfVerso)
      
      const [frentePage] = await pdfDoc.copyPages(pdfFrenteDoc, [0])
      const [versoPage] = await pdfDoc.copyPages(pdfVersoDoc, [0])
      
      pdfDoc.addPage(frentePage)
      pdfDoc.addPage(versoPage)
      
      const pdfFinal = await pdfDoc.save()
      
      await browser.close()
      
      // Retorna o PDF como base64
      const pdfBase64 = Buffer.from(pdfFinal).toString('base64')
      
      return NextResponse.json({ 
        success: true, 
        pdfBase64,
        nomeArquivo 
      })
      
    } catch (error) {
      await browser.close()
      throw error
    }
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar PDF' },
      { status: 500 }
    )
  }
} 