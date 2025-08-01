/**
 * Exemplo de como usar assinaturas nos certificados
 * 
 * Este script demonstra como integrar as assinaturas cadastradas
 * nos templates de certificado.
 */

// Importar utilitários de assinatura
import { buscarAssinatura, gerarHTMLAssinatura, gerarHTMLMultiplasAssinaturas } from '../lib/assinatura-utils.js'

/**
 * Exemplo 1: Buscar uma assinatura específica
 */
async function exemploBuscarAssinatura() {
  console.log('🔍 Buscando assinatura para: João Silva')
  
  const assinatura = await buscarAssinatura('João Silva')
  
  if (assinatura) {
    console.log('✅ Assinatura encontrada:', {
      nome: assinatura.nome,
      url: assinatura.urlImagem,
      data: assinatura.dataCriacao
    })
  } else {
    console.log('❌ Assinatura não encontrada para João Silva')
  }
}

/**
 * Exemplo 2: Gerar HTML para uma assinatura
 */
async function exemploGerarHTMLAssinatura() {
  console.log('🎨 Gerando HTML para assinatura do instrutor')
  
  const htmlAssinatura = await gerarHTMLAssinatura('Maria Santos', 'assinatura-instrutor')
  
  if (htmlAssinatura) {
    console.log('✅ HTML gerado:', htmlAssinatura)
  } else {
    console.log('❌ Não foi possível gerar HTML para Maria Santos')
  }
}

/**
 * Exemplo 3: Gerar HTML para múltiplas assinaturas
 */
async function exemploGerarMultiplasAssinaturas() {
  console.log('🎨 Gerando HTML para múltiplas assinaturas')
  
  const assinaturas = [
    { nome: 'João Silva', posicao: 'assinatura-instrutor', titulo: 'Instrutor' },
    { nome: 'Coordenador', posicao: 'assinatura-coordenador', titulo: 'Coordenador' }
  ]
  
  const htmlMultiplas = await gerarHTMLMultiplasAssinaturas(assinaturas)
  
  console.log('✅ HTML para múltiplas assinaturas:', htmlMultiplas)
}

/**
 * Exemplo 4: Integração com template de certificado
 */
async function exemploIntegracaoCertificado() {
  console.log('📄 Integrando assinaturas no certificado')
  
  // Dados do certificado
  const dadosCertificado = {
    aluno: 'Pedro Oliveira',
    instrutor: 'Maria Santos',
    treinamento: 'NR 22 - Segurança na Mineração',
    empresa: 'Mineração ABC Ltda',
    cargaHoraria: '40 horas'
  }
  
  // Buscar assinaturas
  const assinaturaInstrutor = await buscarAssinatura(dadosCertificado.instrutor)
  const assinaturaCoordenador = await buscarAssinatura('Coordenador')
  
  // Gerar HTML das assinaturas
  let htmlAssinaturas = ''
  
  if (assinaturaInstrutor || assinaturaCoordenador) {
    htmlAssinaturas = `
      <div style="display: flex; justify-content: space-around; margin-top: 40px;">
        ${assinaturaInstrutor ? `
          <div style="text-align: center;">
            <img src="${assinaturaInstrutor.urlImagem}" 
                 alt="Assinatura de ${assinaturaInstrutor.nome}" 
                 style="max-width: 180px; max-height: 70px; object-fit: contain;">
            <div style="margin-top: 5px; font-size: 12px; color: #666;">
              ${assinaturaInstrutor.nome}
            </div>
            <div style="font-size: 10px; color: #888;">Instrutor</div>
          </div>
        ` : ''}
        ${assinaturaCoordenador ? `
          <div style="text-align: center;">
            <img src="${assinaturaCoordenador.urlImagem}" 
                 alt="Assinatura de ${assinaturaCoordenador.nome}" 
                 style="max-width: 180px; max-height: 70px; object-fit: contain;">
            <div style="margin-top: 5px; font-size: 12px; color: #666;">
              ${assinaturaCoordenador.nome}
            </div>
            <div style="font-size: 10px; color: #888;">Coordenador</div>
          </div>
        ` : ''}
      </div>
    `
  }
  
  // Inserir no template
  const templateHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Certificado</title>
    </head>
    <body>
      <div class="certificado">
        <h1>Certificado de Conclusão</h1>
        <p>Certificamos que <strong>${dadosCertificado.aluno}</strong></p>
        <p>Concluiu o treinamento: <strong>${dadosCertificado.treinamento}</strong></p>
        <p>Empresa: <strong>${dadosCertificado.empresa}</strong></p>
        <p>Carga Horária: <strong>${dadosCertificado.cargaHoraria}</strong></p>
        
        <!-- Container das assinaturas -->
        <div id="assinaturas-container">
          ${htmlAssinaturas}
        </div>
      </div>
    </body>
    </html>
  `
  
  console.log('✅ Template com assinaturas gerado:', templateHTML)
  return templateHTML
}

/**
 * Exemplo 5: Validação de assinaturas antes de gerar certificado
 */
async function exemploValidacaoAssinaturas() {
  console.log('🔍 Validando assinaturas disponíveis')
  
  const instrutores = ['João Silva', 'Maria Santos', 'Pedro Oliveira']
  const assinaturasDisponiveis = []
  
  for (const instrutor of instrutores) {
    const temAssinatura = await buscarAssinatura(instrutor)
    if (temAssinatura) {
      assinaturasDisponiveis.push({
        nome: instrutor,
        url: temAssinatura.urlImagem
      })
    }
  }
  
  console.log('✅ Assinaturas disponíveis:', assinaturasDisponiveis)
  
  if (assinaturasDisponiveis.length === 0) {
    console.log('⚠️ Nenhuma assinatura cadastrada. Certificados serão gerados sem assinaturas.')
  }
}

// Executar exemplos
async function executarExemplos() {
  console.log('🚀 Iniciando exemplos de uso das assinaturas...\n')
  
  await exemploBuscarAssinatura()
  console.log('')
  
  await exemploGerarHTMLAssinatura()
  console.log('')
  
  await exemploGerarMultiplasAssinaturas()
  console.log('')
  
  await exemploIntegracaoCertificado()
  console.log('')
  
  await exemploValidacaoAssinaturas()
  console.log('')
  
  console.log('✅ Todos os exemplos executados com sucesso!')
}

// Executar se chamado diretamente
if (typeof window === 'undefined') {
  executarExemplos().catch(console.error)
}

export {
  exemploBuscarAssinatura,
  exemploGerarHTMLAssinatura,
  exemploGerarMultiplasAssinaturas,
  exemploIntegracaoCertificado,
  exemploValidacaoAssinaturas
} 