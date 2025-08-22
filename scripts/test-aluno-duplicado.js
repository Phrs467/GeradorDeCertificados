const { initializeApp } = require('firebase/app')
const { getFirestore, collection, query, where, getDocs, addDoc, updateDoc } = require('firebase/firestore')

// Configuração do Firebase (substitua pelos seus dados)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Inicializa Firebase
const app = initializeApp(firebaseConfig)
const firestore = getFirestore(app)

async function testarBuscaAluno() {
  console.log('🧪 Testando busca de aluno...')
  
  // Dados de teste - mesmo aluno com 3 certificados diferentes
  const certificadosTeste = [
    {
      id: 'teste001',
      nome: 'João Silva',
      documento: '123456789',
      empresa: 'Empresa A',
      treinamento: 'Treinamento 1',
      cargaHoraria: '16',
      instrutor: 'Instrutor 1',
      dataConclusao: '01/01/2024',
      dataEmissao: '01/01/2024'
    },
    {
      id: 'teste002',
      nome: 'João Silva',
      documento: '123456789',
      empresa: 'Empresa A',
      treinamento: 'Treinamento 2',
      cargaHoraria: '20',
      instrutor: 'Instrutor 2',
      dataConclusao: '02/01/2024',
      dataEmissao: '02/01/2024'
    },
    {
      id: 'teste003',
      nome: 'João Silva',
      documento: '123456789',
      empresa: 'Empresa A',
      treinamento: 'Treinamento 3',
      cargaHoraria: '24',
      instrutor: 'Instrutor 3',
      dataConclusao: '03/01/2024',
      dataEmissao: '03/01/2024'
    }
  ]
  
  console.log('📋 Processando certificados de teste...')
  
  for (let i = 0; i < certificadosTeste.length; i++) {
    const certificado = certificadosTeste[i]
    console.log(`\n=== PROCESSANDO CERTIFICADO ${i + 1}/${certificadosTeste.length} ===`)
    console.log('📝 Dados do certificado:', certificado)
    
    // Verifica se o certificado já existe
    console.log('🔍 Verificando se certificado já existe...')
    const todosAlunosRef = collection(firestore, "alunos")
    const todosAlunosSnap = await getDocs(todosAlunosRef)
    let certificadoJaExiste = false
    
    todosAlunosSnap.forEach(docSnap => {
      const data = docSnap.data()
      const certificados = Array.isArray(data.certificados) ? data.certificados : []
      const encontrado = certificados.find((c) => String(c.id) === String(certificado.id))
      if (encontrado) {
        certificadoJaExiste = true
        console.log('❌ Certificado já existe no aluno:', data.nome)
      }
    })
    
    if (certificadoJaExiste) {
      console.log('⏭️ Certificado já existe, pulando...')
      continue
    }
    
    // Busca aluno por nome+documento
    console.log('🔍 Buscando aluno por nome e documento...')
    const alunosRef = collection(firestore, "alunos")
    const q = query(alunosRef, where("nome", "==", certificado.nome), where("documento", "==", certificado.documento))
    const querySnapshot = await getDocs(q)
    
    console.log('📊 Resultado da busca:', querySnapshot.empty ? 'Nenhum aluno encontrado' : 'Aluno encontrado')
    
    if (!querySnapshot.empty) {
      console.log('✅ Aluno encontrado, adicionando certificado...')
      const alunoDoc = querySnapshot.docs[0]
      const alunoData = alunoDoc.data()
      const certificados = Array.isArray(alunoData.certificados) ? alunoData.certificados : []
      
      console.log('📊 Certificados existentes:', certificados.length)
      console.log('👤 Aluno:', alunoData.nome, 'ID:', alunoDoc.id)
      
      certificados.push(certificado)
      await updateDoc(alunoDoc.ref, { certificados })
      console.log('✅ Certificado adicionado com sucesso')
    } else {
      console.log('🆕 Aluno não encontrado, criando novo...')
      const novoAluno = {
        nome: certificado.nome,
        documento: certificado.documento,
        empresa: certificado.empresa,
        certificados: [certificado]
      }
      
      const docRef = await addDoc(alunosRef, novoAluno)
      console.log('✅ Novo aluno criado com ID:', docRef.id)
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
}

// Executa o teste
testarBuscaAluno()
  .then(() => {
    console.log('\n🎉 Teste concluído!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erro no teste:', error)
    process.exit(1)
  })





