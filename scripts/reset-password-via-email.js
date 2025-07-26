const { initializeApp } = require("firebase/app");
const { getAuth, sendPasswordResetEmail } = require("firebase/auth");

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

async function sendPasswordReset() {
  const email = "omegapro345@gmail.com";

  try {
    console.log("📧 === ENVIANDO EMAIL DE REDEFINIÇÃO DE SENHA ===");
    console.log("📧 Email:", email);

    // Enviar email de redefinição de senha
    await sendPasswordResetEmail(auth, email);
    
    console.log("✅ Email de redefinição enviado com sucesso!");
    console.log("📧 Verifique sua caixa de entrada e pasta de spam");
    console.log("🔗 Clique no link do email para redefinir sua senha");
    console.log("💡 Use a senha 'Pedro345@@' quando redefinir");

  } catch (error) {
    console.error("❌ Erro ao enviar email:", error.code);
    console.error("📝 Mensagem:", error.message);
  }
}

// Executar o script
sendPasswordReset().then(() => {
  console.log("\n🏁 Email enviado");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro no script:", error);
  process.exit(1);
}); 