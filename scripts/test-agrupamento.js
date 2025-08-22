const { initializeApp } = require('firebase/app')
const { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc } = require('firebase/firestore')

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

async function testarAgrupamento() {
  console.log('🧪 Testando nova lógica de agrupamento...')
  
  // Dados de teste - mesmo aluno com 3 certificados
  const dadosPlanilha = [
    {
      "id": "agrupa001",
      "aluno": "Pedro Santos",
      "documento": "555.666.777-88",
      "empresa": "EMPRESA TESTE",
      "treinamento": "CURSO A",
      "cargahoraria": "8",
      "instrutor": "Prof. Silva",
      "conclusao": "01/01/2025",
      "dataemissao": "02/01/2025"
    },
    {
      "id": "agrupa002",
      "aluno": "Pedro Santos",
      "documento": "555.666.777-88",
      "empresa": "EMPRESA TESTE",
      "treinamento": "CURSO B",
      "cargahoraria": "16",
      "instrutor": "Prof. Silva",
      "conclusao": "03/01/2025",
      "dataemissao": "04/01/2025"
    },
    {
      "id": "agrupa003",
      "aluno": "Pedro Santos",
      "documento": "555.666.777-88",
      "empresa": "EMPRESA TESTE",
      "treinamento": "CURSO C",
      "cargahoraria": "24",
      "instrutor": "Prof. Silva",
      "conclusao": "05/01/2025",
      "dataemissao": "06/01/2025"
    }
  ]
  
  // Limpa dados existentes
  console.log('🧹 Limpando dados existentes...')
  const todosAlunosRef = collection(firestore, "alunos")
  const todosAlunosSnap = await getDocs(todosAlunosRef)
  
  for (const docSnap of todosAlunosSnap.docs) {
    const data = docSnap.data()
    const certificados = Array.isArray(data.certificados) ? data.certificados : []
    const temCertificadosTeste = certificados.some(cert => 
      cert.id && (cert.id === 'agrupa001' || cert.id === 'agrupa002' || cert.id === 'agrupa003')
    )
    
    if (temCertificadosTeste) {
      console.log(`🗑️ Removendo aluno com certificados de teste: ${data.nome}`)
      await deleteDoc(docSnap.ref)
    }
  }
  
  // Simula a nova lógica da API
  console.log('📋 Agrupando certificados por documento...')
  const certificadosPorDocumento = {}
  
  for (let i = 0; i < dadosPlanilha.length; i++) {
    const row = dadosPlanilha[i]
    const planilhaId = row["id"]
    const nome = row["aluno"].trim()
    const documento = String(row["documento"]).trim()
    
    if (!planilhaId || !nome || !documento) {
      console.log(`❌ Pulando linha ${i + 1} - dados inválidos`)
      continue
    }
    
    if (!certificadosPorDocumento[documento]) {
      certificadosPorDocumento[documento] = {
        nome: nome,
        documento: documento,
        empresa: row["empresa"] || '',
        certificados: []
      }
    }
    
    const certificado = {
      cargaHoraria: Number(row["cargahoraria"]) || 0,
      dataConclusao: row["conclusao"] || '',
      dataEmissao: row["dataemissao"] || '',
      documento: documento,
      empresa: row["empresa"] || '',
      id: planilhaId,
      instrutor: row["instrutor"] || '',
      nome: nome,
      treinamento: row["treinamento"] || ''
    }
    
    certificadosPorDocumento[documento].certificados.push(certificado)
  }
  
  console.log('📊 Certificados agrupados por documento:', Object.keys(certificadosPorDocumento).length)
  
  // Processa cada documento
  const alunosRef = collection(firestore, "alunos")
  const results = []
  
  for (const [documento, dadosAluno] of Object.entries(certificadosPorDocumento)) {
    console.log(`\n=== PROCESSANDO DOCUMENTO: ${documento} ===`)
    console.log(`👤 Aluno: ${dadosAluno.nome} - ${dadosAluno.certificados.length} certificados`)
    
    // Verifica se certificados já existem
    const todosAlunosSnap2 = await getDocs(alunosRef)
    const certificadosNovos = []
    
    for (const certificado of dadosAluno.certificados) {
      let certificadoJaExiste = false
      
      todosAlunosSnap2.forEach(docSnap => {
        const data = docSnap.data()
        const certificados = Array.isArray(data.certificados) ? data.certificados : []
        const encontrado = certificados.find((c) => String(c.id) === String(certificado.id))
        if (encontrado) {
          certificadoJaExiste = true
        }
      })
      
      if (!certificadoJaExiste) {
        certificadosNovos.push(certificado)
      } else {
        console.log(`⏭️ Certificado ${certificado.id} já existe, pulando`)
      }
    }
    
    if (certificadosNovos.length === 0) {
      console.log('❌ Todos os certificados já existem, pulando documento')
      continue
    }
    
    console.log(`✅ ${certificadosNovos.length} certificados novos para processar`)
    
    // Busca aluno por documento
    let alunoEncontrado = null
    
    todosAlunosSnap2.forEach(docSnap => {
      const data = docSnap.data()
      const documentoAluno = String(data.documento || '').trim()
      
      if (documentoAluno === documento) {
        alunoEncontrado = { doc: docSnap, data: data }
        console.log('✅ Aluno encontrado no banco!')
      }
    })
    
    if (alunoEncontrado) {
      // Aluno já existe, adiciona certificados ao array
      const certificados = Array.isArray(alunoEncontrado.data.certificados) ? alunoEncontrado.data.certificados : []
      console.log(`📊 Certificados existentes: ${certificados.length}`)
      
      certificadosNovos.forEach(certificado => {
        certificados.push(certificado)
        results.push({ id: alunoEncontrado.doc.id, planilhaId: certificado.id })
      })
      
      await updateDoc(alunoEncontrado.doc.ref, { certificados })
      console.log(`✅ ${certificadosNovos.length} certificados adicionados ao aluno existente`)
    } else {
      // Aluno não existe, cria novo com todos os certificados
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
      console.log(`✅ Novo aluno criado com ${certificadosNovos.length} certificados`)
    }
  }
  
  // Verifica resultado
  console.log('\n=== RESULTADO FINAL ===')
  const todosAlunosSnapFinal = await getDocs(alunosRef)
  
  todosAlunosSnapFinal.forEach(docSnap => {
    const data = docSnap.data()
    const certificados = Array.isArray(data.certificados) ? data.certificados : []
    console.log(`👤 ${data.nome} (${data.documento}) - ${certificados.length} certificados`)
    certificados.forEach(cert => {
      console.log(`  📄 ${cert.id} - ${cert.treinamento}`)
    })
  })
  
  // Verifica especificamente o documento de teste
  const qTeste = query(alunosRef, where("documento", "==", "555.666.777-88"))
  const testeSnap = await getDocs(qTeste)
  
  if (!testeSnap.empty) {
    const alunoTeste = testeSnap.docs[0].data()
    const certificadosTeste = Array.isArray(alunoTeste.certificados) ? alunoTeste.certificados : []
    console.log(`\n🎯 RESULTADO: ${alunoTeste.nome} tem ${certificadosTeste.length} certificados`)
    
    if (certificadosTeste.length === 3) {
      console.log('🎉 SUCESSO! Todos os 3 certificados foram agrupados em 1 aluno!')
    } else {
      console.log('❌ FALHA! Certificados não foram agrupados corretamente.')
    }
  } else {
    console.log('❌ ERRO! Aluno não foi encontrado!')
  }
  
  console.log(`\n📊 Processados: ${results.length}`)
}

// Executa o teste
testarAgrupamento()
  .then(() => {
    console.log('\n🎉 Teste concluído!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erro no teste:', error)
    process.exit(1)
  })



