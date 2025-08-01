const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs } = require('firebase/firestore');

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

async function createAdminUser() {
  try {
    // Verificar se o admin já existe
    const usuariosRef = collection(db, "usuarios");
    const q = query(usuariosRef, where("email", "==", "admin@owltech.com"));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.log("❌ Usuário admin já existe!");
      return;
    }

    // Criar data de expiração (1 ano a frente)
    const dataExpiracao = new Date();
    dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);

    const adminUser = {
      nome: "Administrador",
      email: "admin@owltech.com",
      funcao: "Administrador",
      chave_de_acesso: dataExpiracao.toISOString(),
      primeiro_login: false, // Admin já tem senha definida
      senha: null, // Senha será definida pelo próprio admin
      data_criacao: new Date().toISOString()
    };

    const docRef = await addDoc(usuariosRef, adminUser);
    console.log("✅ Usuário administrador criado com sucesso!");
    console.log("📧 Email: admin@owltech.com");
    console.log("🔑 Função: Administrador");
    console.log("📅 Chave de acesso válida até:", dataExpiracao.toLocaleDateString('pt-BR'));
    console.log("🆔 ID do documento:", docRef.id);
  } catch (error) {
    console.error("❌ Erro ao criar usuário admin:", error);
  }
}

createAdminUser(); 