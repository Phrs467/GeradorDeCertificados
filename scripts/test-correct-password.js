const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, collection, query, where, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCuWDr9ExSW8X6paP8Itd7E7f9GnehpKxI",
  authDomain: "exportador-certificados.firebaseapp.com",
  projectId: "exportador-certificados",
  storageBucket: "exportador-certificados.firebasestorage.app",
  messagingSenderId: "501561871398",
  appId: "1:501561871398:web:89eb56346f96a826bbaae7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

async function testCorrectPassword() {
  const email = "omegapro345@gmail.com";

  try {
    console.log("🔍 === TESTE COM SENHA CORRETA ===");
    console.log("📧 Email:", email);

    // 1. Verificar dados no Firestore
    console.log("\n1️⃣ Verificando dados no Firestore...");
    const usuariosRef = collection(firestore, "usuarios");
    const q = query(usuariosRef, where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("❌ Usuário não encontrado no Firestore");
      return;
    }

    const usuarioDoc = querySnapshot.docs[0];
    const usuario = usuarioDoc.data();
    console.log("✅ Usuário encontrado no Firestore:", {
      email: usuario.email,
      primeiro_login: usuario.primeiro_login,
      tem_senha: !!usuario.senha,
      tipo_senha: usuario.senha ? (usuario.senha.startsWith("$2b$") ? 'bcrypt' : 'texto') : 'nenhuma',
      updated_at: usuario.updated_at
    });

    // 2. Testar diferentes senhas
    const senhasParaTestar = [
      "Pedro345@@",
      "pedro345@@",
      "Pedro345",
      "pedro345",
      "Teste123!",
      "teste123!",
      "Teste123",
      "teste123",
      "123456",
      "password",
      "admin",
      "senha"
    ];

    console.log("\n2️⃣ Testando diferentes senhas no Firebase Auth...");
    
    for (const senha of senhasParaTestar) {
      try {
        console.log(`\n🔑 Testando senha: "${senha}"`);
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        console.log("✅ LOGIN BEM-SUCEDIDO com senha:", senha);
        console.log("👤 UID:", userCredential.user.uid);
        console.log("📧 Email verificado:", userCredential.user.emailVerified);
        
        // Fazer logout para testar próxima senha
        await auth.signOut();
        break;
      } catch (authError) {
        console.log("❌ Senha incorreta:", authError.code);
      }
    }

  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar o script
testCorrectPassword().then(() => {
  console.log("\n🏁 Teste concluído");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro no script:", error);
  process.exit(1);
}); 