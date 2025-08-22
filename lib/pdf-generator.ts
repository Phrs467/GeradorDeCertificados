import JSZip from 'jszip'

export interface PDFData {
  nome: string
  certificadoCompleto: Blob
}

// Função para gerar PDF usando API route (igual ao script original)
export async function gerarPDFCompleto(frenteHTML: string, versoHTML: string, nomeArquivo: string): Promise<Blob> {
  try {
    console.log(`🔄 Iniciando geração de PDF para: ${nomeArquivo}`)
    console.log(`📏 HTML frente: ${frenteHTML.length} caracteres`)
    console.log(`📏 HTML verso: ${versoHTML.length} caracteres`)
    
    // Chama a API route para gerar o PDF
    const response = await fetch('/api/gerar-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frenteHTML,
        versoHTML,
        nomeArquivo
      })
    })

    console.log(`📡 Resposta da API: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erro na API: ${response.status} - ${errorText}`)
      throw new Error(`Erro na API: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log(`📄 Resultado da API:`, result)
    
    if (!result.success) {
      console.error(`❌ API retornou erro:`, result.error)
      throw new Error(result.error || 'Erro ao gerar PDF')
    }

    if (!result.pdfBase64) {
      console.error(`❌ API não retornou pdfBase64`)
      throw new Error('API não retornou dados do PDF')
    }

    console.log(`✅ PDF base64 recebido, tamanho: ${result.pdfBase64.length} caracteres`)

    // Converte base64 para blob
    const pdfBytes = atob(result.pdfBase64)
    const pdfArray = new Uint8Array(pdfBytes.length)
    for (let i = 0; i < pdfBytes.length; i++) {
      pdfArray[i] = pdfBytes.charCodeAt(i)
    }

    const blob = new Blob([pdfArray], { type: 'application/pdf' })
    console.log(`✅ Blob criado com sucesso, tamanho: ${blob.size} bytes`)
    
    return blob
    
  } catch (error) {
    console.error(`❌ Erro ao gerar PDF para ${nomeArquivo}:`, error)
    throw error
  }
}

export async function criarZIPComPDFs(pdfDataArray: PDFData[]): Promise<Blob> {
  const zip = new JSZip()
  
  // Adiciona cada PDF completo ao ZIP
  for (const data of pdfDataArray) {
    // Usa o nome exato que vem do sanitizarNome, sem sanitização adicional
    zip.file(`${data.nome}_certificado.pdf`, data.certificadoCompleto)
  }
  
  // Gera o arquivo ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  return zipBlob
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
} 