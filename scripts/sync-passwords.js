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

async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function syncPasswords() {
  const email = "omegapro345@gmail.com";
  const senhaAtual = "Pedro345@@"; // Senha que você definiu na redefinição

  try {
    console.log("🔄 === SINCRONIZANDO SENHAS ===");
    console.log("📧 Email:", email);
    console.log("🔑 Senha atual:", senhaAtual);

    // 1. Tentar fazer login no Firebase Auth para verificar se a senha está correta
    console.log("\n1️⃣ Testando login no Firebase Auth...");
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, senhaAtual);
      console.log("✅ Login no Firebase Auth bem-sucedido!");
      console.log("👤 UID:", userCredential.user.uid);
    } catch (authError) {
      console.log("❌ Erro no Firebase Auth:", authError.code);
      console.log("📝 Mensagem:", authError.message);
      return;
    }

    // 2. Verificar dados no Firestore
    console.log("\n2️⃣ Verificando dados no Firestore...");
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

    // 3. Verificar se a senha no Firestore corresponde à senha atual
    console.log("\n3️⃣ Verificando sincronização de senhas...");
    let senhaSincronizada = false;
    
    if (usuario.senha && usuario.senha.startsWith("$2b$")) {
      senhaSincronizada = await bcrypt.compare(senhaAtual, usuario.senha);
      console.log("🔐 Senha no Firestore corresponde à senha atual:", senhaSincronizada);
    } else {
      console.log("⚠️ Nenhuma senha criptografada encontrada no Firestore");
    }

    // 4. Se não estiver sincronizada, atualizar o Firestore
    if (!senhaSincronizada) {
      console.log("\n4️⃣ Atualizando senha no Firestore...");
      const hashedPassword = await hashPassword(senhaAtual);
      
      await updateDoc(usuarioDoc.ref, {
        senha: hashedPassword,
        primeiro_login: false,
        updated_at: new Date().toISOString(),
      });
      
      console.log("✅ Senha atualizada no Firestore");
    } else {
      console.log("✅ Senhas já estão sincronizadas");
    }

    // 5. Testar login completo
    console.log("\n5️⃣ Testando login completo...");
    await auth.signOut(); // Fazer logout primeiro
    
    try {
      const testCredential = await signInWithEmailAndPassword(auth, email, senhaAtual);
      console.log("✅ Login de teste bem-sucedido!");
      console.log("👤 UID:", testCredential.user.uid);
    } catch (testError) {
      console.log("❌ Erro no teste de login:", testError.code);
    }

    console.log("\n✅ Sincronização concluída!");
    console.log("🔑 Agora você pode fazer login com a senha:", senhaAtual);

  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar o script
syncPasswords().then(() => {
  console.log("\n🏁 Sincronização concluída");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro no script:", error);
  process.exit(1);
}); 