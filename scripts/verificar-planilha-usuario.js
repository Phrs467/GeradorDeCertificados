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

// DADOS DA SUA PLANILHA - SUBSTITUA PELOS DADOS REAIS
const dadosPlanilhaUsuario = [
  // Adicione aqui os 7 certificados da sua planilha
  // Exemplo:
  // {
  //   "id": "SEU_ID_1",
  //   "aluno": "Nome do Aluno 1",
  //   "documento": "123456789",
  //   "empresa": "Empresa A",
  //   "treinamento": "NR-10",
  //   "cargahoraria": "40",
  //   "conclusao": "2024-01-15",
  //   "dataemissao": "2024-01-16",
  //   "instrutor": "Prof. Carlos"
  // },
  // ... adicione os outros 6
]

async function verificarPlanilhaUsuario() {
  console.log('🔍 VERIFICANDO PLANILHA DO USUÁRIO')
  console.log('📊 Total de linhas na planilha:', dadosPlanilhaUsuario.length)
  
  if (dadosPlanilhaUsuario.length === 0) {
    console.log('❌ Nenhum dado da planilha fornecido. Adicione os dados reais no script.')
    return
  }
  
  // Verifica estado atual do banco
  console.log('\n📋 VERIFICANDO ESTADO ATUAL DO BANCO...')
  const alunosRef = collection(firestore, "alunos")
  const todosAlunosSnap = await getDocs(alunosRef)
  
  console.log(`📊 Total de alunos no banco: ${todosAlunosSnap.size}`)
  
  // Lista todos os alunos existentes
  const alunosExistentes = []
  todosAlunosSnap.forEach(docSnap => {
    const data = docSnap.data()
    alunosExistentes.push({
      id: docSnap.id,
      nome: String(data.nome || '').trim(),
      documento: String(data.documento || '').trim(),
      certificados: Array.isArray(data.certificados) ? data.certificados : []
    })
  })
  
  console.log('\n👥 ALUNOS EXISTENTES NO BANCO:')
  alunosExistentes.forEach((aluno, index) => {
    console.log(`${index + 1}. ${aluno.nome} (${aluno.documento}) - ${aluno.certificados.length} certificados`)
    aluno.certificados.forEach(cert => {
      console.log(`   📄 ${cert.id} - ${cert.treinamento}`)
    })
  })
  
  // Simula o processamento da planilha
  console.log('\n🔄 SIMULANDO PROCESSAMENTO DA SUA PLANILHA...')
  
  // Agrupa certificados por nome E documento
  const certificadosPorAluno = {}
  const linhasComProblema = []
  
  for (let i = 0; i < dadosPlanilhaUsuario.length; i++) {
    const row = dadosPlanilhaUsuario[i]
    const planilhaId = row["id"] || ""
    const nome = (row["aluno"] || "").trim()
    const documento = String(row["documento"] || "").trim()
    
    console.log(`📝 Linha ${i + 1}: ID=${planilhaId}, Nome="${nome}", Doc="${documento}"`)
    
    // Verifica se há problemas nos dados
    if (!planilhaId) {
      console.log(`❌ Linha ${i + 1} - ID vazio`)
      linhasComProblema.push({ linha: i + 1, problema: "ID vazio", dados: row })
      continue
    }
    
    if (!nome) {
      console.log(`❌ Linha ${i + 1} - Nome vazio`)
      linhasComProblema.push({ linha: i + 1, problema: "Nome vazio", dados: row })
      continue
    }
    
    if (!documento) {
      console.log(`❌ Linha ${i + 1} - Documento vazio`)
      linhasComProblema.push({ linha: i + 1, problema: "Documento vazio", dados: row })
      continue
    }
    
    // Chave única: nome + documento
    const chaveAluno = `${nome}|${documento}`
    
    if (!certificadosPorAluno[chaveAluno]) {
      certificadosPorAluno[chaveAluno] = {
        nome: nome,
        documento: documento,
        empresa: row["empresa"] || '',
        certificados: []
      }
      console.log(`🆕 Novo grupo criado: ${chaveAluno}`)
    }
    
    const certificado = {
      cargaHoraria: Number(row["cargahoraria"] || 0),
      dataConclusao: row["conclusao"] || '',
      dataEmissao: row["dataemissao"] || '',
      documento: documento,
      empresa: row["empresa"] || '',
      id: planilhaId,
      instrutor: row["instrutor"] || '',
      nome: nome,
      treinamento: row["treinamento"] || ''
    }
    
    certificadosPorAluno[chaveAluno].certificados.push(certificado)
    console.log(`➕ Certificado ${planilhaId} adicionado ao grupo ${chaveAluno}`)
  }
  
  console.log('\n📊 GRUPOS QUE SERIAM CRIADOS:')
  Object.keys(certificadosPorAluno).forEach(chave => {
    const dados = certificadosPorAluno[chave]
    console.log(`  - ${chave}: ${dados.certificados.length} certificados`)
  })
  
  // Verifica se os alunos já existem no banco
  console.log('\n🔍 VERIFICANDO SE ALUNOS JÁ EXISTEM NO BANCO...')
  const alunosNaoEncontrados = []
  
  for (const [chaveAluno, dadosAluno] of Object.entries(certificadosPorAluno)) {
    console.log(`\n🔍 Verificando: ${dadosAluno.nome} (${dadosAluno.documento})`)
    
    let alunoEncontrado = false
    
    alunosExistentes.forEach(aluno => {
      const nomeAluno = String(aluno.nome || '').trim()
      const documentoAluno = String(aluno.documento || '').trim()
      
      if (nomeAluno === dadosAluno.nome && documentoAluno === dadosAluno.documento) {
        alunoEncontrado = true
        console.log(`✅ Aluno encontrado no banco!`)
        
        // Verifica certificados
        dadosAluno.certificados.forEach(certPlanilha => {
          const certificadoExiste = aluno.certificados.some(certBanco => 
            String(certBanco.id) === String(certPlanilha.id)
          )
          
          if (certificadoExiste) {
            console.log(`  ⏭️ Certificado ${certPlanilha.id} já existe`)
          } else {
            console.log(`  ✅ Certificado ${certPlanilha.id} seria adicionado`)
          }
        })
      }
    })
    
    if (!alunoEncontrado) {
      console.log(`❌ Aluno NÃO encontrado no banco`)
      alunosNaoEncontrados.push(dadosAluno)
    }
  }
  
  // Resumo final
  console.log('\n📊 RESUMO DA ANÁLISE:')
  console.log(`📋 Total de linhas na planilha: ${dadosPlanilhaUsuario.length}`)
  console.log(`📄 Linhas com problemas: ${linhasComProblema.length}`)
  console.log(`👥 Grupos únicos que seriam criados: ${Object.keys(certificadosPorAluno).length}`)
  console.log(`❌ Alunos que NÃO foram criados: ${alunosNaoEncontrados.length}`)
  
  if (linhasComProblema.length > 0) {
    console.log('\n❌ LINHAS COM PROBLEMAS:')
    linhasComProblema.forEach(linha => {
      console.log(`  Linha ${linha.linha}: ${linha.problema}`)
      console.log(`    Dados:`, linha.dados)
    })
  }
  
  if (alunosNaoEncontrados.length > 0) {
    console.log('\n❌ ALUNOS QUE NÃO FORAM CRIADOS:')
    alunosNaoEncontrados.forEach(aluno => {
      console.log(`  - ${aluno.nome} (${aluno.documento}) - ${aluno.certificados.length} certificados`)
    })
  }
  
  console.log('\n💡 SUGESTÕES:')
  if (linhasComProblema.length > 0) {
    console.log('1. Corrija os dados nas linhas com problemas')
  }
  if (alunosNaoEncontrados.length > 0) {
    console.log('2. Reimporte a planilha após corrigir os problemas')
  }
  console.log('3. Execute a sincronização após o download para consolidar duplicatas')
}

verificarPlanilhaUsuario().catch(console.error)
