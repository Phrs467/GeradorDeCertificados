import JSZip from 'jszip'

export interface PDFData {
  nome: string
  certificadoCompleto: Blob
}

// Função para gerar PDF usando API route (igual ao script original)
export async function gerarPDFCompleto(frenteHTML: string, versoHTML: string, nomeArquivo: string): Promise<Blob> {
  try {
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

    if (!response.ok) {
      throw new Error('Erro ao gerar PDF')
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao gerar PDF')
    }

    // Converte base64 para blob
    const pdfBytes = atob(result.pdfBase64)
    const pdfArray = new Uint8Array(pdfBytes.length)
    for (let i = 0; i < pdfBytes.length; i++) {
      pdfArray[i] = pdfBytes.charCodeAt(i)
    }

    return new Blob([pdfArray], { type: 'application/pdf' })
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
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