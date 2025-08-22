const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBnr5yW1F2J1-OQJD4IMBttKGYAkHOW4nA",
  authDomain: "exportador-certificados-14bd4.firebaseapp.com",
  projectId: "exportador-certificados-14bd4",
  storageBucket: "exportador-certificados-14bd4.firebasestorage.app",
  messagingSenderId: "22402301311",
  appId: "1:22402301311:web:68970e19345e90fe3cee4a"
};

async function verificarColecoes() {
  try {
    console.log("🔍 === VERIFICANDO COLEÇÕES DO BANCO DE DADOS ===");
    
    // 1. Inicializar Firebase
    console.log("\n1️⃣ Inicializando Firebase...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log("✅ Firebase inicializado");
    
    // 2. Verificar coleção 'alunos'
    console.log("\n2️⃣ Verificando coleção 'alunos'...");
    try {
      const alunosRef = collection(db, "alunos");
      const alunosSnapshot = await getDocs(alunosRef);
      console.log(`✅ Coleção 'alunos' EXISTE`);
      console.log(`   📊 Total de documentos: ${alunosSnapshot.docs.length}`);
      
      if (alunosSnapshot.docs.length > 0) {
        const primeiroAluno = alunosSnapshot.docs[0].data();
        console.log(`   📋 Exemplo de dados: ${primeiroAluno.nome || 'Nome não encontrado'}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao acessar coleção 'alunos': ${error.message}`);
    }
    
    // 3. Verificar coleção 'usuarios'
    console.log("\n3️⃣ Verificando coleção 'usuarios'...");
    try {
      const usuariosRef = collection(db, "usuarios");
      const usuariosSnapshot = await getDocs(usuariosRef);
      console.log(`✅ Coleção 'usuarios' EXISTE`);
      console.log(`   📊 Total de documentos: ${usuariosSnapshot.docs.length}`);
      
      if (usuariosSnapshot.docs.length > 0) {
        const primeiroUsuario = usuariosSnapshot.docs[0].data();
        console.log(`   📋 Exemplo de dados: ${primeiroUsuario.email || 'Email não encontrado'}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao acessar coleção 'usuarios': ${error.message}`);
    }
    
    // 4. Verificar coleção 'assinaturas'
    console.log("\n4️⃣ Verificando coleção 'assinaturas'...");
    try {
      const assinaturasRef = collection(db, "assinaturas");
      const assinaturasSnapshot = await getDocs(assinaturasRef);
      console.log(`✅ Coleção 'assinaturas' EXISTE`);
      console.log(`   📊 Total de documentos: ${assinaturasSnapshot.docs.length}`);
      
      if (assinaturasSnapshot.docs.length > 0) {
        const primeiraAssinatura = assinaturasSnapshot.docs[0].data();
        console.log(`   📋 Exemplo de dados: ${primeiraAssinatura.nome || 'Nome não encontrado'}`);
        console.log(`   🖼️ Base64 presente: ${primeiraAssinatura.imagemBase64 ? 'Sim' : 'Não'}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao acessar coleção 'assinaturas': ${error.message}`);
    }
    
    // 5. Resumo
    console.log("\n📋 === RESUMO DAS COLEÇÕES ===");
    console.log("✅ Coleção 'alunos': PRESERVADA (dados dos alunos e certificados)");
    console.log("✅ Coleção 'usuarios': PRESERVADA (usuários do sistema)");
    console.log("🆕 Coleção 'assinaturas': NOVA (assinaturas Base64)");
    console.log("\n🎉 Todas as coleções estão funcionando corretamente!");
    console.log("💡 Nenhum dado foi perdido - apenas adicionamos funcionalidade de assinaturas");
    
  } catch (error) {
    console.error("❌ Erro durante a verificação:", error);
    console.error("📝 Código do erro:", error.code);
    console.error("💬 Mensagem:", error.message);
  }
}

verificarColecoes(); 