const { initializeApp } = require('firebase/app')
const { getFirestore, collection, query, where, getDocs, addDoc, updateDoc } = require('firebase/firestore')

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

async function simularUploadPlanilha() {
  console.log('🧪 Simulando upload de planilha...')
  
  // Simula dados de uma planilha Excel (como seria processado pelo XLSX)
  const dadosPlanilha = [
    {
      "id": "cert001",
      "aluno": "João Silva",
      "documento": "123456789",
      "empresa": "Empresa A",
      "treinamento": "Treinamento 1",
      "cargahoraria": "16",
      "instrutor": "Instrutor 1",
      "conclusao": "01/01/2024",
      "dataemissao": "01/01/2024"
    },
    {
      "id": "cert002", 
      "aluno": "João Silva",
      "documento": "123456789",
      "empresa": "Empresa A",
      "treinamento": "Treinamento 2",
      "cargahoraria": "20",
      "instrutor": "Instrutor 2",
      "conclusao": "02/01/2024",
      "dataemissao": "02/01/2024"
    },
    {
      "id": "cert003",
      "aluno": "João Silva",
      "documento": "123456789", 
      "empresa": "Empresa A",
      "treinamento": "Treinamento 3",
      "cargahoraria": "24",
      "instrutor": "Instrutor 3",
      "conclusao": "03/01/2024",
      "dataemissao": "03/01/2024"
    }
  ]
  
  console.log('📋 Dados da planilha simulada:', dadosPlanilha)
  console.log('📝 Cenário: 3 certificados do mesmo aluno (mesmo nome e documento)')
  
  const alunosRef = collection(firestore, "alunos")
  const results = []
  const skipped = []
  
  for (let i = 0; i < dadosPlanilha.length; i++) {
    const row = dadosPlanilha[i]
    console.log(`\n=== PROCESSANDO LINHA ${i + 1}/${dadosPlanilha.length} ===`)
    console.log('📝 Dados da linha:', row)
    
    const planilhaId = row["id"] || ""
    
    if (!planilhaId) {
      console.log('❌ Pulando linha - ID vazio')
      skipped.push({ linha: row, motivo: "ID vazio" })
      continue
    }
    
    const nome = (row["aluno"] || "").trim()
    const documento = String(row["documento"] || "").trim()
    
    console.log('📝 Dados extraídos da linha:', {
      nomeOriginal: row["aluno"],
      documentoOriginal: row["documento"],
      nomeNormalizado: nome,
      documentoNormalizado: documento
    })
    
    if (!nome || !documento) {
      console.log('❌ Pulando linha - Nome ou documento vazio:', { nome, documento })
      skipped.push({ linha: row, motivo: "Nome ou documento vazio" })
      continue
    }
    
    console.log('Verificando se certificado já existe no banco (ID:', planilhaId, ')')
    
    // Primeiro, verifica se o certificado já existe em qualquer aluno (pelo ID)
    const todosAlunosRef = collection(firestore, "alunos")
    const todosAlunosSnap = await getDocs(todosAlunosRef)
    let certificadoJaExiste = false
    
    console.log('🔍 Verificando certificados existentes no banco...')
    todosAlunosSnap.forEach(docSnap => {
      const data = docSnap.data()
      const certificados = Array.isArray(data.certificados) ? data.certificados : []
      console.log('👤 Verificando certificados do aluno:', data.nome, 'IDs:', certificados.map((c) => c.id))
      const encontrado = certificados.find((c) => String(c.id) === String(planilhaId))
      if (encontrado) {
        certificadoJaExiste = true
        console.log('❌ Certificado já existe no banco, pulando. ID:', planilhaId, 'Aluno:', data.nome)
      }
    })
    
    if (certificadoJaExiste) {
      console.log('❌ Certificado já existe, pulando linha')
      skipped.push({ linha: row, motivo: "Certificado já existe no banco de dados", id: planilhaId })
      continue
    }
    
    console.log('✅ Certificado não existe no banco, prosseguindo...')
    console.log('📋 Dados da linha:', {
      planilhaId,
      nome,
      documento,
      empresa: row["empresa"] || '',
      treinamento: row["treinamento"] || ''
    })
    console.log('🔍 Buscando aluno por documento:', { documento })
    
    // Busca aluno por documento (identificação única)
    const q = query(alunosRef, where("documento", "==", documento))
    const querySnapshot = await getDocs(q)
    
    console.log('🔍 Resultado da busca por documento:', {
      documento: documento,
      encontrou: !querySnapshot.empty,
      totalEncontrados: querySnapshot.size
    })
    
    // Debug: mostra todos os alunos existentes para comparação
    console.log('🔍 Verificando todos os alunos existentes...')
    const todosAlunosSnap2 = await getDocs(todosAlunosRef)
    todosAlunosSnap2.forEach(docSnap => {
      const data = docSnap.data()
      console.log(`👤 Aluno existente: "${data.nome}" - Documento: "${data.documento}" (${data.documento.length} chars)`)
    })
    
    // Garantir que todos os campos tenham valores válidos
    const cargaHoraria = Number(row["cargahoraria"] || 0)
    const dataConclusao = row["conclusao"] || ''
    const dataEmissao = row["dataemissao"] || ''
    const empresa = row["empresa"] || ''
    const instrutor = row["instrutor"] || ''
    const treinamento = row["treinamento"] || ''
    
    const certificado = {
      cargaHoraria: isNaN(cargaHoraria) ? 0 : cargaHoraria,
      dataConclusao: dataConclusao || '',
      dataEmissao: dataEmissao || '',
      documento: documento || '',
      empresa: empresa || '',
      id: planilhaId || '',
      instrutor: instrutor || '',
      nome: nome || '',
      treinamento: treinamento || ''
    }
    
    console.log('Certificado preparado:', certificado)
    
    if (!querySnapshot.empty) {
      console.log('✅ Aluno encontrado, adicionando certificado ao array')
      // Aluno já existe, adiciona certificado ao array (já verificamos que o certificado não existe)
      const alunoDoc = querySnapshot.docs[0]
      const alunoData = alunoDoc.data()
      const certificados = Array.isArray(alunoData.certificados) ? alunoData.certificados : []
      console.log('📊 Certificados existentes:', certificados.length)
      console.log('👤 Aluno encontrado:', alunoData.nome, 'ID do documento:', alunoDoc.id)
      
      // Adiciona o certificado ao array
      console.log('➕ Adicionando novo certificado ao aluno existente')
      certificados.push(certificado)
      console.log('📊 Array de certificados após adição:', certificados.length, 'certificados')
      await updateDoc(alunoDoc.ref, { certificados })
      results.push({ id: alunoDoc.id, planilhaId })
      console.log('✅ Certificado adicionado com sucesso ao aluno:', alunoData.nome)
      continue
    }
    
    console.log('🆕 Aluno não encontrado, criando novo documento')
    // Aluno não existe, cria novo documento
    const novoAluno = {
      nome: nome || '',
      documento: documento || '',
      empresa: empresa || '',
      certificados: [certificado]
    }
    console.log('📝 Criando novo aluno da planilha:', novoAluno)
    
    try {
      const docRef = await addDoc(alunosRef, novoAluno)
      results.push({ id: docRef.id, planilhaId })
      console.log('✅ Novo aluno criado com sucesso:', docRef.id, 'Nome:', nome)
    } catch (error) {
      console.error('❌ Erro ao criar novo aluno:', error)
      skipped.push({ linha: row, motivo: "Erro ao criar aluno", id: planilhaId, error: error.message })
    }
  }
  
  // Verifica resultado final
  console.log('\n=== VERIFICANDO RESULTADO FINAL ===')
  const todosAlunosRef = collection(firestore, "alunos")
  const todosAlunosSnap = await getDocs(todosAlunosRef)
  
  console.log('📊 Total de alunos no banco:', todosAlunosSnap.size)
  
  todosAlunosSnap.forEach(docSnap => {
    const data = docSnap.data()
    const certificados = Array.isArray(data.certificados) ? data.certificados : []
    console.log(`👤 Aluno: ${data.nome} (${data.documento}) - ${certificados.length} certificados`)
    certificados.forEach(cert => {
      console.log(`  📄 Certificado ID: ${cert.id} - ${cert.treinamento}`)
    })
  })
  
  // Verifica especificamente o documento de teste
  console.log('\n=== VERIFICANDO DOCUMENTO DE TESTE (123456789) ===')
  const qTeste = query(todosAlunosRef, where("documento", "==", "123456789"))
  const testeSnap = await getDocs(qTeste)
  
  if (!testeSnap.empty) {
    const alunoTeste = testeSnap.docs[0].data()
    const certificadosTeste = Array.isArray(alunoTeste.certificados) ? alunoTeste.certificados : []
    console.log(`✅ Aluno encontrado: ${alunoTeste.nome} (${alunoTeste.documento})`)
    console.log(`📊 Total de certificados: ${certificadosTeste.length}`)
    
    if (certificadosTeste.length === 3) {
      console.log('🎉 SUCESSO! Todos os 3 certificados foram agrupados no mesmo aluno!')
    } else {
      console.log('⚠️ ATENÇÃO! Nem todos os certificados foram agrupados.')
      console.log(`Esperado: 3, Encontrado: ${certificadosTeste.length}`)
    }
  } else {
    console.log('❌ ERRO! Aluno com documento 123456789 não foi encontrado!')
  }
  
  console.log('\n📊 Resumo do processamento:')
  console.log(`✅ Processados: ${results.length}`)
  console.log(`⏭️ Pulados: ${skipped.length}`)
  console.log(`📋 Resultados:`, results)
  console.log(`⚠️ Pulados:`, skipped)
}

// Executa o teste
simularUploadPlanilha()
  .then(() => {
    console.log('\n🎉 Teste concluído!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erro no teste:', error)
    process.exit(1)
  })
