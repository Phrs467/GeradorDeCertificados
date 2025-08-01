const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc } = require('firebase/firestore');
const bcrypt = require('bcryptjs');

const firebaseConfig = {
  apiKey: "AIzaSyBnr5yW1F2J1-OQJD4IMBttKGYAkHOW4nA",
  authDomain: "exportador-certificados-14bd4.firebaseapp.com",
  projectId: "exportador-certificados-14bd4",
  storageBucket: "exportador-certificados-14bd4.firebasestorage.app",
  messagingSenderId: "22402301311",
  appId: "1:22402301311:web:68970e19345e90fe3cee4a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setAdminPassword() {
  try {
    console.log("🔐 === DEFININDO SENHA DO ADMIN ===");
    
    // 1. Encontrar usuário admin
    console.log("\n1️⃣ Procurando usuário admin...");
    const usuariosRef = collection(db, "usuarios");
    const q = query(usuariosRef, where("email", "==", "admin@owltech.com"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("❌ Usuário admin não encontrado");
      return;
    }
    
    const adminDoc = querySnapshot.docs[0];
    const adminData = adminDoc.data();
    
    console.log("✅ Admin encontrado:");
    console.log(`   Nome: ${adminData.nome}`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Função: ${adminData.funcao || 'Não definida'}`);
    
    // 2. Definir nova senha
    const newPassword = "Admin123!";
    console.log(`\n2️⃣ Definindo nova senha: ${newPassword}`);
    
    // Criptografar senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log("✅ Senha criptografada gerada");
    
    // 3. Atualizar no Firestore
    console.log("\n3️⃣ Atualizando senha no Firestore...");
    await updateDoc(adminDoc.ref, {
      senha: hashedPassword,
      primeiro_login: false,
      funcao: "Administrador", // Garantir que a função está definida
      updated_at: new Date().toISOString()
    });
    
    console.log("✅ Senha atualizada com sucesso!");
    
    // 4. Verificar se funcionou
    console.log("\n4️⃣ Verificando se a senha foi salva...");
    const verifyQuery = query(usuariosRef, where("email", "==", "admin@owltech.com"));
    const verifySnapshot = await getDocs(verifyQuery);
    const updatedAdmin = verifySnapshot.docs[0].data();
    
    const passwordValid = await bcrypt.compare(newPassword, updatedAdmin.senha);
    console.log(`✅ Senha válida: ${passwordValid}`);
    
    // 5. Instruções de login
    console.log("\n5️⃣ Instruções para login:");
    console.log("📋 Credenciais do admin:");
    console.log(`   Email: admin@owltech.com`);
    console.log(`   Senha: ${newPassword}`);
    console.log("");
    console.log("🔗 Acesse: http://localhost:3002");
    console.log("📝 Use as credenciais acima para fazer login");
    
    console.log("\n✅ Processo concluído com sucesso!");
    
  } catch (error) {
    console.error("❌ Erro ao definir senha:", error);
  }
}

setAdminPassword(); 