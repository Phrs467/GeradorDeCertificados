const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCuWDr9ExSW8X6paP8Itd7E7f9GnehpKxI",
  authDomain: "exportador-certificados.firebaseapp.com",
  projectId: "exportador-certificados",
  storageBucket: "exportador-certificados.firebasestorage.app",
  messagingSenderId: "501561871398",
  appId: "1:501561871398:web:89eb56346f96a826bbaae7"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

async function listUsers() {
  try {
    console.log("🔍 === LISTANDO TODOS OS USUÁRIOS ===");
    
    const usuariosRef = collection(firestore, "usuarios");
    const querySnapshot = await getDocs(usuariosRef);
    
    if (querySnapshot.empty) {
      console.log("❌ Nenhum usuário encontrado no Firestore");
      return;
    }
    
    console.log(`✅ Encontrados ${querySnapshot.size} usuários:\n`);
    
    querySnapshot.forEach((doc) => {
      const usuario = doc.data();
      console.log(`👤 ID: ${doc.id}`);
      console.log(`📧 Email: ${usuario.email}`);
      console.log(`👤 Nome: ${usuario.nome || 'N/A'}`);
      console.log(`🆕 Primeiro login: ${usuario.primeiro_login}`);
      console.log(`🔑 Tem senha: ${!!usuario.senha}`);
      console.log(`🔑 Tipo senha: ${usuario.senha ? (usuario.senha.startsWith("$2b$") ? 'bcrypt' : 'texto') : 'nenhuma'}`);
      console.log(`📅 Criado em: ${usuario.created_at || 'N/A'}`);
      console.log(`📅 Atualizado em: ${usuario.updated_at || 'N/A'}`);
      console.log("---");
    });
    
  } catch (error) {
    console.error("❌ Erro ao listar usuários:", error);
  }
}

// Executar o script
listUsers().then(() => {
  console.log("\n🏁 Listagem concluída");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro no script:", error);
  process.exit(1);
}); 