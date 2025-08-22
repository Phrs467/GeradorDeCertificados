import { collection, getDocs, addDoc, deleteDoc, doc, getFirestore, query, where } from 'firebase/firestore'
import { firebaseApp } from './firebase'

interface Assinatura {
  id: string
  nome: string
  imagemBase64: string
  dataCriacao: Date
}

// Converter arquivo para Base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Remover o prefixo "data:image/...;base64," para armazenar apenas o Base64
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = error => reject(error)
  })
}

// Converter Base64 para URL de dados
export function base64ToDataURL(base64: string, mimeType: string = 'image/png'): string {
  return `data:${mimeType};base64,${base64}`
}

// Buscar assinatura por nome
export async function buscarAssinatura(nome: string): Promise<Assinatura | null> {
  try {
    if (!nome || nome.trim() === '') {
      console.log('🔍 Busca de assinatura: Nome vazio ou inválido')
      return null
    }

    console.log(`🔍 Buscando assinatura para: "${nome}"`)
    
    const db = getFirestore(firebaseApp)
    const assinaturasRef = collection(db, "assinaturas")
    const q = query(assinaturasRef, where("nome", "==", nome.trim()))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      console.log(`❌ Assinatura não encontrada para: "${nome}"`)
      return null
    }
    
    const doc = snapshot.docs[0]
    const data = doc.data()
    
    console.log(`✅ Assinatura encontrada para: "${nome}"`)
    
    return {
      id: doc.id,
      nome: data.nome,
      imagemBase64: data.imagemBase64,
      dataCriacao: data.dataCriacao?.toDate?.() || data.dataCriacao
    }
  } catch (error) {
    console.error(`❌ Erro ao buscar assinatura para "${nome}":`, error)
    return null
  }
}

// Buscar todas as assinaturas
export async function buscarTodasAssinaturas(): Promise<Assinatura[]> {
  try {
    console.log('🔍 Buscando todas as assinaturas...')
    
    const db = getFirestore(firebaseApp)
    const assinaturasRef = collection(db, "assinaturas")
    const snapshot = await getDocs(assinaturasRef)
    const assinaturas: Assinatura[] = []
    
    snapshot.forEach(doc => {
      const data = doc.data()
      assinaturas.push({
        id: doc.id,
        nome: data.nome,
        imagemBase64: data.imagemBase64,
        dataCriacao: data.dataCriacao?.toDate?.() || data.dataCriacao
      })
    })
    
    console.log(`✅ Encontradas ${assinaturas.length} assinaturas`)
    
    return assinaturas.sort((a, b) => b.dataCriacao.getTime() - a.dataCriacao.getTime())
  } catch (error) {
    console.error('❌ Erro ao buscar assinaturas:', error)
    return []
  }
}

// Cadastrar nova assinatura
export async function cadastrarAssinatura(nome: string, arquivo: File): Promise<boolean> {
  try {
    const db = getFirestore(firebaseApp)
    
    // Converter arquivo para Base64
    const imagemBase64 = await fileToBase64(arquivo)
    
    // Salvar no Firestore
    const assinaturaData = {
      nome: nome.trim(),
      imagemBase64: imagemBase64,
      dataCriacao: new Date()
    }
    
    await addDoc(collection(db, "assinaturas"), assinaturaData)
    return true
  } catch (error) {
    console.error('Erro ao cadastrar assinatura:', error)
    return false
  }
}

// Excluir assinatura
export async function excluirAssinatura(id: string): Promise<boolean> {
  try {
    const db = getFirestore(firebaseApp)
    await deleteDoc(doc(db, "assinaturas", id))
    return true
  } catch (error) {
    console.error('Erro ao excluir assinatura:', error)
    return false
  }
}

// Gerar HTML para uma assinatura
export function gerarHTMLAssinatura(nome: string, posicaoCSS: string = 'assinatura'): string {
  return `
    <div class="${posicaoCSS}" style="text-align: center; margin: 20px 0;">
      <div style="border-bottom: 1px solid #000; width: 150px; margin: 0 auto 10px auto;"></div>
      <div style="font-weight: bold; font-size: 14px;">${nome}</div>
    </div>
  `
}

// Gerar HTML para múltiplas assinaturas
export async function gerarHTMLMultiplasAssinaturas(assinaturas: Array<{nome: string, posicao: string, titulo: string}>): Promise<string> {
  let html = '<div style="display: flex; justify-content: space-around; margin-top: 40px;">'
  
  for (const assinatura of assinaturas) {
    const assinaturaData = await buscarAssinatura(assinatura.nome)
    
    if (assinaturaData) {
      // Assinatura encontrada - usar imagem
      html += `
        <div class="${assinatura.posicao}" style="text-align: center; flex: 1;">
          <img src="data:image/png;base64,${assinaturaData.imagemBase64}" 
               alt="Assinatura de ${assinatura.nome}" 
               style="max-width: 150px; max-height: 60px; object-fit: contain;">
          <div style="font-weight: bold; font-size: 14px; margin-top: 5px;">${assinatura.titulo}</div>
        </div>
      `
    } else {
      // Assinatura não encontrada - usar texto
      html += `
        <div class="${assinatura.posicao}" style="text-align: center; flex: 1;">
          <div style="border-bottom: 1px solid #000; width: 150px; margin: 0 auto 10px auto;"></div>
          <div style="font-weight: bold; font-size: 14px;">${assinatura.nome}</div>
          <div style="font-size: 12px; color: #666;">${assinatura.titulo}</div>
        </div>
      `
    }
  }
  
  html += '</div>'
  return html
}

// Validar arquivo de imagem
export function validarArquivoImagem(file: File): { valido: boolean, erro?: string } {
  // Verificar se é uma imagem
  if (!file.type.startsWith('image/')) {
    return { valido: false, erro: 'Por favor, selecione apenas arquivos de imagem' }
  }
  
  // Verificar tamanho (máximo 1MB para Base64)
  const maxSize = 1 * 1024 * 1024 // 1MB
  if (file.size > maxSize) {
    return { valido: false, erro: 'A imagem deve ter menos de 1MB' }
  }
  
  return { valido: true }
} 