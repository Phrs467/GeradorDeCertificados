const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBnr5yW1F2J1-OQJD4IMBttKGYAkHOW4nA",
  authDomain: "exportador-certificados-14bd4.firebaseapp.com",
  projectId: "exportador-certificados-14bd4",
  storageBucket: "exportador-certificados-14bd4.firebasestorage.app",
  messagingSenderId: "22402301311",
  appId: "1:22402301311:web:68970e19345e90fe3cee4a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirstLogin() {
  try {
    console.log("🧪 === TESTANDO FLUXO DE PRIMEIRO LOGIN ===");
    
    // 1. Verificar usuário admin existente
    console.log("\n1️⃣ Verificando usuário admin...");
    const usuariosRef = collection(db, "usuarios");
    const q = query(usuariosRef, where("email", "==", "admin@owltech.com"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("❌ Usuário admin não encontrado");
      console.log("💡 Execute: node scripts/create-admin-user.js");
      return;
    }
    
    const adminDoc = querySnapshot.docs[0];
    const adminData = adminDoc.data();
    
    console.log("✅ Usuário admin encontrado:");
    console.log(`   Nome: ${adminData.nome}`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Função: ${adminData.funcao}`);
    console.log(`   Primeiro Login: ${adminData.primeiro_login}`);
    console.log(`   Tem Senha: ${adminData.senha ? 'Sim' : 'Não'}`);
    
    // 2. Criar usuário de teste
    console.log("\n2️⃣ Criando usuário de teste...");
    const dataExpiracao = new Date();
    dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);
    
    const testUser = {
      nome: "Usuário Teste",
      email: "teste@owltech.com",
      funcao: "Usuário",
      chave_de_acesso: dataExpiracao.toISOString(),
      primeiro_login: true,
      senha: null,
      data_criacao: new Date().toISOString()
    };
    
    // Verificar se usuário de teste já existe
    const testQuery = query(usuariosRef, where("email", "==", "teste@owltech.com"));
    const testSnapshot = await getDocs(testQuery);
    
    if (testSnapshot.empty) {
      await addDoc(usuariosRef, testUser);
      console.log("✅ Usuário de teste criado:");
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Primeiro Login: ${testUser.primeiro_login}`);
    } else {
      console.log("⚠️ Usuário de teste já existe");
    }
    
    // 3. Instruções de teste
    console.log("\n3️⃣ Instruções para teste:");
    console.log("📋 Fluxo de teste:");
    console.log("   1. Acesse: http://localhost:3002");
    console.log("   2. Use o email: admin@owltech.com");
    console.log("   3. Clique em 'Primeiro Acesso'");
    console.log("   4. Crie uma senha forte");
    console.log("   5. Verifique se é redirecionado para o dashboard");
    console.log("");
    console.log("📋 Teste com usuário novo:");
    console.log("   1. Faça login como admin");
    console.log("   2. Clique em 'Cadastrar Usuário'");
    console.log("   3. Crie um novo usuário");
    console.log("   4. Use o email do novo usuário");
    console.log("   5. Clique em 'Primeiro Acesso'");
    console.log("   6. Crie a senha");
    console.log("   7. Verifique redirecionamento");
    
    console.log("\n✅ Teste configurado com sucesso!");
    
  } catch (error) {
    console.error("❌ Erro durante o teste:", error);
  }
}

testFirstLogin(); 