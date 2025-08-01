const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');
const bcrypt = require('bcryptjs');

const firebaseConfig = {
  apiKey: "AIzaSyBnr5yW1F2J1-OQJD4IMBttKGYAkHOW4nA",
  authDomain: "exportador-certificados-14bd4.firebaseapp.com",
  projectId: "exportador-certificados-14bd4",
  storageBucket: "exportador-certificados-14bd4.firebasestorage.app",
  messagingSenderId: "22402301311",
  appId: "1:22402301311:web:68970e19345e90fe3cee4a"
};

async function diagnoseErrors() {
  console.log("🔍 === DIAGNÓSTICO DE ERROS ===");
  
  try {
    // Teste 1: Firebase
    console.log("\n1️⃣ Testando Firebase...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log("✅ Firebase inicializado com sucesso");
    
    // Teste 2: Firestore
    console.log("\n2️⃣ Testando Firestore...");
    try {
      const usuariosRef = collection(db, "usuarios");
      const querySnapshot = await getDocs(usuariosRef);
      console.log(`✅ Firestore acessível - ${querySnapshot.size} usuários encontrados`);
    } catch (firestoreError) {
      console.log("❌ Erro no Firestore:", firestoreError.message);
      console.log("💡 Verifique as regras de segurança do Firestore");
    }
    
    // Teste 3: bcrypt
    console.log("\n3️⃣ Testando bcrypt...");
    try {
      const testPassword = "test123";
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      const isValid = await bcrypt.compare(testPassword, hashedPassword);
      console.log("✅ bcrypt funcionando corretamente");
      console.log(`   Hash gerado: ${hashedPassword.substring(0, 20)}...`);
      console.log(`   Comparação: ${isValid}`);
    } catch (bcryptError) {
      console.log("❌ Erro no bcrypt:", bcryptError.message);
    }
    
    // Teste 4: Verificar dependências
    console.log("\n4️⃣ Verificando dependências...");
    const fs = require('fs');
    const path = require('path');
    
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log("✅ package.json encontrado");
      
      const requiredDeps = ['firebase', 'bcryptjs', 'next', 'react'];
      for (const dep of requiredDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          console.log(`   ✅ ${dep}: ${packageJson.dependencies[dep]}`);
        } else {
          console.log(`   ❌ ${dep}: não encontrado`);
        }
      }
    } else {
      console.log("❌ package.json não encontrado");
    }
    
    // Teste 5: Verificar arquivos críticos
    console.log("\n5️⃣ Verificando arquivos críticos...");
    const criticalFiles = [
      'lib/firebase.ts',
      'lib/password-utils.ts',
      'components/login-form.tsx',
      'app/page.tsx'
    ];
    
    for (const file of criticalFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file}`);
      } else {
        console.log(`   ❌ ${file} - não encontrado`);
      }
    }
    
    console.log("\n✅ Diagnóstico concluído!");
    console.log("\n💡 Se houver erros, verifique:");
    console.log("   - Regras de segurança do Firestore");
    console.log("   - Configuração do Firebase");
    console.log("   - Dependências instaladas");
    console.log("   - Arquivos de configuração");
    
  } catch (error) {
    console.error("❌ Erro durante o diagnóstico:", error);
  }
}

diagnoseErrors(); 