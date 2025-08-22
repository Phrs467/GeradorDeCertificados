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

async function consolidarAlunos() {
  console.log('🔧 Consolidando alunos duplicados...')
  
  const alunosRef = collection(firestore, "alunos")
  const todosAlunosSnap = await getDocs(alunosRef)
  
  console.log(`📊 Total de alunos no banco: ${todosAlunosSnap.size}`)
  
  // Agrupa alunos por documento
  const alunosPorDocumento = {}
  
  todosAlunosSnap.forEach(docSnap => {
    const data = docSnap.data()
    const documento = String(data.documento || '').trim()
    
    if (!documento) return
    
    if (!alunosPorDocumento[documento]) {
      alunosPorDocumento[documento] = []
    }
    
    alunosPorDocumento[documento].push({
      doc: docSnap,
      data: data
    })
  })
  
  console.log('📋 Alunos agrupados por documento:')
  Object.keys(alunosPorDocumento).forEach(documento => {
    const alunos = alunosPorDocumento[documento]
    console.log(`📄 Documento "${documento}": ${alunos.length} alunos`)
    alunos.forEach((aluno, index) => {
      const certificados = Array.isArray(aluno.data.certificados) ? aluno.data.certificados : []
      console.log(`  ${index + 1}. ${aluno.data.nome} - ${certificados.length} certificados`)
    })
  })
  
  // Consolida alunos com mesmo documento
  for (const [documento, alunos] of Object.entries(alunosPorDocumento)) {
    if (alunos.length > 1) {
      console.log(`\n🔧 Consolidando alunos com documento "${documento}"...`)
      
      // Pega o primeiro aluno como base
      const alunoBase = alunos[0]
      const certificadosConsolidados = [...(Array.isArray(alunoBase.data.certificados) ? alunoBase.data.certificados : [])]
      
      console.log(`📝 Aluno base: ${alunoBase.data.nome} (${certificadosConsolidados.length} certificados)`)
      
      // Adiciona certificados dos outros alunos
      for (let i = 1; i < alunos.length; i++) {
        const aluno = alunos[i]
        const certificados = Array.isArray(aluno.data.certificados) ? aluno.data.certificados : []
        
        console.log(`➕ Adicionando ${certificados.length} certificados do aluno ${aluno.data.nome}`)
        
        certificados.forEach(cert => {
          // Verifica se o certificado já existe para evitar duplicatas
          const jaExiste = certificadosConsolidados.some(c => String(c.id) === String(cert.id))
          if (!jaExiste) {
            certificadosConsolidados.push(cert)
            console.log(`  ✅ Adicionado certificado: ${cert.id}`)
          } else {
            console.log(`  ⏭️ Certificado já existe: ${cert.id}`)
          }
        })
      }
      
      // Atualiza o aluno base com todos os certificados
      console.log(`📊 Total de certificados consolidados: ${certificadosConsolidados.length}`)
      await updateDoc(alunoBase.doc.ref, { certificados: certificadosConsolidados })
      console.log(`✅ Aluno base atualizado: ${alunoBase.data.nome}`)
      
      // Remove os outros alunos
      for (let i = 1; i < alunos.length; i++) {
        const aluno = alunos[i]
        console.log(`🗑️ Removendo aluno duplicado: ${aluno.data.nome}`)
        await deleteDoc(aluno.doc.ref)
      }
      
      console.log(`🎉 Consolidação concluída para documento "${documento}"`)
    }
  }
  
  // Verifica resultado final
  console.log('\n=== VERIFICANDO RESULTADO FINAL ===')
  const todosAlunosSnapFinal = await getDocs(alunosRef)
  
  console.log(`📊 Total de alunos após consolidação: ${todosAlunosSnapFinal.size}`)
  
  todosAlunosSnapFinal.forEach(docSnap => {
    const data = docSnap.data()
    const certificados = Array.isArray(data.certificados) ? data.certificados : []
    console.log(`👤 Aluno: ${data.nome} (${data.documento}) - ${certificados.length} certificados`)
    certificados.forEach(cert => {
      console.log(`  📄 Certificado ID: ${cert.id} - ${cert.treinamento}`)
    })
  })
  
  // Verifica especificamente o documento problemático
  console.log('\n=== VERIFICANDO DOCUMENTO PROBLEMÁTICO (038.337.701-39) ===')
  const qTeste = query(alunosRef, where("documento", "==", "038.337.701-39"))
  const testeSnap = await getDocs(qTeste)
  
  if (!testeSnap.empty) {
    const alunoTeste = testeSnap.docs[0].data()
    const certificadosTeste = Array.isArray(alunoTeste.certificados) ? alunoTeste.certificados : []
    console.log(`✅ Aluno encontrado: ${alunoTeste.nome} (${alunoTeste.documento})`)
    console.log(`📊 Total de certificados: ${certificadosTeste.length}`)
    
    if (certificadosTeste.length === 3) {
      console.log('🎉 SUCESSO! Todos os 3 certificados foram consolidados no mesmo aluno!')
    } else {
      console.log('⚠️ ATENÇÃO! Nem todos os certificados foram consolidados.')
      console.log(`Esperado: 3, Encontrado: ${certificadosTeste.length}`)
    }
  } else {
    console.log('❌ ERRO! Aluno com documento 038.337.701-39 não foi encontrado!')
  }
}

// Executa a consolidação
consolidarAlunos()
  .then(() => {
    console.log('\n🎉 Consolidação finalizada!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erro na consolidação:', error)
    process.exit(1)
  })



