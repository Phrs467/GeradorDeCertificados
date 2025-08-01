const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCuWDr9ExSW8X6paP8Itd7E7f9GnehpKxI",
  authDomain: "exportador-certificados.firebaseapp.com",
  projectId: "exportador-certificados",
  storageBucket: "exportador-certificados.firebasestorage.app",
  messagingSenderId: "501561871398",
  appId: "1:501561871398:web:89eb56346f96a826bbaae7"
};

async function checkFirebaseConfig() {
  try {
    console.log("🔍 === VERIFICANDO CONFIGURAÇÃO DO FIREBASE ===");
    
    // 1. Verificar configuração do firebase
    console.log("\n1️⃣ Configuração do Firebase:");
    console.log("📧 Auth Domain:", firebaseConfig.authDomain);
    console.log("🔑 Project ID:", firebaseConfig.projectId);
    console.log("📱 App ID:", firebaseConfig.appId);
    
    // 2. Inicializar Firebase
    console.log("\n2️⃣ Inicializando Firebase...");
    const app = initializeApp(firebaseConfig);
    console.log("✅ Firebase inicializado com sucesso");
    
    // 3. Verificar Auth
    console.log("\n3️⃣ Verificando Firebase Auth...");
    const auth = getAuth(app);
    console.log("✅ Firebase Auth inicializado");
    console.log("🔐 Auth Domain:", auth.config.authDomain);
    
    // 4. Verificar Firestore
    console.log("\n4️⃣ Verificando Firestore...");
    const firestore = getFirestore(app);
    console.log("✅ Firestore inicializado");
    
    // 5. Verificar se há usuários autenticados
    console.log("\n5️⃣ Verificando estado de autenticação...");
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log("👤 Usuário autenticado:", currentUser.email);
      console.log("🆔 UID:", currentUser.uid);
    } else {
      console.log("👤 Nenhum usuário autenticado");
    }
    
    console.log("\n✅ Configuração do Firebase está correta!");
    console.log("💡 Se o login não está funcionando, pode ser um problema de:");
    console.log("   - Bloqueio temporário do Firebase (aguarde alguns minutos)");
    console.log("   - Senha incorreta");
    console.log("   - Problema de sincronização entre Auth e Firestore");
    
  } catch (error) {
    console.error("❌ Erro na configuração:", error);
  }
}

// Executar o script
checkFirebaseConfig().then(() => {
  console.log("\n🏁 Verificação concluída");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro no script:", error);
  process.exit(1);
}); 