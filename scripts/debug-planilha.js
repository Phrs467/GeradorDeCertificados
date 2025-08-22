const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, addDoc, updateDoc, query, where } = require('firebase/firestore')

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

// Dados de teste simulando uma planilha com 7 certificados
const dadosPlanilha = [
  {
    "id": "CERT001",
    "aluno": "João Silva",
    "documento": "123456789",
    "empresa": "Empresa A",
    "treinamento": "NR-10",
    "cargahoraria": "40",
    "conclusao": "2024-01-15",
    "dataemissao": "2024-01-16",
    "instrutor": "Prof. Carlos"
  },
  {
    "id": "CERT002",
    "aluno": "Maria Santos",
    "documento": "987654321",
    "empresa": "Empresa B",
    "treinamento": "NR-35",
    "cargahoraria": "16",
    "conclusao": "2024-01-20",
    "dataemissao": "2024-01-21",
    "instrutor": "Prof. Ana"
  },
  {
    "id": "CERT003",
    "aluno": "João Silva", // Mesmo nome e documento do primeiro
    "documento": "123456789",
    "empresa": "Empresa C",
    "treinamento": "NR-11",
    "cargahoraria": "8",
    "conclusao": "2024-01-25",
    "dataemissao": "2024-01-26",
    "instrutor": "Prof. Carlos"
  },
  {
    "id": "CERT004",
    "aluno": "Pedro Costa",
    "documento": "555666777",
    "empresa": "Empresa D",
    "treinamento": "NR-12",
    "cargahoraria": "20",
    "conclusao": "2024-01-30",
    "dataemissao": "2024-01-31",
    "instrutor": "Prof. João"
  },
  {
    "id": "CERT005",
    "aluno": "Ana Oliveira",
    "documento": "111222333",
    "empresa": "Empresa E",
    "treinamento": "NR-33",
    "cargahoraria": "12",
    "conclusao": "2024-02-05",
    "dataemissao": "2024-02-06",
    "instrutor": "Prof. Maria"
  },
  {
    "id": "CERT006",
    "aluno": "Carlos Lima",
    "documento": "444555666",
    "empresa": "Empresa F",
    "treinamento": "NR-18",
    "cargahoraria": "24",
    "conclusao": "2024-02-10",
    "dataemissao": "2024-02-11",
    "instrutor": "Prof. Pedro"
  },
  {
    "id": "CERT007",
    "aluno": "Lucia Ferreira",
    "documento": "777888999",
    "empresa": "Empresa G",
    "treinamento": "NR-20",
    "cargahoraria": "32",
    "conclusao": "2024-02-15",
    "dataemissao": "2024-02-16",
    "instrutor": "Prof. Lucia"
  }
]

