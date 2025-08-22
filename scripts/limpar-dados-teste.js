const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, deleteDoc } = require('firebase/firestore')

// Configuração do Firebase
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

async function limparDadosTeste() {
  console.log('🧹 Limpando dados de teste...')
  
  const alunosRef = collection(firestore, "alunos")
  const alunosSnap = await getDocs(alunosRef)
  
  console.log(`📊 Total de alunos encontrados: ${alunosSnap.size}`)
  
  let alunosRemovidos = 0
  
  for (const docSnap of alunosSnap.docs) {
    const data = docSnap.data()
    const nome = data.nome || ''
    const certificados = Array.isArray(data.certificados) ? data.certificados : []
    
    // Verifica se é um aluno de teste (contém certificados com IDs de teste)
    const temCertificadosTeste = certificados.some(cert => 
      cert.id && (cert.id.startsWith('teste') || cert.id.includes('teste'))
    )
    
    // Verifica se é um aluno com nome de teste
    const nomeTeste = nome.toLowerCase().includes('teste') || nome.toLowerCase().includes('joão silva')
    
    if (temCertificadosTeste || nomeTeste) {
      console.log(`🗑️ Removendo aluno de teste: ${nome} (${certificados.length} certificados)`)
      await deleteDoc(docSnap.ref)
      alunosRemovidos++
    } else {
      console.log(`👤 Mantendo aluno: ${nome} (${certificados.length} certificados)`)
    }
  }
  
  console.log(`\n✅ Limpeza concluída!`)
  console.log(`🗑️ Alunos removidos: ${alunosRemovidos}`)
  console.log(`👤 Alunos mantidos: ${alunosSnap.size - alunosRemovidos}`)
}

// Executa a limpeza
limparDadosTeste()
  .then(() => {
    console.log('\n🎉 Limpeza finalizada!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erro na limpeza:', error)
    process.exit(1)
  })





