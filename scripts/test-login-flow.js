const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');
const bcrypt = require('bcryptjs');

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

async function testLoginFlow() {
  try {
    console.log("🧪 === TESTANDO FLUXO DE LOGIN ===");
    
    // 1. Verificar usuários no banco
    console.log("\n1️⃣ Verificando usuários no banco...");
    const usuariosRef = collection(db, "usuarios");
    const querySnapshot = await getDocs(usuariosRef);
    
    console.log(`📊 Total de usuários: ${querySnapshot.size}`);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   - ${data.nome} (${data.email})`);
      console.log(`     Função: ${data.funcao || 'Não definida'}`);
      console.log(`     Primeiro Login: ${data.primeiro_login}`);
      console.log(`     Tem Senha: ${data.senha ? 'Sim' : 'Não'}`);
      console.log(`     Chave Acesso: ${new Date(data.chave_de_acesso).toLocaleDateString('pt-BR')}`);
      console.log("     ---");
    });
    
    // 2. Testar bcrypt
    console.log("\n2️⃣ Testando bcrypt...");
    const testPassword = "Admin123!";
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    console.log("✅ bcrypt funcionando:", isValid);
    
    // 3. Verificar usuário admin
    console.log("\n3️⃣ Verificando usuário admin...");
    const adminQuery = query(usuariosRef, where("email", "==", "admin@owltech.com"));
    const adminSnapshot = await getDocs(adminQuery);
    
    if (!adminSnapshot.empty) {
      const adminData = adminSnapshot.docs[0].data();
      console.log("✅ Admin encontrado:");
      console.log(`   Nome: ${adminData.nome}`);
      console.log(`   Primeiro Login: ${adminData.primeiro_login}`);
      console.log(`   Tem Senha: ${adminData.senha ? 'Sim' : 'Não'}`);
      
      if (adminData.senha) {
        // Testar senha
        const testAdminPassword = "Admin123!";
        const adminPasswordValid = await bcrypt.compare(testAdminPassword, adminData.senha);
        console.log(`   Senha "Admin123!" válida: ${adminPasswordValid}`);
      }
    } else {
      console.log("❌ Admin não encontrado");
    }
    
    // 4. Verificar usuário de teste
    console.log("\n4️⃣ Verificando usuário de teste...");
    const testQuery = query(usuariosRef, where("email", "==", "teste@owltech.com"));
    const testSnapshot = await getDocs(testQuery);
    
    if (!testSnapshot.empty) {
      const testData = testSnapshot.docs[0].data();
      console.log("✅ Usuário de teste encontrado:");
      console.log(`   Nome: ${testData.nome}`);
      console.log(`   Primeiro Login: ${testData.primeiro_login}`);
      console.log(`   Tem Senha: ${testData.senha ? 'Sim' : 'Não'}`);
    } else {
      console.log("❌ Usuário de teste não encontrado");
    }
    
    // 5. Instruções de debug
    console.log("\n5️⃣ Instruções para debug:");
    console.log("🔍 Para debugar o problema:");
    console.log("   1. Abra o console do navegador (F12)");
    console.log("   2. Vá para a aba 'Console'");
    console.log("   3. Tente fazer login");
    console.log("   4. Procure por logs que começam com:");
    console.log("      - 🔐 === INICIANDO LOGIN ===");
    console.log("      - 1️⃣ Verificando usuário no Firestore...");
    console.log("      - 2️⃣ Verificando chave de acesso...");
    console.log("      - 3️⃣ Verificando primeiro login...");
    console.log("      - 4️⃣ Verificando senha no Firestore...");
    console.log("      - 5️⃣ Tentando autenticação no Firebase Auth...");
    console.log("");
    console.log("🔍 Possíveis problemas:");
    console.log("   - Usuário não encontrado no Firestore");
    console.log("   - Chave de acesso expirada");
    console.log("   - Senha incorreta");
    console.log("   - Erro no Firebase Auth");
    console.log("   - Problema no redirecionamento");
    
    console.log("\n✅ Teste concluído!");
    
  } catch (error) {
    console.error("❌ Erro durante o teste:", error);
  }
}

testLoginFlow(); 