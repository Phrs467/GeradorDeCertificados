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

// Função para buscar conteúdo pragmático
async function buscarConteudoPragmatico(empresa: string, treinamento: string): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/conteudo-pragmatico/buscar?empresa=${encodeURIComponent(empresa.trim())}&treinamento=${encodeURIComponent(treinamento.trim())}`)
    const data = await response.json()
    
    if (data.success && data.conteudo) {
      console.log(`✅ Conteúdo pragmático encontrado para: ${empresa} - ${treinamento}`)
      return data.conteudo.conteudo
    } else {
      console.log(`❌ Conteúdo pragmático não encontrado para: ${empresa} - ${treinamento}`)
      return 'Conteúdo programático específico do treinamento.'
    }
  } catch (error) {
    console.error('❌ Erro ao buscar conteúdo pragmático:', error)
    return 'Conteúdo programático específico do treinamento.'
  }
}

// Função para buscar assinatura do instrutor
async function buscarAssinaturaInstrutor(instrutor: string): Promise<string> {
  try {
    if (!instrutor || instrutor.trim() === '') {
      console.log('❌ Nome do instrutor não fornecido')
      return ''
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/assinaturas/buscar?nome=${encodeURIComponent(instrutor.trim())}`)
    const data = await response.json()
    
    if (data.success && data.assinatura) {
      console.log(`✅ Assinatura encontrada para instrutor: ${instrutor}`)
      return data.assinatura.imagemBase64
    } else {
      console.log(`❌ Assinatura não encontrada para instrutor: ${instrutor}`)
      return ''
    }
  } catch (error) {
    console.error('❌ Erro ao buscar assinatura do instrutor:', error)
    return ''
  }
}

export async function gerarPDFIndividual(certificado: CertificadoData): Promise<Blob> {
  try {
    // Carrega os templates diretamente do sistema de arquivos
    const publicDir = join(process.cwd(), 'public')
    const templateFrente = readFileSync(join(publicDir, 'template-frente.html'), 'utf-8')
    const templateVerso = readFileSync(join(publicDir, 'template-verso.html'), 'utf-8')

    // Converte as imagens para base64
    const caminhoImagem1 = join(process.cwd(), 'imgs', 'ri_1.jpeg')
    const caminhoImagem2 = join(process.cwd(), 'imgs', 'ri_2.png')
    const imagem1Base64 = converterImagemParaBase64(caminhoImagem1)
    const imagem2Base64 = converterImagemParaBase64(caminhoImagem2)
    
    // Substitui os caminhos das imagens por base64 nos templates
    const templateFrenteComImagens = templateFrente
      .replace(
        "background: url('../imgs/ri_1.jpeg') no-repeat center center;",
        `background: url('${imagem1Base64}') no-repeat center center;`
      )
      .replace(
        'src="../imgs/ri_2.png"',
        `src="${imagem2Base64}"`
      )
    
    const templateVersoComImagens = templateVerso
      .replace(
        "background: url('../imgs/ri_1.jpeg') no-repeat center center;",
        `background: url('${imagem1Base64}') no-repeat center center;`
      )

    // Busca conteúdo pragmático e assinatura em paralelo
    const [conteudoPragmatico, assinaturaBase64] = await Promise.all([
      certificado.empresa && certificado.treinamento 
        ? buscarConteudoPragmatico(certificado.empresa, certificado.treinamento)
        : Promise.resolve('Conteúdo programático específico do treinamento.'),
      certificado.instrutor 
        ? buscarAssinaturaInstrutor(certificado.instrutor)
        : Promise.resolve('')
    ])

    // Gera QR code com o ID do certificado específico
    const urlVerificacao = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/id/${certificado.id}`
    const qrCodeDataURL = await QRCode.toDataURL(urlVerificacao)
    
    // Gera HTML da frente com QR code e assinatura atualizados
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
        
        // Adiciona assinatura do instrutor se disponível
        const assinaturaImg = document.getElementById('assinatura-instrutor');
        if (assinaturaImg && '${assinaturaBase64}') {
          assinaturaImg.src = 'data:image/png;base64,${assinaturaBase64}';
          assinaturaImg.style.display = 'block';
        }
      </script>
    `;
    
    // Substitui o placeholder da assinatura no template
    const templateFrenteComAssinatura = templateFrenteComImagens.replace('{{ASSINATURA_BASE64}}', assinaturaBase64)
    const frenteHTML = templateFrenteComAssinatura.replace('</body>', scriptComQR + '</body>')
    
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
        document.getElementById('conteudo-pragmatico').textContent = '${conteudoPragmatico.replace(/'/g, "\\'").replace(/\n/g, '\\n')}';
      </script>
    `;
    
    // Substitui o placeholder do conteúdo pragmático no template
    const templateVersoComConteudo = templateVersoComImagens.replace('{{CONTEUDO_PRAGMATICO}}', conteudoPragmatico)
    const versoHTML = templateVersoComConteudo.replace('</body>', scriptVerso + '</body>')

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
      
      // Gera PDF da frente com otimizações
      await page.setContent(frenteHTML, { waitUntil: 'domcontentloaded' })
      const pdfFrente = await page.pdf({
        printBackground: true,
        format: 'A4',
        landscape: true,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        preferCSSPageSize: false
      })
      
      // Gera PDF do verso com otimizações
      await page.setContent(versoHTML, { waitUntil: 'domcontentloaded' })
      const pdfVerso = await page.pdf({
        printBackground: true,
        format: 'A4',
        landscape: true,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        preferCSSPageSize: false
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