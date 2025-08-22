const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs } = require('firebase/firestore')

// Configuração do Firebase (mesma do projeto)
const firebaseConfig = {
  apiKey: "AIzaSyBnr5yW1F2J1-OQJD4IMBttKGYAkHOW4nA",
  authDomain: "exportador-certificados-14bd4.firebaseapp.com",
  projectId: "exportador-certificados-14bd4",
  storageBucket: "exportador-certificados-14bd4.firebasestorage.app",
  messagingSenderId: "22402301311",
  appId: "1:22402301311:web:68970e19345e90fe3cee4a"
}

// Inicializa Firebase
const app = initializeApp(firebaseConfig)
const firestore = getFirestore(app)

async function verificarEstadoBanco() {
  console.log('🔍 VERIFICANDO ESTADO ATUAL DO BANCO DE DADOS')
  
  const alunosRef = collection(firestore, "alunos")
  const todosAlunosSnap = await getDocs(alunosRef)
  
  console.log(`📊 Total de alunos no banco: ${todosAlunosSnap.size}`)
  
  // Agrupa alunos por documento para identificar duplicatas
  const alunosPorDocumento = {}
  const alunosDetalhados = []
  
  todosAlunosSnap.forEach(docSnap => {
    const data = docSnap.data()
    const documento = String(data.documento || '').trim()
    const nome = String(data.nome || '').trim()
    const certificados = Array.isArray(data.certificados) ? data.certificados : []
    
    alunosDetalhados.push({
      id: docSnap.id,
      nome: nome,
      documento: documento,
      certificados: certificados,
      empresa: data.empresa || ''
    })
    
    if (!documento) {
      console.log(`⚠️ Aluno sem documento: ${nome} (ID: ${docSnap.id})`)
      return
    }
    
    if (!alunosPorDocumento[documento]) {
      alunosPorDocumento[documento] = []
    }
    
    alunosPorDocumento[documento].push({
      id: docSnap.id,
      nome: nome,
      certificados: certificados,
      empresa: data.empresa || ''
    })
  })
  
  console.log('\n📋 ANÁLISE POR DOCUMENTO:')
  let totalDuplicatas = 0
  
  Object.entries(alunosPorDocumento).forEach(([documento, alunos]) => {
    if (alunos.length > 1) {
      console.log(`\n❌ DOCUMENTO DUPLICADO: "${documento}" (${alunos.length} alunos)`)
      totalDuplicatas++
      
      alunos.forEach((aluno, index) => {
        console.log(`  ${index + 1}. ${aluno.nome} (ID: ${aluno.id}) - ${aluno.certificados.length} certificados`)
        aluno.certificados.forEach(cert => {
          console.log(`     📄 ${cert.id} - ${cert.treinamento}`)
        })
      })
    } else {
      console.log(`✅ Documento único: "${documento}" - ${alunos[0].nome} (${alunos[0].certificados.length} certificados)`)
    }
  })
  
  console.log(`\n📊 RESUMO:`)
  console.log(`📄 Documentos únicos: ${Object.keys(alunosPorDocumento).filter(doc => alunosPorDocumento[doc].length === 1).length}`)
  console.log(`❌ Documentos duplicados: ${totalDuplicatas}`)
  console.log(`👥 Total de alunos: ${todosAlunosSnap.size}`)
  
  // Lista todos os alunos
  console.log('\n👥 LISTA COMPLETA DE ALUNOS:')
  alunosDetalhados.forEach((aluno, index) => {
    console.log(`${index + 1}. ${aluno.nome} (${aluno.documento}) - ${aluno.certificados.length} certificados`)
    if (aluno.certificados.length > 0) {
      aluno.certificados.forEach(cert => {
        console.log(`   📄 ${cert.id} - ${cert.treinamento} - ${cert.empresa}`)
      })
    }
  })
  
  // Verifica se há alunos com nome "teste" (dados de teste)
  const alunosTeste = alunosDetalhados.filter(aluno => aluno.nome.toLowerCase() === 'teste')
  if (alunosTeste.length > 0) {
    console.log(`\n🧪 ALUNOS DE TESTE ENCONTRADOS: ${alunosTeste.length}`)
    alunosTeste.forEach(aluno => {
      console.log(`  - ${aluno.nome} (${aluno.documento}) - ID: ${aluno.id}`)
    })
  }
  
  // Sugere ações
  console.log('\n💡 SUGESTÕES:')
  if (totalDuplicatas > 0) {
    console.log(`1. Execute o script de sincronização para consolidar ${totalDuplicatas} documentos duplicados`)
  }
  if (alunosTeste.length > 0) {
    console.log(`2. Considere remover ${alunosTeste.length} alunos de teste`)
  }
  
  console.log('3. Verifique se todos os certificados da sua planilha foram importados corretamente')
}

verificarEstadoBanco().catch(console.error)

