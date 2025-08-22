import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, getFirestore } from 'firebase/firestore'
import { firebaseApp } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresa = searchParams.get('empresa')
    const treinamento = searchParams.get('treinamento')
    
    if (!empresa || !treinamento) {
      return NextResponse.json(
        { success: false, error: 'Empresa e treinamento são obrigatórios' },
        { status: 400 }
      )
    }
    
    console.log(`🔍 Buscando conteúdo pragmático para: ${empresa} - ${treinamento}`)
    
    const db = getFirestore(firebaseApp)
    const conteudosRef = collection(db, "conteudos_pragmaticos")
    
    // Busca por empresa E treinamento (ambos devem corresponder)
    const q = query(
      conteudosRef, 
      where("empresa", "==", empresa.trim()),
      where("treinamento", "==", treinamento.trim())
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      console.log(`❌ Conteúdo não encontrado para: ${empresa} - ${treinamento}`)
      return NextResponse.json(
        { success: false, error: 'Conteúdo pragmático não encontrado para esta empresa e treinamento' },
        { status: 404 }
      )
    }
    
    const doc = snapshot.docs[0]
    const data = doc.data()
    
    console.log(`✅ Conteúdo encontrado para: ${empresa} - ${treinamento}`)
    
    return NextResponse.json({
      success: true,
      conteudo: {
        id: doc.id,
        empresa: data.empresa,
        treinamento: data.treinamento,
        conteudo: data.conteudo,
        dataCriacao: data.dataCriacao?.toDate?.() || data.dataCriacao,
        dataAtualizacao: data.dataAtualizacao?.toDate?.() || data.dataAtualizacao
      }
    })
  } catch (error) {
    console.error('❌ Erro ao buscar conteúdo pragmático:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao buscar conteúdo pragmático' },
      { status: 500 }
    )
  }
}
