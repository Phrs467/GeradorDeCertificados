const { initializeApp } = require("firebase/app");
const { getAuth, deleteUser, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, collection, query, where, getDocs, updateDoc } = require("firebase/firestore");

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

async function resetUser() {
  const email = "omegapro345@gmail.com";

  try {
    console.log("🔄 === RESETANDO USUÁRIO ===");
    console.log("📧 Email:", email);

    // 1. Resetar dados no Firestore
    console.log("\n1️⃣ Resetando dados no Firestore...");
    const usuariosRef = collection(firestore, "usuarios");
    const q = query(usuariosRef, where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("❌ Usuário não encontrado no Firestore");
      return;
    }

    const usuarioDoc = querySnapshot.docs[0];
    await updateDoc(usuarioDoc.ref, {
      primeiro_login: true,
      senha: null,
      updated_at: new Date().toISOString(),
    });
    console.log("✅ Dados resetados no Firestore");

    // 2. Tentar deletar usuário do Firebase Auth (se possível)
    console.log("\n2️⃣ Tentando deletar usuário do Firebase Auth...");
    try {
      // Primeiro tentar fazer login para obter o usuário
      const userCredential = await signInWithEmailAndPassword(auth, email, "senha_qualquer");
      const user = userCredential.user;
      await deleteUser(user);
      console.log("✅ Usuário deletado do Firebase Auth");
    } catch (authError) {
      console.log("⚠️ Não foi possível deletar do Firebase Auth:", authError.code);
      console.log("💡 Isso é normal se a senha estiver incorreta");
    }

    console.log("\n✅ Usuário resetado com sucesso!");
    console.log("🔄 Agora você pode fazer o primeiro login novamente");

  } catch (error) {
    console.error("❌ Erro ao resetar usuário:", error);
  }
}

// Executar o script
resetUser().then(() => {
  console.log("\n🏁 Reset concluído");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro no script:", error);
  process.exit(1);
}); 