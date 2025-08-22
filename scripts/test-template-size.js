const { readFileSync } = require('fs')
const { join } = require('path')

// Função para verificar se o template tem as propriedades corretas
function verificarTemplate(arquivo, nome) {
  console.log(`🔍 Verificando ${nome}...`)
  
  try {
    const conteudo = readFileSync(arquivo, 'utf-8')
    
    // Verifica se as bordas pretas foram removidas
    const temBordaPreta = conteudo.includes('border: 1px solid #000')
    console.log(`  ❌ Borda preta encontrada: ${temBordaPreta}`)
    
    // Verifica se o tamanho está correto
    const temWidth100 = conteudo.includes('width: 100%')
    const temHeight100vh = conteudo.includes('height: 100vh')
    const temMargin0 = conteudo.includes('margin: 0')
    const temBorderNone = conteudo.includes('border: none')
    
    console.log(`  ✅ Width 100%: ${temWidth100}`)
    console.log(`  ✅ Height 100vh: ${temHeight100vh}`)
    console.log(`  ✅ Margin 0: ${temMargin0}`)
    console.log(`  ✅ Border none: ${temBorderNone}`)
    
    // Verifica se o content está centralizado e otimizado para paisagem
    const temContentCentralizado = conteudo.includes('position: absolute') && 
                                  conteudo.includes('top: 50%') && 
                                  conteudo.includes('left: 50%') && 
                                  conteudo.includes('transform: translate(-50%, -50%)')
    
    const temMaxWidth1200 = conteudo.includes('max-width: 1200px')
    const temWidth85 = conteudo.includes('width: 85%')
    
    console.log(`  ✅ Content centralizado: ${temContentCentralizado}`)
    console.log(`  ✅ Max-width 1200px (paisagem): ${temMaxWidth1200}`)
    console.log(`  ✅ Width 85% (paisagem): ${temWidth85}`)
    
    return {
      bordaPreta: temBordaPreta,
      tamanhoCorreto: temWidth100 && temHeight100vh && temMargin0 && temBorderNone,
      contentCentralizado: temContentCentralizado,
      otimizadoPaisagem: temMaxWidth1200 && temWidth85
    }
    
  } catch (error) {
    console.error(`❌ Erro ao ler ${nome}:`, error.message)
    return null
  }
}

// Testa os templates
console.log('🧪 Testando templates...\n')

const templateFrente = join(process.cwd(), 'public', 'template-frente.html')
const templateVerso = join(process.cwd(), 'public', 'template-verso.html')

const resultadoFrente = verificarTemplate(templateFrente, 'Template Frente')
console.log('')

const resultadoVerso = verificarTemplate(templateVerso, 'Template Verso')
console.log('')

// Resumo
console.log('📊 RESUMO:')
console.log('Template Frente:')
console.log(`  - Borda preta removida: ${!resultadoFrente?.bordaPreta}`)
console.log(`  - Tamanho correto: ${resultadoFrente?.tamanhoCorreto}`)
console.log(`  - Content centralizado: ${resultadoFrente?.contentCentralizado}`)
console.log(`  - Otimizado para paisagem: ${resultadoFrente?.otimizadoPaisagem}`)

console.log('Template Verso:')
console.log(`  - Borda preta removida: ${!resultadoVerso?.bordaPreta}`)
console.log(`  - Tamanho correto: ${resultadoVerso?.tamanhoCorreto}`)
console.log(`  - Content centralizado: ${resultadoVerso?.contentCentralizado}`)
console.log(`  - Otimizado para paisagem: ${resultadoVerso?.otimizadoPaisagem}`)

console.log('\n🎉 Teste concluído!')
