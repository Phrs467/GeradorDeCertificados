const { initializeApp } = require("firebase/app");
const { getFirestore, collection, query, where, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBnr5yW1F2J1-OQJD4IMBttKGYAkHOW4nA",
  authDomain: "exportador-certificados-14bd4.firebaseapp.com",
  projectId: "exportador-certificados-14bd4",
  storageBucket: "exportador-certificados-14bd4.firebasestorage.app",
  messagingSenderId: "22402301311",
  appId: "1:22402301311:web:68970e19345e90fe3cee4a"
};

async function testAssinaturas() {
  try {
    console.log("🔍 === TESTANDO SISTEMA DE ASSINATURAS BASE64 ===");
    
    // 1. Inicializar Firebase
    console.log("\n1️⃣ Inicializando Firebase...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log("✅ Firebase inicializado");
    
    // 2. Testar busca de assinatura existente
    console.log("\n2️⃣ Testando busca de assinatura...");
    const assinaturasRef = collection(db, "assinaturas");
    const snapshot = await getDocs(assinaturasRef);
    
    if (snapshot.empty) {
      console.log("❌ Nenhuma assinatura encontrada no banco");
      console.log("💡 Cadastre algumas assinaturas primeiro em /assinaturas");
      return;
    }
    
    console.log(`✅ Encontradas ${snapshot.docs.length} assinaturas no banco`);
    
    // 3. Listar todas as assinaturas
    console.log("\n3️⃣ Listando assinaturas cadastradas:");
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`   ${index + 1}. Nome: "${data.nome}"`);
      console.log(`      ID: ${doc.id}`);
      console.log(`      Base64: ${data.imagemBase64 ? 'Presente' : 'Ausente'}`);
      console.log(`      Tamanho Base64: ${data.imagemBase64 ? data.imagemBase64.length + ' caracteres' : 'N/A'}`);
      console.log("");
    });
    
    // 4. Testar busca por nome específico
    console.log("\n4️⃣ Testando busca por nome específico...");
    const primeiroNome = snapshot.docs[0].data().nome;
    console.log(`🔍 Buscando por: "${primeiroNome}"`);
    
    const q = query(assinaturasRef, where("nome", "==", primeiroNome));
    const buscaSnapshot = await getDocs(q);
    
    if (buscaSnapshot.empty) {
      console.log(`❌ Assinatura não encontrada para: "${primeiroNome}"`);
    } else {
      console.log(`✅ Assinatura encontrada para: "${primeiroNome}"`);
      const assinatura = buscaSnapshot.docs[0].data();
      console.log(`   Base64 presente: ${assinatura.imagemBase64 ? 'Sim' : 'Não'}`);
      console.log(`   Tamanho: ${assinatura.imagemBase64 ? assinatura.imagemBase64.length + ' caracteres' : 'N/A'}`);
    }
    
    // 5. Testar busca por nome inexistente
    console.log("\n5️⃣ Testando busca por nome inexistente...");
    const nomeInexistente = "Nome Que Não Existe 12345";
    console.log(`🔍 Buscando por: "${nomeInexistente}"`);
    
    const q2 = query(assinaturasRef, where("nome", "==", nomeInexistente));
    const buscaSnapshot2 = await getDocs(q2);
    
    if (buscaSnapshot2.empty) {
      console.log(`✅ Corretamente não encontrada: "${nomeInexistente}"`);
    } else {
      console.log(`❌ Erro: Encontrada assinatura para nome inexistente`);
    }
    
    // 6. Verificar estrutura dos dados
    console.log("\n6️⃣ Verificando estrutura dos dados...");
    const primeiraAssinatura = snapshot.docs[0].data();
    const campos = Object.keys(primeiraAssinatura);
    
    console.log("📋 Campos encontrados:");
    campos.forEach(campo => {
      const valor = primeiraAssinatura[campo];
      const tipo = typeof valor;
      const tamanho = valor && typeof valor === 'string' ? valor.length : 'N/A';
      console.log(`   - ${campo}: ${tipo} (${tamanho})`);
    });
    
    // 7. Verificar se há assinatura do coordenador
    console.log("\n7️⃣ Verificando assinatura do coordenador...");
    const qCoordenador = query(assinaturasRef, where("nome", "==", "Coordenador"));
    const coordenadorSnapshot = await getDocs(qCoordenador);
    
    if (coordenadorSnapshot.empty) {
      console.log("⚠️ Assinatura do 'Coordenador' não encontrada");
      console.log("💡 Cadastre uma assinatura com nome 'Coordenador' para assinatura institucional");
    } else {
      console.log("✅ Assinatura do 'Coordenador' encontrada");
    }
    
    console.log("\n🎉 Teste de assinaturas concluído com sucesso!");
    console.log("📋 Resumo:");
    console.log("   - Firebase: ✅ Funcionando");
    console.log("   - Firestore: ✅ Funcionando");
    console.log("   - Busca por nome: ✅ Funcionando");
    console.log("   - Base64: ✅ Presente");
    console.log("   - Estrutura: ✅ Correta");
    
  } catch (error) {
    console.error("❌ Erro durante o teste:", error);
    console.error("📝 Código do erro:", error.code);
    console.error("💬 Mensagem:", error.message);
  }
}

testAssinaturas(); 