async function debugPlanilha() {
  console.log('🔍 INICIANDO DIAGNÓSTICO DA PLANILHA')
  console.log('📊 Total de linhas na planilha:', dadosPlanilha.length)
  
  // Verifica estado atual do banco
  console.log('\n📋 VERIFICANDO ESTADO ATUAL DO BANCO...')
  const alunosRef = collection(firestore, "alunos")
  const todosAlunosSnap = await getDocs(alunosRef)
  
  console.log(`📊 Total de alunos no banco: ${todosAlunosSnap.size}`)
  
  const alunosExistentes = []
  todosAlunosSnap.forEach(docSnap => {
    const data = docSnap.data()
    alunosExistentes.push({
      id: docSnap.id,
      nome: data.nome,
      documento: data.documento,
      certificados: Array.isArray(data.certificados) ? data.certificados.length : 0
    })
  })
  
  console.log('👥 Alunos existentes no banco:')
  alunosExistentes.forEach(aluno => {
    console.log(`  - ${aluno.nome} (${aluno.documento}) - ${aluno.certificados} certificados`)
  })
  
  // Simula o processamento da planilha
  console.log('\n🔄 SIMULANDO PROCESSAMENTO DA PLANILHA...')
  
  // Agrupa certificados por nome E documento
  const certificadosPorAluno = {}
  
  for (let i = 0; i < dadosPlanilha.length; i++) {
    const row = dadosPlanilha[i]
    const planilhaId = row["id"] || ""
    const nome = (row["aluno"] || "").trim()
    const documento = String(row["documento"] || "").trim()
    
    console.log(`📝 Linha ${i + 1}: ID=${planilhaId}, Nome="${nome}", Doc="${documento}"`)
    
    if (!planilhaId || !nome || !documento) {
      console.log(`❌ Linha ${i + 1} - dados inválidos`)
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
  
  console.log('\n📊 GRUPOS CRIADOS:')
  Object.keys(certificadosPorAluno).forEach(chave => {
    const dados = certificadosPorAluno[chave]
    console.log(`  - ${chave}: ${dados.certificados.length} certificados`)
  })
  
  // Processa cada grupo
  console.log('\n🔄 PROCESSANDO CADA GRUPO...')
  const results = []
  
  for (const [chaveAluno, dadosAluno] of Object.entries(certificadosPorAluno)) {
    console.log(`\n=== PROCESSANDO: ${dadosAluno.nome} (${dadosAluno.documento}) ===`)
    console.log(`👤 ${dadosAluno.certificados.length} certificados para processar`)
    
    // Verifica se certificados já existem
    const certificadosNovos = []
    
    for (const certificado of dadosAluno.certificados) {
      let certificadoJaExiste = false
      
      todosAlunosSnap.forEach(docSnap => {
        const data = docSnap.data()
        const certificados = Array.isArray(data.certificados) ? data.certificados : []
        const encontrado = certificados.find((c) => String(c.id) === String(certificado.id))
        if (encontrado) {
          certificadoJaExiste = true
          console.log(`⏭️ Certificado ${certificado.id} já existe no aluno ${data.nome}`)
        }
      })
      
      if (!certificadoJaExiste) {
        certificadosNovos.push(certificado)
        console.log(`✅ Certificado ${certificado.id} é novo`)
      }
    }
    
    if (certificadosNovos.length === 0) {
      console.log('❌ Todos os certificados já existem, pulando')
      continue
    }
    
    console.log(`✅ ${certificadosNovos.length} certificados novos para processar`)
    
    // Busca aluno por nome E documento
    let alunoEncontrado = null
    
    console.log(`🔍 Buscando aluno: "${dadosAluno.nome}" com documento "${dadosAluno.documento}"`)
    
    todosAlunosSnap.forEach(docSnap => {
      const data = docSnap.data()
      const nomeAluno = String(data.nome || '').trim()
      const documentoAluno = String(data.documento || '').trim()
      
      console.log(`  Comparando com: "${nomeAluno}" (${nomeAluno.length} chars) vs "${dadosAluno.nome}" (${dadosAluno.nome.length} chars)`)
      console.log(`  Documento: "${documentoAluno}" (${documentoAluno.length} chars) vs "${dadosAluno.documento}" (${dadosAluno.documento.length} chars)`)
      
      if (nomeAluno === dadosAluno.nome && documentoAluno === dadosAluno.documento) {
        alunoEncontrado = { doc: docSnap, data: data }
        console.log('✅ Aluno encontrado no banco!')
      }
    })
    
    if (alunoEncontrado) {
      console.log('📝 Adicionando certificados ao aluno existente')
      const certificados = Array.isArray(alunoEncontrado.data.certificados) ? alunoEncontrado.data.certificados : []
      console.log(`📊 Certificados existentes: ${certificados.length}`)
      
      certificadosNovos.forEach(certificado => {
        certificados.push(certificado)
        results.push({ id: alunoEncontrado.doc.id, planilhaId: certificado.id })
      })
      
      await updateDoc(alunoEncontrado.doc.ref, { certificados })
      console.log(`✅ ${certificadosNovos.length} certificados adicionados ao aluno existente`)
    } else {
      console.log('🆕 Criando novo aluno')
      const novoAluno = {
        nome: dadosAluno.nome,
        documento: dadosAluno.documento,
        empresa: dadosAluno.empresa,
        certificados: certificadosNovos
      }
      
      const docRef = await addDoc(alunosRef, novoAluno)
      certificadosNovos.forEach(certificado => {
        results.push({ id: docRef.id, planilhaId: certificado.id })
      })
      console.log(`✅ Novo aluno criado com ID: ${docRef.id}`)
    }
  }
  
  // Verifica resultado final
  console.log('\n📊 RESULTADO FINAL:')
  console.log(`✅ Certificados processados: ${results.length}`)
  
  const alunosFinaisSnap = await getDocs(alunosRef)
  console.log(`📊 Total de alunos no banco após processamento: ${alunosFinaisSnap.size}`)
  
  console.log('\n👥 Alunos finais no banco:')
  alunosFinaisSnap.forEach(docSnap => {
    const data = docSnap.data()
    const certificados = Array.isArray(data.certificados) ? data.certificados : []
    console.log(`  - ${data.nome} (${data.documento}) - ${certificados.length} certificados`)
    certificados.forEach(cert => {
      console.log(`    📄 ${cert.id} - ${cert.treinamento}`)
    })
  })
}

debugPlanilha().catch(console.error)

