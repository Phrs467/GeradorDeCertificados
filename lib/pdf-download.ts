import puppeteer from 'puppeteer'
import { PDFDocument } from 'pdf-lib'
import { readFileSync } from 'fs'
import { join } from 'path'
import QRCode from 'qrcode'

export interface CertificadoData {
  id: string
  aluno: string
  documento: string
  treinamento: string
  empresa: string
  cargaHoraria: string
  instrutor: string
  dataConclusao: string
  dataEmissao: string
}

export async function gerarPDFIndividual(certificado: CertificadoData): Promise<Blob> {
  try {
    // Carrega os templates diretamente do sistema de arquivos
    const publicDir = join(process.cwd(), 'public')
    const templateFrente = readFileSync(join(publicDir, 'template-frente.html'), 'utf-8')
    const templateVerso = readFileSync(join(publicDir, 'template-verso.html'), 'utf-8')

    // Gera QR code com o ID do Firestore
    const urlVerificacao = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/id/${certificado.id}`
    const qrCodeDataURL = await QRCode.toDataURL(urlVerificacao)
    
    // Gera HTML da frente com QR code atualizado
    const scriptComQR = `
      <script>
        document.getElementById('aluno').textContent = '${certificado.aluno.replace(/'/g, "\\'")}';
        document.getElementById('documento').textContent = 'DOC: ${certificado.documento.replace(/'/g, "\\'")}';
        document.getElementById('treinamento').textContent = '${certificado.treinamento.replace(/'/g, "\\'")}';
        document.getElementById('empresa').textContent = '${certificado.empresa.replace(/'/g, "\\'")}';
        document.getElementById('cargaHoraria').textContent = '${certificado.cargaHoraria} horas';
        document.getElementById('instrutor').textContent = '${certificado.instrutor.replace(/'/g, "\\'")}';
        
        // Adiciona QR code com o ID do Firestore
        const qrCodeImg = document.getElementById('qr-code');
        if (qrCodeImg) {
          qrCodeImg.src = '${qrCodeDataURL}';
          qrCodeImg.style.display = 'block';
        }
      </script>
    `;
    
    const frenteHTML = templateFrente.replace('</body>', scriptComQR + '</body>')
    
    // Gera HTML do verso
    const dataConclusaoFmt = certificado.dataConclusao ? 
      new Date(certificado.dataConclusao).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }) : certificado.dataConclusao || ''
    
    const scriptVerso = `
      <script>
        document.getElementById('treinamento').textContent = '${certificado.treinamento || ''}';
        document.getElementById('cargaHoraria').textContent = '${certificado.cargaHoraria || ''} horas';
        document.getElementById('dataConclusao').textContent = '${dataConclusaoFmt}';
      </script>
    `;
    
    const versoHTML = templateVerso.replace('</body>', scriptVerso + '</body>')

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
      
      // Combina os PDFs em um só
      const pdfDoc = await PDFDocument.create()
      
      const pdfFrenteDoc = await PDFDocument.load(pdfFrente)
      const pdfVersoDoc = await PDFDocument.load(pdfVerso)
      
      const [frentePage] = await pdfDoc.copyPages(pdfFrenteDoc, [0])
      const [versoPage] = await pdfDoc.copyPages(pdfVersoDoc, [0])
      
      pdfDoc.addPage(frentePage)
      pdfDoc.addPage(versoPage)
      
      const pdfFinal = await pdfDoc.save()
      
      await browser.close()
      
      // Retorna o PDF como Blob
      return new Blob([pdfFinal], { type: 'application/pdf' })
      
    } catch (error) {
      await browser.close()
      throw error
    }
    
  } catch (error) {
    console.error('Erro ao gerar PDF individual:', error)
    throw error
  }
} 