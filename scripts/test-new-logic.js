const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

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

async function testNewLogic() {
  try {
    console.log("🧪 === TESTANDO NOVA LÓGICA DE AUTENTICAÇÃO ===");
    
    // Testar busca de usuários
    const usuariosRef = collection(db, "usuarios");
    const querySnapshot = await getDocs(usuariosRef);
    
    console.log(`📊 Total de usuários encontrados: ${querySnapshot.size}`);
    
    if (querySnapshot.empty) {
      console.log("❌ Nenhum usuário encontrado no banco de dados");
      console.log("💡 Execute o script create-admin-user.js para criar o usuário administrador");
      return;
    }
    
    console.log("\n📋 Usuários encontrados:");
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`- Nome: ${data.nome}`);
      console.log(`  Email: ${data.email}`);
      console.log(`  Função: ${data.funcao || 'Não definida'}`);
      console.log(`  Primeiro Login: ${data.primeiro_login ? 'Sim' : 'Não'}`);
      console.log(`  Tem Senha: ${data.senha ? 'Sim' : 'Não'}`);
      console.log(`  Chave de Acesso: ${new Date(data.chave_de_acesso).toLocaleDateString('pt-BR')}`);
      console.log("---");
    });
    
    // Testar busca por email específico
    console.log("\n🔍 Testando busca por email...");
    const testEmail = "admin@owltech.com";
    const q = query(usuariosRef, where("email", "==", testEmail.toLowerCase()));
    const emailQuerySnapshot = await getDocs(q);
    
    if (emailQuerySnapshot.empty) {
      console.log(`❌ Email ${testEmail} não encontrado`);
    } else {
      const userData = emailQuerySnapshot.docs[0].data();
      console.log(`✅ Email ${testEmail} encontrado:`);
      console.log(`   Nome: ${userData.nome}`);
      console.log(`   Função: ${userData.funcao || 'Não definida'}`);
      console.log(`   Primeiro Login: ${userData.primeiro_login ? 'Sim' : 'Não'}`);
    }
    
    console.log("\n✅ Teste concluído com sucesso!");
    
  } catch (error) {
    console.error("❌ Erro durante o teste:", error);
  }
}

testNewLogic(); 