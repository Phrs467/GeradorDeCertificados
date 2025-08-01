const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require("firebase/auth");
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

async function testLogin() {
  const email = "omegapro345@gmail.com"; // Email correto do usuário teste2
  const senha = "Teste123!"; // Substitua pela senha que você definiu

  try {
    console.log("🔍 === TESTE DE LOGIN ===");
    console.log("📧 Email:", email);
    console.log("🔑 Senha:", senha);

    // 1. Verificar se o usuário existe no Firestore
    console.log("\n1️⃣ Verificando usuário no Firestore...");
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
      tipo_senha: usuario.senha ? (usuario.senha.startsWith("$2b$") ? 'bcrypt' : 'texto') : 'nenhuma'
    });

    // 2. Tentar login no Firebase Auth
    console.log("\n2️⃣ Tentando login no Firebase Auth...");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      console.log("✅ Login no Firebase Auth bem-sucedido!");
      console.log("👤 UID:", userCredential.user.uid);
      console.log("📧 Email verificado:", userCredential.user.emailVerified);
    } catch (authError) {
      console.log("❌ Erro no Firebase Auth:", authError.code);
      console.log("📝 Mensagem:", authError.message);

      if (authError.code === "auth/user-not-found") {
        console.log("\n🔍 Usuário não existe no Firebase Auth. Criando...");
        try {
          const newUserCredential = await createUserWithEmailAndPassword(auth, email, senha);
          console.log("✅ Usuário criado no Firebase Auth!");
          console.log("👤 UID:", newUserCredential.user.uid);
          
          // Tentar login novamente
          console.log("\n🔄 Tentando login novamente...");
          const loginCredential = await signInWithEmailAndPassword(auth, email, senha);
          console.log("✅ Login bem-sucedido após criação!");
        } catch (createError) {
          console.log("❌ Erro ao criar usuário:", createError.code);
          console.log("📝 Mensagem:", createError.message);
        }
      }
    }

  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar o teste
testLogin().then(() => {
  console.log("\n🏁 Teste concluído");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro no teste:", error);
  process.exit(1);
}); 