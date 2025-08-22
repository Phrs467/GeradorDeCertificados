// Script simples para debugar a lógica de busca de alunos
console.log('🔍 Debug da lógica de busca de alunos...')

// Simula dados de entrada
const dadosTeste = [
  {
    nome: 'João Silva',
    documento: '123456789',
    id: 'cert001'
  },
  {
    nome: 'João Silva',
    documento: '123456789',
    id: 'cert002'
  },
  {
    nome: 'João Silva',
    documento: '123456789',
    id: 'cert003'
  }
]

console.log('📋 Dados de teste:')
dadosTeste.forEach((dado, index) => {
  console.log(`${index + 1}. Nome: "${dado.nome}" (${dado.nome.length} chars)`)
  console.log(`   Documento: "${dado.documento}" (${dado.documento.length} chars)`)
  console.log(`   ID: "${dado.id}"`)
  console.log('')
})

// Simula normalização
console.log('🔧 Normalização dos dados:')
dadosTeste.forEach((dado, index) => {
  const nomeNormalizado = dado.nome.trim()
  const documentoNormalizado = String(dado.documento).trim()
  
  console.log(`${index + 1}. Nome normalizado: "${nomeNormalizado}" (${nomeNormalizado.length} chars)`)
  console.log(`   Documento normalizado: "${documentoNormalizado}" (${documentoNormalizado.length} chars)`)
  console.log('')
})

// Simula comparação
console.log('🔍 Comparação entre registros:')
for (let i = 0; i < dadosTeste.length; i++) {
  for (let j = i + 1; j < dadosTeste.length; j++) {
    const dado1 = dadosTeste[i]
    const dado2 = dadosTeste[j]
    
    const nome1 = dado1.nome.trim()
    const nome2 = dado2.nome.trim()
    const doc1 = String(dado1.documento).trim()
    const doc2 = String(dado2.documento).trim()
    
    const nomesIguais = nome1 === nome2
    const docsIguais = doc1 === doc2
    
    console.log(`Comparando ${i + 1} vs ${j + 1}:`)
    console.log(`  Nomes iguais: ${nomesIguais} ("${nome1}" vs "${nome2}")`)
    console.log(`  Docs iguais: ${docsIguais} ("${doc1}" vs "${doc2}")`)
    console.log(`  Mesmo aluno: ${nomesIguais && docsIguais}`)
    console.log('')
  }
}

console.log('🎉 Debug concluído!')





