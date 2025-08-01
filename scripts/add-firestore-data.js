const { initializeApp } = require('firebase/app');
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
const firestore = getFirestore(app);

async function addUserData(email, nome) {
  try {
    console.log(`📝 Adicionando dados para: ${email}`);
    
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
    console.log(`✅ Dados salvos no Firestore para ${email}`);
    console.log(`📅 Chave de acesso válida até: ${userData.chave_de_acesso}`);
    
  } catch (error) {
    console.error('❌ Erro ao adicionar dados:', error.message);
  }
}

// Adicionar dados para usuários que já existem no Auth
addUserData('admin@owltech.com', 'Administrador');
addUserData('teste@owltech.com', 'Usuário Teste'); 