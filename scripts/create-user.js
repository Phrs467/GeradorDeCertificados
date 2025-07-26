const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

async function createUser(email, password, nome) {
  try {
    console.log(`🔐 Criando usuário: ${email}`);
    
    // 1. Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log(`✅ Usuário criado no Auth com UID: ${user.uid}`);
    
    // 2. Criar documento no Firestore
    const userData = {
      nome: nome,
      email: email.toLowerCase(),
      chave_de_acesso: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
      primeiro_login: false,
      reset_token: null,
      reset_token_expires: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Usar email como ID do documento
    await setDoc(doc(firestore, "usuarios", email.toLowerCase()), userData);
    console.log(`✅ Dados salvos no Firestore`);
    
    console.log(`🎉 Usuário ${email} criado com sucesso!`);
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Nome: ${nome}`);
    console.log(`🔑 Senha: ${password}`);
    console.log(`📅 Chave de acesso válida até: ${userData.chave_de_acesso}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
  }
}

// Exemplo de uso
createUser('admin@owltech.com', 'Admin123!', 'Administrador');
createUser('teste@owltech.com', 'Teste123!', 'Usuário Teste'); 