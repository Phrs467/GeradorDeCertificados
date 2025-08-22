const { initializeApp } = require("firebase/app");
const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const { getFirestore, collection, addDoc } = require("firebase/firestore");
const fs = require("fs");
const path = require("path");

const firebaseConfig = {
  apiKey: "AIzaSyBnr5yW1F2J1-OQJD4IMBttKGYAkHOW4nA",
  authDomain: "exportador-certificados-14bd4.firebaseapp.com",
  projectId: "exportador-certificados-14bd4",
  storageBucket: "exportador-certificados-14bd4.firebasestorage.app",
  messagingSenderId: "22402301311",
  appId: "1:22402301311:web:68970e19345e90fe3cee4a"
};

async function testStorageUpload() {
  try {
    console.log("🔍 === TESTANDO UPLOAD PARA FIREBASE STORAGE ===");
    
    // 1. Inicializar Firebase
    console.log("\n1️⃣ Inicializando Firebase...");
    const app = initializeApp(firebaseConfig);
    console.log("✅ Firebase inicializado");
    
    // 2. Inicializar Storage
    console.log("\n2️⃣ Inicializando Firebase Storage...");
    const storage = getStorage(app);
    console.log("✅ Storage inicializado");
    console.log("📦 Storage Bucket:", storage.app.options.storageBucket);
    
    // 3. Criar arquivo de teste
    console.log("\n3️⃣ Criando arquivo de teste...");
    const testContent = "Teste de upload para Firebase Storage";
    const testFilePath = path.join(__dirname, "test-upload.txt");
    fs.writeFileSync(testFilePath, testContent);
    console.log("✅ Arquivo de teste criado:", testFilePath);
    
    // 4. Fazer upload
    console.log("\n4️⃣ Fazendo upload para Storage...");
    const nomeArquivo = `assinaturas/test_${Date.now()}.txt`;
    const storageRef = ref(storage, nomeArquivo);
    
    const fileBuffer = fs.readFileSync(testFilePath);
    const uploadResult = await uploadBytes(storageRef, fileBuffer);
    console.log("✅ Upload realizado com sucesso!");
    console.log("📁 Arquivo enviado:", nomeArquivo);
    console.log("📊 Bytes enviados:", uploadResult.bytesTransferred);
    
    // 5. Obter URL de download
    console.log("\n5️⃣ Obtendo URL de download...");
    const downloadURL = await getDownloadURL(storageRef);
    console.log("✅ URL obtida:", downloadURL);
    
    // 6. Testar Firestore
    console.log("\n6️⃣ Testando Firestore...");
    const firestore = getFirestore(app);
    const assinaturaData = {
      nome: "Teste Upload",
      urlImagem: downloadURL,
      dataCriacao: new Date()
    };
    
    const docRef = await addDoc(collection(firestore, "assinaturas"), assinaturaData);
    console.log("✅ Dados salvos no Firestore");
    console.log("📄 Document ID:", docRef.id);
    
    // 7. Limpeza
    console.log("\n7️⃣ Limpando arquivo de teste...");
    fs.unlinkSync(testFilePath);
    console.log("✅ Arquivo de teste removido");
    
    console.log("\n🎉 Teste de upload concluído com sucesso!");
    console.log("📋 Resumo:");
    console.log("   - Firebase Storage: ✅ Funcionando");
    console.log("   - Upload de arquivos: ✅ Funcionando");
    console.log("   - URL de download: ✅ Funcionando");
    console.log("   - Firestore: ✅ Funcionando");
    
  } catch (error) {
    console.error("❌ Erro durante o teste:", error);
    console.error("📝 Código do erro:", error.code);
    console.error("💬 Mensagem:", error.message);
    
    if (error.code === 'storage/unauthorized') {
      console.log("\n🔧 SOLUÇÃO: Configure as regras do Firebase Storage:");
      console.log("1. Acesse o console do Firebase");
      console.log("2. Vá para Storage > Regras");
      console.log("3. Configure as regras para permitir upload:");
      console.log(`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /assinaturas/{allPaths=**} {
      allow read: if true;
      allow write: if true; // TEMPORÁRIO - para teste
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
      `);
    }
  }
}

testStorageUpload(); 