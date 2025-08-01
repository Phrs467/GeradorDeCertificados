const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc } = require('firebase/firestore');
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

async function testCompleteLogin() {
  try {
    console.log("🧪 === TESTE COMPLETO DE LOGIN ===");
    
    // 1. Verificar usuários existentes
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
    
    // 2. Configurar senha para admin se necessário
    console.log("\n2️⃣ Configurando senha para admin...");
    const adminQuery = query(usuariosRef, where("email", "==", "admin@owltech.com"));
    const adminSnapshot = await getDocs(adminQuery);
    
    if (!adminSnapshot.empty) {
      const adminDoc = adminSnapshot.docs[0];
      const adminData = adminDoc.data();
      
      if (!adminData.senha) {
        console.log("🔐 Definindo senha para admin...");
        const password = "Admin123!";
        const hashedPassword = await bcrypt.hash(password, 12);
        
        await updateDoc(adminDoc.ref, {
          senha: hashedPassword,
          primeiro_login: false,
          funcao: "Administrador"
        });
        
        console.log("✅ Senha definida para admin");
        console.log(`   Email: admin@owltech.com`);
        console.log(`   Senha: ${password}`);
      } else {
        console.log("✅ Admin já tem senha configurada");
      }
    }
    
    // 3. Testar senha do admin
    console.log("\n3️⃣ Testando senha do admin...");
    const testPassword = "Admin123!";
    const adminData = adminSnapshot.docs[0].data();
    const passwordValid = await bcrypt.compare(testPassword, adminData.senha);
    console.log(`✅ Senha "Admin123!" válida: ${passwordValid}`);
    
    // 4. Instruções de teste
    console.log("\n4️⃣ Instruções para teste manual:");
    console.log("🔗 Acesse: http://localhost:3002");
    console.log("📝 Credenciais para teste:");
    console.log(`   Email: admin@owltech.com`);
    console.log(`   Senha: Admin123!`);
    console.log("");
    console.log("🔍 Para debugar:");
    console.log("   1. Abra o console do navegador (F12)");
    console.log("   2. Vá para a aba 'Console'");
    console.log("   3. Tente fazer login");
    console.log("   4. Procure por logs que começam com:");
    console.log("      - 🔐 === INICIANDO LOGIN ===");
    console.log("      - ✅ Login com senha do Firestore bem-sucedido!");
    console.log("      - 💾 Dados do usuário salvos na sessão");
    console.log("      - 🎉 Login bem-sucedido, redirecionando...");
    console.log("      - 🔄 Executando redirecionamento para dashboard...");
    console.log("");
    console.log("🔍 Se ainda piscar, verifique:");
    console.log("   - Se há erros no console");
    console.log("   - Se o redirecionamento está funcionando");
    console.log("   - Se a sessão está sendo salva");
    
    console.log("\n✅ Teste configurado com sucesso!");
    
  } catch (error) {
    console.error("❌ Erro durante o teste:", error);
  }
}

testCompleteLogin(); 