const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");
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

async function debugFirstLogin() {
  const email = "omegapro345@gmail.com";
  const senhaUsuario = "Pedro345@@"; // Senha que você disse que definiu

  try {
    console.log("🔍 === DEBUG PRIMEIRO LOGIN ===");
    console.log("📧 Email:", email);
    console.log("🔑 Senha que você definiu:", senhaUsuario);

    // 1. Verificar dados atuais no Firestore
    console.log("\n1️⃣ Verificando dados atuais no Firestore...");
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

    // 2. Verificar se a senha criptografada no Firestore corresponde à senha que você definiu
    if (usuario.senha && usuario.senha.startsWith("$2b$")) {
      console.log("\n2️⃣ Verificando senha criptografada no Firestore...");
      const senhaCorresponde = await bcrypt.compare(senhaUsuario, usuario.senha);
      console.log("🔐 Senha criptografada corresponde à senha definida:", senhaCorresponde);
      
      if (senhaCorresponde) {
        console.log("✅ A senha no Firestore está correta!");
      } else {
        console.log("❌ A senha no Firestore NÃO corresponde à senha definida!");
        console.log("💡 Isso indica que uma senha diferente foi salva");
      }
    }

    // 3. Tentar criar usuário no Firebase Auth (simular primeiro login)
    console.log("\n3️⃣ Simulando criação de usuário no Firebase Auth...");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senhaUsuario);
      console.log("✅ Usuário criado no Firebase Auth com UID:", userCredential.user.uid);
      console.log("📧 Email verificado:", userCredential.user.emailVerified);
      
      // 4. Testar login imediatamente após criação
      console.log("\n4️⃣ Testando login imediatamente após criação...");
      await auth.signOut(); // Fazer logout primeiro
      
      const loginCredential = await signInWithEmailAndPassword(auth, email, senhaUsuario);
      console.log("✅ Login bem-sucedido após criação!");
      console.log("👤 UID:", loginCredential.user.uid);
      
    } catch (authError) {
      console.log("❌ Erro ao criar usuário no Firebase Auth:", authError.code);
      console.log("📝 Mensagem:", authError.message);
      
      if (authError.code === "auth/email-already-in-use") {
        console.log("\n🔍 Usuário já existe no Firebase Auth. Tentando login...");
        try {
          const loginCredential = await signInWithEmailAndPassword(auth, email, senhaUsuario);
          console.log("✅ Login bem-sucedido com usuário existente!");
          console.log("👤 UID:", loginCredential.user.uid);
        } catch (loginError) {
          console.log("❌ Erro no login:", loginError.code);
          console.log("📝 Mensagem:", loginError.message);
        }
      }
    }

  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar o script
debugFirstLogin().then(() => {
  console.log("\n🏁 Debug concluído");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro no script:", error);
  process.exit(1);
}); 