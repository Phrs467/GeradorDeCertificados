import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBnr5yW1F2J1-OQJD4IMBttKGYAkHOW4nA",
  authDomain: "exportador-certificados-14bd4.firebaseapp.com",
  projectId: "exportador-certificados-14bd4",
  storageBucket: "exportador-certificados-14bd4.firebasestorage.app",
  messagingSenderId: "22402301311",
  appId: "1:22402301311:web:68970e19345e90fe3cee4a"
};

// Initialize Firebase
let firebaseApp;
let firebaseAuth;
let firestore;

try {
  firebaseApp = initializeApp(firebaseConfig);
  firebaseAuth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
  console.log("✅ Firebase inicializado com sucesso");
} catch (error) {
  console.error("❌ Erro ao inicializar Firebase:", error);
  throw new Error("Falha na inicialização do Firebase");
}

// Configuração para autenticação por link de email
export const actionCodeSettings = {
  // URL para redirecionar após o login
  url: process.env.NODE_ENV === 'production' 
    ? 'https://exportador-certificados-14bd4.firebaseapp.com/finishSignIn'
    : 'http://localhost:3000/finishSignIn',
  // Sempre deve ser true para autenticação por link
  handleCodeInApp: true,
  // Configurações para iOS (opcional)
  iOS: {
    bundleId: 'com.owltech.certificados'
  },
  // Configurações para Android (opcional)
  android: {
    packageName: 'com.owltech.certificados',
    installApp: true,
    minimumVersion: '12'
  }
};

export { firebaseApp, firebaseAuth, firestore }; 