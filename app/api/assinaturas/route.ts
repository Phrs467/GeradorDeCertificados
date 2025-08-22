import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, getFirestore } from 'firebase/firestore'
import { firebaseApp } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const db = getFirestore(firebaseApp)
    const assinaturasRef = collection(db, "assinaturas")
    const snapshot = await getDocs(assinaturasRef)
    const assinaturas: any[] = []
    
    snapshot.forEach(doc => {
      const data = doc.data()
      assinaturas.push({
        id: doc.id,
        nome: data.nome,
        imagemBase64: data.imagemBase64,
        dataCriacao: data.dataCriacao?.toDate?.() || data.dataCriacao
      })
    })
    
    return NextResponse.json({ 
      success: true, 
      assinaturas: assinaturas.sort((a, b) => {
        const dateA = new Date(a.dataCriacao).getTime()
        const dateB = new Date(b.dataCriacao).getTime()
        return dateB - dateA
      })
    })
  } catch (error) {
    console.error('Erro ao buscar assinaturas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar assinaturas' },
      { status: 500 }
    )
  }
} 