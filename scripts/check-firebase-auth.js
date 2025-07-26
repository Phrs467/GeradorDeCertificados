const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require("firebase/auth");

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

async function checkFirebaseAuth() {
  const email = "omegapro345@gmail.com";
  const senha = "Teste123!";

  try {
    console.log("🔍 === VERIFICANDO FIREBASE AUTH ===");
    console.log("📧 Email:", email);
    console.log("🔑 Senha:", senha);

    // Tentar login para ver se o usuário existe
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      console.log("✅ Usuário existe no Firebase Auth!");
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
          console.log("📧 Email verificado:", newUserCredential.user.emailVerified);
          
          // Tentar login novamente
          console.log("\n🔄 Tentando login novamente...");
          const loginCredential = await signInWithEmailAndPassword(auth, email, senha);
          console.log("✅ Login bem-sucedido após criação!");
        } catch (createError) {
          console.log("❌ Erro ao criar usuário:", createError.code);
          console.log("📝 Mensagem:", createError.message);
        }
      } else if (authError.code === "auth/invalid-credential") {
        console.log("\n🔍 Usuário existe mas credenciais estão incorretas");
        console.log("💡 Isso pode indicar que a senha está errada ou o usuário não foi criado corretamente");
      }
    }

  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar o script
checkFirebaseAuth().then(() => {
  console.log("\n🏁 Verificação concluída");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro no script:", error);
  process.exit(1);
}); 