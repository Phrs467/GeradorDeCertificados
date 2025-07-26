import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCuWDr9ExSW8X6paP8Itd7E7f9GnehpKxI",
  authDomain: "exportador-certificados.firebaseapp.com",
  projectId: "exportador-certificados",
  storageBucket: "exportador-certificados.firebasestorage.app",
  messagingSenderId: "501561871398",
  appId: "1:501561871398:web:89eb56346f96a826bbaae7"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);

// Configuração para autenticação por link de email
export const actionCodeSettings = {
  // URL para redirecionar após o login
  url: process.env.NODE_ENV === 'production' 
    ? 'https://exportador-certificados.firebaseapp.com/finishSignIn'
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