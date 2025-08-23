import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, getFirestore } from 'firebase/firestore'
import { firebaseApp } from '@/lib/firebase'

// Forçar renderização dinâmica para evitar erro de build
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const nome = searchParams.get('nome')
    
    if (!nome) {
      return NextResponse.json(
        { success: false, error: 'Nome da assinatura é obrigatório' },
        { status: 400 }
      )
    }
    
    const db = getFirestore(firebaseApp)
    const assinaturasRef = collection(db, "assinaturas")
    const q = query(assinaturasRef, where("nome", "==", nome))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }
    
    const doc = snapshot.docs[0]
    const data = doc.data()
    
    return NextResponse.json({
      success: true,
      assinatura: {
        id: doc.id,
        nome: data.nome,
        imagemBase64: data.imagemBase64,
        dataCriacao: data.dataCriacao?.toDate?.() || data.dataCriacao
      }
    })
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar assinatura' },
      { status: 500 }
    )
  }
} 