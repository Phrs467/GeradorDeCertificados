import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { PDFDocument } from 'pdf-lib'
import { readFileSync } from 'fs'
import { join } from 'path'

// Função para converter imagem para base64
function converterImagemParaBase64(caminhoImagem: string): string {
  try {
    const imagemBuffer = readFileSync(caminhoImagem)
    const base64 = imagemBuffer.toString('base64')
    const extensao = caminhoImagem.split('.').pop()?.toLowerCase()
    return `data:image/${extensao};base64,${base64}`
  } catch (error) {
    console.error('Erro ao converter imagem para base64:', error)
    return ''
  }
}

export async function POST(request: NextRequest) {
  try {
    const { frenteHTML, versoHTML, nomeArquivo } = await request.json()
    
    console.log('📄 Gerando PDF para:', nomeArquivo)
    console.log(' Tamanho do HTML da frente:', frenteHTML?.length || 'undefined')
    console.log(' Tamanho do HTML do verso:', versoHTML?.length || 'undefined')
    
    // Validação dos dados de entrada
    if (!frenteHTML || !versoHTML) {
      console.error('❌ HTML da frente ou verso está vazio')
      return NextResponse.json(
        { success: false, error: 'HTML da frente ou verso está vazio' },
        { status: 400 }
      )
    }

    // Converte as imagens para base64
    const caminhoImagem1 = join(process.cwd(), 'imgs', 'ri_1.jpeg')
    const caminhoImagem2 = join(process.cwd(), 'imgs', 'ri_2.png')
    
    try {
      const imagem1Base64 = converterImagemParaBase64(caminhoImagem1)
      const imagem2Base64 = converterImagemParaBase64(caminhoImagem2)
      
      if (!imagem1Base64 || !imagem2Base64) {
        console.error('❌ Erro ao converter imagens para base64')
        return NextResponse.json(
          { success: false, error: 'Erro ao converter imagens para base64' },
          { status: 500 }
        )
      }
      
      // Substitui os caminhos das imagens por base64 nos HTMLs
      const frenteHTMLComImagens = frenteHTML
        .replace(
          "background: url('../imgs/ri_1.jpeg') no-repeat center center;",
          `background: url('${imagem1Base64}') no-repeat center center;`
        )
        .replace(
          'src="../imgs/ri_2.png"',
          `src="${imagem2Base64}"`
        )
      
      const versoHTMLComImagens = versoHTML
        .replace(
          "background: url('../imgs/ri_1.jpeg') no-repeat center center;",
          `background: url('${imagem1Base64}') no-repeat center center;`
        )

      console.log('✅ Imagens convertidas e HTMLs processados')

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
        
        // Configura viewport e otimizações para modo paisagem
        await page.setViewport({ width: 1600, height: 1200 })
        await page.setCacheEnabled(false)
        
        console.log('🌐 Browser iniciado, gerando PDF da frente...')
        
        // Gera PDF da frente com otimizações
        await page.setContent(frenteHTMLComImagens, { waitUntil: 'domcontentloaded' })
        
        const pdfFrente = await page.pdf({
          printBackground: true,
          format: 'A4',
          landscape: true,
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
          preferCSSPageSize: false
        })
        
        console.log('✅ PDF da frente gerado, tamanho:', pdfFrente.length, 'bytes')
        
        // Gera PDF do verso com otimizações
        console.log('🌐 Gerando PDF do verso...')
        await page.setContent(versoHTMLComImagens, { waitUntil: 'domcontentloaded' })
        const pdfVerso = await page.pdf({
          printBackground: true,
          format: 'A4',
          landscape: true,
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
          preferCSSPageSize: false
        })
        
        console.log('✅ PDF do verso gerado, tamanho:', pdfVerso.length, 'bytes')
        
        // Combina os PDFs em um só
        console.log(' Combinando PDFs...')
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
        console.log('📄 PDF final gerado com sucesso - Tamanho:', pdfFinal.length, 'bytes')
        
        return NextResponse.json({ 
          success: true, 
          pdfBase64,
          nomeArquivo 
        })
        
      } catch (error) {
        await browser.close()
        console.error('❌ Erro na geração do PDF:', error)
        throw error
      }
      
    } catch (error) {
      console.error('❌ Erro ao converter imagens:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao converter imagens' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('❌ Erro geral ao gerar PDF:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar PDF' },
      { status: 500 }
    )
  }
} 