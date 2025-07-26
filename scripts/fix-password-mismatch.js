const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword, updatePassword } = require("firebase/auth");
const { getFirestore, collection, query, where, getDocs, updateDoc } = require("firebase/firestore");
const bcrypt = require("bcryptjs");

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

async function fixPasswordMismatch() {
  const email = "omegapro345@gmail.com";
  const senhaCorreta = "Pedro345@@"; // Senha que deveria estar funcionando
  const senhaAtual = "123456"; // Senha que está funcionando atualmente

  try {
    console.log("🔧 === CORRIGINDO INCONSISTÊNCIA DE SENHA ===");
    console.log("📧 Email:", email);
    console.log("🔑 Senha correta (Firestore):", senhaCorreta);
    console.log("🔑 Senha atual (Firebase Auth):", senhaAtual);

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
      tipo_senha: usuario.senha ? (usuario.senha.startsWith("$2b$") ? 'bcrypt' : 'texto') : 'nenhuma'
    });

    // 2. Fazer login com a senha atual para obter o usuário autenticado
    console.log("\n2️⃣ Fazendo login com senha atual para obter usuário autenticado...");
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, senhaAtual);
      console.log("✅ Login bem-sucedido com senha atual");
      console.log("👤 UID:", userCredential.user.uid);
    } catch (loginError) {
      console.log("❌ Erro ao fazer login com senha atual:", loginError.code);
      return;
    }

    // 3. Atualizar a senha no Firebase Auth para a senha correta
    console.log("\n3️⃣ Atualizando senha no Firebase Auth...");
    try {
      await updatePassword(userCredential.user, senhaCorreta);
      console.log("✅ Senha atualizada no Firebase Auth para:", senhaCorreta);
    } catch (updateError) {
      console.log("❌ Erro ao atualizar senha:", updateError.code);
      console.log("📝 Mensagem:", updateError.message);
      return;
    }

    // 4. Verificar se a senha no Firestore está correta
    console.log("\n4️⃣ Verificando senha no Firestore...");
    if (usuario.senha && usuario.senha.startsWith("$2b$")) {
      const senhaCorresponde = await bcrypt.compare(senhaCorreta, usuario.senha);
      console.log("🔐 Senha no Firestore corresponde à senha correta:", senhaCorresponde);
      
      if (!senhaCorresponde) {
        console.log("⚠️ Senha no Firestore não corresponde. Atualizando...");
        const hashedPassword = await bcrypt.hash(senhaCorreta, 12);
        await updateDoc(usuarioDoc.ref, {
          senha: hashedPassword,
          updated_at: new Date().toISOString(),
        });
        console.log("✅ Senha atualizada no Firestore");
      }
    }

    // 5. Testar login com a senha correta
    console.log("\n5️⃣ Testando login com senha correta...");
    await auth.signOut(); // Fazer logout primeiro
    
    try {
      const testCredential = await signInWithEmailAndPassword(auth, email, senhaCorreta);
      console.log("✅ Login bem-sucedido com senha correta!");
      console.log("👤 UID:", testCredential.user.uid);
    } catch (testError) {
      console.log("❌ Erro no teste de login:", testError.code);
    }

    console.log("\n✅ Correção concluída!");
    console.log("🔑 Agora você pode fazer login com a senha:", senhaCorreta);

  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar o script
fixPasswordMismatch().then(() => {
  console.log("\n🏁 Correção concluída");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro no script:", error);
  process.exit(1);
}); 