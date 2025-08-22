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

async function testarUploadSimples() {
  console.log('🧪 Testando upload simples...')
  
  // Dados de teste simples
  const dadosTeste = [
    {
      "id": "simples001",
      "aluno": "Maria Santos",
      "documento": "111.222.333-44",
      "empresa": "EMPRESA TESTE",
      "treinamento": "CURSO 1",
      "cargahoraria": "8",
      "instrutor": "Prof. Silva",
      "conclusao": "01/01/2025",
      "dataemissao": "02/01/2025"
    },
    {
      "id": "simples002",
      "aluno": "Maria Santos",
      "documento": "111.222.333-44",
      "empresa": "EMPRESA TESTE",
      "treinamento": "CURSO 2",
      "cargahoraria": "16",
      "instrutor": "Prof. Silva",
      "conclusao": "03/01/2025",
      "dataemissao": "04/01/2025"
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
      cert.id && (cert.id === 'simples001' || cert.id === 'simples002')
    )
    
    if (temCertificadosTeste) {
      console.log(`🗑️ Removendo aluno com certificados de teste: ${data.nome}`)
      await deleteDoc(docSnap.ref)
    }
  }
  
  // Processa os dados
  const alunosRef = collection(firestore, "alunos")
  const results = []
  
  for (let i = 0; i < dadosTeste.length; i++) {
    const row = dadosTeste[i]
    console.log(`\n=== PROCESSANDO LINHA ${i + 1}/${dadosTeste.length} ===`)
    
    const planilhaId = row["id"]
    const nome = row["aluno"].trim()
    const documento = String(row["documento"]).trim()
    
    console.log(`📝 Processando: ${nome} (${documento}) - ID: ${planilhaId}`)
    
    // Verifica se certificado já existe
    const todosAlunosSnap2 = await getDocs(alunosRef)
    let certificadoJaExiste = false
    
    todosAlunosSnap2.forEach(docSnap => {
      const data = docSnap.data()
      const certificados = Array.isArray(data.certificados) ? data.certificados : []
      const encontrado = certificados.find((c) => String(c.id) === String(planilhaId))
      if (encontrado) {
        certificadoJaExiste = true
      }
    })
    
    if (certificadoJaExiste) {
      console.log('❌ Certificado já existe, pulando')
      continue
    }
    
    // Busca aluno por documento
    console.log('🔍 Buscando aluno por documento:', documento)
    let alunoEncontrado = null
    
    todosAlunosSnap2.forEach(docSnap => {
      const data = docSnap.data()
      const documentoAluno = String(data.documento || '').trim()
      
      if (documentoAluno === documento) {
        alunoEncontrado = { doc: docSnap, data: data }
        console.log('✅ Aluno encontrado:', data.nome)
      }
    })
    
    // Prepara certificado
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
    
    if (alunoEncontrado) {
      // Adiciona certificado ao aluno existente
      const certificados = Array.isArray(alunoEncontrado.data.certificados) ? alunoEncontrado.data.certificados : []
      certificados.push(certificado)
      await updateDoc(alunoEncontrado.doc.ref, { certificados })
      results.push({ id: alunoEncontrado.doc.id, planilhaId })
      console.log('✅ Certificado adicionado ao aluno existente')
    } else {
      // Cria novo aluno
      const novoAluno = {
        nome: nome,
        documento: documento,
        empresa: row["empresa"] || '',
        certificados: [certificado]
      }
      const docRef = await addDoc(alunosRef, novoAluno)
      results.push({ id: docRef.id, planilhaId })
      console.log('✅ Novo aluno criado')
    }
  }
  
  // Verifica resultado
  console.log('\n=== RESULTADO FINAL ===')
  const todosAlunosSnapFinal = await getDocs(alunosRef)
  
  todosAlunosSnapFinal.forEach(docSnap => {
    const data = docSnap.data()
    const certificados = Array.isArray(data.certificados) ? data.certificados : []
    console.log(`👤 ${data.nome} (${data.documento}) - ${certificados.length} certificados`)
  })
  
  // Verifica especificamente o documento de teste
  const qTeste = query(alunosRef, where("documento", "==", "111.222.333-44"))
  const testeSnap = await getDocs(qTeste)
  
  if (!testeSnap.empty) {
    const alunoTeste = testeSnap.docs[0].data()
    const certificadosTeste = Array.isArray(alunoTeste.certificados) ? alunoTeste.certificados : []
    console.log(`\n🎯 RESULTADO: ${alunoTeste.nome} tem ${certificadosTeste.length} certificados`)
    
    if (certificadosTeste.length === 2) {
      console.log('🎉 SUCESSO! Certificados agrupados corretamente!')
    } else {
      console.log('❌ FALHA! Certificados não foram agrupados.')
    }
  }
  
  console.log(`\n📊 Processados: ${results.length}`)
}

// Executa o teste
testarUploadSimples()
  .then(() => {
    console.log('\n🎉 Teste concluído!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erro no teste:', error)
    process.exit(1)
  })



