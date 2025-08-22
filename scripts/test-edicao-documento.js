const { initializeApp } = require('firebase/app')
const { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc } = require('firebase/firestore')

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

async function testarEdicaoDocumento() {
  console.log('🧪 Testando edição de certificado com mudança de documento...')
  
  // 1. Criar um aluno de teste com certificado
  console.log('\n📝 1. Criando aluno de teste...')
  const alunosRef = collection(firestore, "alunos")
  
  const alunoTeste = {
    nome: "João Silva Teste",
    documento: "123456789",
    empresa: "Empresa Teste",
    certificados: [
      {
        id: "cert-teste-001",
        cargaHoraria: "16",
        dataConclusao: "01/01/2024",
        dataEmissao: "01/01/2024",
        documento: "123456789",
        empresa: "Empresa Teste",
        instrutor: "Instrutor Teste",
        nome: "João Silva Teste",
        treinamento: "Treinamento Teste"
      }
    ]
  }
  
  const docRef = await addDoc(alunosRef, alunoTeste)
  console.log('✅ Aluno de teste criado com ID:', docRef.id)
  
  // 2. Simular edição do certificado mudando o documento
  console.log('\n📝 2. Simulando edição do certificado...')
  const certificadoEditado = {
    ...alunoTeste.certificados[0],
    documento: "987654321", // Novo documento
    nome: "João Silva Teste Editado" // Também mudando o nome
  }
  
  console.log('🔍 Mudanças detectadas:')
  console.log('  - Documento antigo:', alunoTeste.certificados[0].documento)
  console.log('  - Documento novo:', certificadoEditado.documento)
  console.log('  - Nome antigo:', alunoTeste.certificados[0].nome)
  console.log('  - Nome novo:', certificadoEditado.nome)
  
  // 3. Verificar se existe aluno com o novo documento
  console.log('\n🔍 3. Verificando se existe aluno com novo documento...')
  const qNovoAluno = query(alunosRef, where("documento", "==", "987654321"))
  const novoAlunoSnap = await getDocs(qNovoAluno)
  
  if (!novoAlunoSnap.empty) {
    console.log('✅ Aluno com novo documento já existe!')
    const novoAlunoDoc = novoAlunoSnap.docs[0]
    const novoAlunoData = novoAlunoDoc.data()
    
    // Adicionar certificado ao aluno existente
    const novosCertificados = Array.isArray(novoAlunoData.certificados) ? [...novoAlunoData.certificados] : []
    novosCertificados.push(certificadoEditado)
    await updateDoc(novoAlunoDoc.ref, { certificados: novosCertificados })
    console.log('✅ Certificado adicionado ao aluno existente')
  } else {
    console.log('🆕 Aluno com novo documento não existe, criando novo...')
    
    // Criar novo aluno
    const novoAluno = {
      nome: certificadoEditado.nome,
      documento: certificadoEditado.documento,
      empresa: certificadoEditado.empresa,
      certificados: [certificadoEditado]
    }
    
    const novoDocRef = await addDoc(alunosRef, novoAluno)
    console.log('✅ Novo aluno criado com ID:', novoDocRef.id)
  }
  
  // 4. Remover certificado do aluno antigo
  console.log('\n🗑️ 4. Removendo certificado do aluno antigo...')
  const alunoAntigoRef = doc(firestore, "alunos", docRef.id)
  const alunoAntigoSnap = await getDoc(alunoAntigoRef)
  
  if (alunoAntigoSnap.exists()) {
    const alunoAntigoData = alunoAntigoSnap.data()
    const certificadosAntigos = Array.isArray(alunoAntigoData.certificados) ? [...alunoAntigoData.certificados] : []
    const certificadosFiltrados = certificadosAntigos.filter(cert => cert.id !== "cert-teste-001")
    
    await updateDoc(alunoAntigoRef, { certificados: certificadosFiltrados })
    console.log('✅ Certificado removido do aluno antigo')
  }
  
  // 5. Verificar resultado
  console.log('\n📊 5. Verificando resultado...')
  
  // Verificar aluno antigo
  const alunoAntigoFinal = await getDoc(alunoAntigoRef)
  if (alunoAntigoFinal.exists()) {
    const certificadosAntigos = alunoAntigoFinal.data().certificados || []
    console.log(`📋 Aluno antigo (${alunoAntigoFinal.data().nome}): ${certificadosAntigos.length} certificados`)
  }
  
  // Verificar aluno novo
  const qAlunoNovo = query(alunosRef, where("documento", "==", "987654321"))
  const alunoNovoSnap = await getDocs(qAlunoNovo)
  
  if (!alunoNovoSnap.empty) {
    const alunoNovo = alunoNovoSnap.docs[0].data()
    console.log(`📋 Aluno novo (${alunoNovo.nome}): ${alunoNovo.certificados.length} certificados`)
    console.log('✅ Teste concluído com sucesso!')
  } else {
    console.log('❌ Erro: Aluno novo não foi encontrado!')
  }
  
  // 6. Limpeza
  console.log('\n🧹 6. Limpando dados de teste...')
  
  // Remover aluno antigo se não tiver certificados
  const alunoAntigoFinal2 = await getDoc(alunoAntigoRef)
  if (alunoAntigoFinal2.exists()) {
    const certificadosAntigos = alunoAntigoFinal2.data().certificados || []
    if (certificadosAntigos.length === 0) {
      // Aluno sem certificados, pode ser removido
      console.log('🗑️ Aluno antigo sem certificados pode ser removido')
    }
  }
  
  // Remover aluno novo
  const qAlunoNovo2 = query(alunosRef, where("documento", "==", "987654321"))
  const alunoNovoSnap2 = await getDocs(qAlunoNovo2)
  
  if (!alunoNovoSnap2.empty) {
    console.log('🗑️ Aluno novo de teste pode ser removido')
  }
  
  console.log('\n✅ Teste de edição de documento concluído!')
}

testarEdicaoDocumento().catch(console.error)



