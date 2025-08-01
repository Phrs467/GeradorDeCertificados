/**
 * Utilitários para gerenciar assinaturas nos certificados
 */

export interface Assinatura {
  id: string
  nome: string
  urlImagem: string
  dataCriacao: Date
}

/**
 * Busca uma assinatura por nome no Firebase
 * @param nome Nome completo da pessoa para buscar a assinatura
 * @returns Promise com a assinatura encontrada ou null
 */
export async function buscarAssinatura(nome: string): Promise<Assinatura | null> {
  try {
    const response = await fetch(`/api/assinaturas/buscar?nome=${encodeURIComponent(nome)}`)
    const data = await response.json()
    
    if (data.success) {
      return data.assinatura
    }
    
    return null
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error)
    return null
  }
}

/**
 * Busca todas as assinaturas disponíveis
 * @returns Promise com array de assinaturas
 */
export async function buscarTodasAssinaturas(): Promise<Assinatura[]> {
  try {
    const response = await fetch('/api/assinaturas')
    const data = await response.json()
    
    if (data.success) {
      return data.assinaturas
    }
    
    return []
  } catch (error) {
    console.error('Erro ao buscar assinaturas:', error)
    return []
  }
}

/**
 * Gera HTML para inserir uma assinatura em um certificado
 * @param nome Nome da pessoa para buscar a assinatura
 * @param posicaoCSS Classe CSS para posicionar a assinatura
 * @returns Promise com o HTML da assinatura ou string vazia se não encontrada
 */
export async function gerarHTMLAssinatura(nome: string, posicaoCSS: string = 'assinatura'): Promise<string> {
  const assinatura = await buscarAssinatura(nome)
  
  if (!assinatura) {
    console.warn(`Assinatura não encontrada para: ${nome}`)
    return ''
  }
  
  return `
    <div class="${posicaoCSS}" style="text-align: center; margin-top: 20px;">
      <img src="${assinatura.urlImagem}" 
           alt="Assinatura de ${assinatura.nome}" 
           style="max-width: 200px; max-height: 80px; object-fit: contain;"
           onerror="this.style.display='none'; console.warn('Erro ao carregar assinatura: ${assinatura.nome}');">
      <div style="margin-top: 5px; font-size: 12px; color: #666;">
        ${assinatura.nome}
      </div>
    </div>
  `
}

/**
 * Gera HTML para múltiplas assinaturas (ex: instrutor + coordenador)
 * @param assinaturas Array de objetos com nome e posição
 * @returns Promise com o HTML das assinaturas
 */
export async function gerarHTMLMultiplasAssinaturas(
  assinaturas: Array<{nome: string, posicao: string, titulo?: string}>
): Promise<string> {
  const htmlAssinaturas = await Promise.all(
    assinaturas.map(async (item) => {
      const assinatura = await buscarAssinatura(item.nome)
      if (!assinatura) return ''
      
      return `
        <div class="${item.posicao}" style="text-align: center; margin: 10px;">
          <img src="${assinatura.urlImagem}" 
               alt="Assinatura de ${assinatura.nome}" 
               style="max-width: 150px; max-height: 60px; object-fit: contain;"
               onerror="this.style.display='none';">
          <div style="margin-top: 3px; font-size: 11px; color: #666;">
            ${assinatura.nome}
          </div>
          ${item.titulo ? `<div style="font-size: 10px; color: #888;">${item.titulo}</div>` : ''}
        </div>
      `
    })
  )
  
  return `
    <div style="display: flex; justify-content: space-around; margin-top: 30px;">
      ${htmlAssinaturas.filter(html => html !== '').join('')}
    </div>
  `
}

/**
 * Valida se uma assinatura existe no sistema
 * @param nome Nome da pessoa para verificar
 * @returns Promise com boolean indicando se existe
 */
export async function validarAssinatura(nome: string): Promise<boolean> {
  const assinatura = await buscarAssinatura(nome)
  return assinatura !== null
}

/**
 * Lista de nomes que têm assinaturas cadastradas
 * @returns Promise com array de nomes
 */
export async function listarNomesComAssinatura(): Promise<string[]> {
  const assinaturas = await buscarTodasAssinaturas()
  return assinaturas.map(a => a.nome)
} 