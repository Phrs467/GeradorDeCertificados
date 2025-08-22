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

async function testarAPIReal() {
  console.log('🧪 Testando lógica da API real...')
  
  // Simula exatamente os dados que vêm da planilha Excel
  const dadosPlanilha = [
    {
      "id": "teste001",
      "aluno": "João Silva",
      "documento": "123.456.789-00",
      "empresa": "EMPRESA TESTE",
      "treinamento": "TREINAMENTO 1",
      "cargahoraria": "8",
      "instrutor": "Instrutor 1",
      "conclusao": "01 de janeiro de 2025",
      "dataemissao": "02 de janeiro de 2025"
    },
    {
      "id": "teste002",
      "aluno": "João Silva",
      "documento": "123.456.789-00",
      "empresa": "EMPRESA TESTE",
      "treinamento": "TREINAMENTO 2",
      "cargahoraria": "16",
      "instrutor": "Instrutor 2",
      "conclusao": "03 de janeiro de 2025",
      "dataemissao": "04 de janeiro de 2025"
    },
    {
      "id": "teste003",
      "aluno": "João Silva",
      "documento": "123.456.789-00",
      "empresa": "EMPRESA TESTE",
      "treinamento": "TREINAMENTO 3",
      "cargahoraria": "24",
      "instrutor": "Instrutor 3",
      "conclusao": "05 de janeiro de 2025",
      "dataemissao": "06 de janeiro de 2025"
    }
  ]
  
  console.log('🚀 INICIANDO PROCESSAMENTO DA PLANILHA');
  console.log('📊 Total de linhas a processar:', dadosPlanilha.length);
  console.log('📋 Primeiras 3 linhas da planilha:', dadosPlanilha.slice(0, 3));
  
  const alunosRef = collection(firestore, "alunos")
  const results = []
  const skipped = []
  
  // Primeiro, vamos limpar dados existentes com esses IDs
  console.log('🧹 Limpando dados existentes com esses IDs...')
  const todosAlunosRef = collection(firestore, "alunos")
  const todosAlunosSnap = await getDocs(todosAlunosRef)
  
  for (const docSnap of todosAlunosSnap.docs) {
    const data = docSnap.data()
    const certificados = Array.isArray(data.certificados) ? data.certificados : []
    const temCertificadosTeste = certificados.some(cert => 
      cert.id && (cert.id === 'teste001' || cert.id === 'teste002' || cert.id === 'teste003')
    )
    
    if (temCertificadosTeste) {
      console.log(`🗑️ Removendo aluno com certificados de teste: ${data.nome}`)
      await deleteDoc(docSnap.ref)
    }
  }
  
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
    const todosAlunosRef2 = collection(firestore, "alunos")
    const todosAlunosSnap2 = await getDocs(todosAlunosRef2)
    let certificadoJaExiste = false
    
    console.log('🔍 Verificando certificados existentes no banco...')
    todosAlunosSnap2.forEach(docSnap => {
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
    
    // Verificação adicional: busca manual em todos os alunos para evitar race conditions
    console.log('🔍 Verificação adicional - buscando manualmente em todos os alunos...');
    const todosAlunosRef3 = collection(firestore, "alunos");
    const todosAlunosSnap3 = await getDocs(todosAlunosRef3);
    let alunoEncontradoManual = null;
    
    console.log(`🔍 Buscando manualmente por documento: "${documento}"`);
    console.log(`🔍 Total de alunos no banco: ${todosAlunosSnap3.size}`);
    
    todosAlunosSnap3.forEach(docSnap => {
      const data = docSnap.data();
      const nomeAluno = data.nome || '';
      const documentoAluno = String(data.documento || '');
      
      console.log(`👤 Aluno no banco: "${nomeAluno}" - Documento: "${documentoAluno}"`);
      console.log(`📊 Comparação: "${documentoAluno}" === "${documento}" = ${documentoAluno === documento}`);
      
      if (documentoAluno.trim() === documento) {
        alunoEncontradoManual = { doc: docSnap, data: data };
        console.log('✅ Aluno encontrado manualmente por documento!');
      }
    });
    
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
      console.log('✅ Aluno encontrado via query, adicionando certificado ao array')
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
    } else if (alunoEncontradoManual) {
      console.log('✅ Aluno encontrado manualmente, adicionando certificado ao array')
      // Aluno encontrado manualmente, adiciona certificado ao array
      const alunoDoc = alunoEncontradoManual.doc
      const alunoData = alunoEncontradoManual.data
      const certificados = Array.isArray(alunoData.certificados) ? alunoData.certificados : []
      console.log('📊 Certificados existentes:', certificados.length)
      console.log('👤 Aluno encontrado manualmente:', alunoData.nome, 'ID do documento:', alunoDoc.id)
      
      // Adiciona o certificado ao array
      console.log('➕ Adicionando novo certificado ao aluno existente (manual)')
      certificados.push(certificado)
      console.log('📊 Array de certificados após adição:', certificados.length, 'certificados')
      await updateDoc(alunoDoc.ref, { certificados })
      results.push({ id: alunoDoc.id, planilhaId })
      console.log('✅ Certificado adicionado com sucesso ao aluno (manual):', alunoData.nome)
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
  const todosAlunosRefFinal = collection(firestore, "alunos")
  const todosAlunosSnapFinal = await getDocs(todosAlunosRefFinal)
  
  console.log('📊 Total de alunos no banco:', todosAlunosSnapFinal.size)
  
  todosAlunosSnapFinal.forEach(docSnap => {
    const data = docSnap.data()
    const certificados = Array.isArray(data.certificados) ? data.certificados : []
    console.log(`👤 Aluno: ${data.nome} (${data.documento}) - ${certificados.length} certificados`)
    certificados.forEach(cert => {
      console.log(`  📄 Certificado ID: ${cert.id} - ${cert.treinamento}`)
    })
  })
  
  // Verifica especificamente o documento de teste
  console.log('\n=== VERIFICANDO DOCUMENTO DE TESTE (123.456.789-00) ===')
  const qTeste = query(todosAlunosRefFinal, where("documento", "==", "123.456.789-00"))
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
    console.log('❌ ERRO! Aluno com documento 123.456.789-00 não foi encontrado!')
  }
  
  console.log('\n📊 Resumo do processamento:')
  console.log(`✅ Processados: ${results.length}`)
  console.log(`⏭️ Pulados: ${skipped.length}`)
  console.log(`📋 Resultados:`, results)
  console.log(`⚠️ Pulados:`, skipped)
}

// Executa o teste
testarAPIReal()
  .then(() => {
    console.log('\n🎉 Teste concluído!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erro no teste:', error)
    process.exit(1)
  })



