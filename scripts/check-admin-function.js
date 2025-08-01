const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc } = require('firebase/firestore');

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

async function checkAdminFunction() {
  try {
    console.log("🔍 === VERIFICANDO FUNÇÃO DO ADMIN ===");
    
    // 1. Buscar dados do admin
    const usuariosRef = collection(db, "usuarios");
    const adminQuery = query(usuariosRef, where("email", "==", "admin@owltech.com"));
    const adminSnapshot = await getDocs(adminQuery);
    
    if (adminSnapshot.empty) {
      console.log("❌ Admin não encontrado");
      return;
    }
    
    const adminDoc = adminSnapshot.docs[0];
    const adminData = adminDoc.data();
    
    console.log("✅ Admin encontrado:");
    console.log(`   Nome: ${adminData.nome}`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Função: ${adminData.funcao || 'Não definida'}`);
    console.log(`   Primeiro Login: ${adminData.primeiro_login}`);
    console.log(`   Tem Senha: ${adminData.senha ? 'Sim' : 'Não'}`);
    
    // 2. Verificar se a função está correta
    if (adminData.funcao !== "Administrador") {
      console.log("\n⚠️ Função incorreta, corrigindo...");
      
      await updateDoc(adminDoc.ref, {
        funcao: "Administrador",
        updated_at: new Date().toISOString()
      });
      
      console.log("✅ Função corrigida para 'Administrador'");
    } else {
      console.log("\n✅ Função já está correta");
    }
    
    // 3. Verificar novamente
    const verifyQuery = query(usuariosRef, where("email", "==", "admin@owltech.com"));
    const verifySnapshot = await getDocs(verifyQuery);
    const updatedAdmin = verifySnapshot.docs[0].data();
    
    console.log("\n📋 Status final:");
    console.log(`   Função: ${updatedAdmin.funcao}`);
    console.log(`   Botão deve aparecer: ${updatedAdmin.funcao === "Administrador" ? "Sim" : "Não"}`);
    
    // 4. Instruções de teste
    console.log("\n🧪 Instruções para teste:");
    console.log("1. Acesse: http://localhost:3002");
    console.log("2. Faça login com admin@owltech.com");
    console.log("3. Verifique se o botão 'Cadastrar Usuário' aparece");
    console.log("4. Clique no botão e verifique os logs no console");
    
    console.log("\n✅ Verificação concluída!");
    
  } catch (error) {
    console.error("❌ Erro durante a verificação:", error);
  }
}

checkAdminFunction(); 