import { NextRequest, NextResponse } from 'next/server'
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  getFirestore
} from 'firebase/firestore'
import { firebaseApp } from '@/lib/firebase'

// 1️⃣ Garante renderização dinâmica
export const dynamic = 'force-dynamic'

interface Assinatura {
  id: string
  nome: string
  urlImagem?: string
  dataCriacao: string
}

export async function GET(request: NextRequest) {
  // 2️⃣ Extrai antes do try/catch
  const nome = request.nextUrl.searchParams.get('nome')
  if (!nome) {
    return NextResponse.json(
      { success: false, error: 'Parâmetro "nome" é obrigatório' },
      { status: 400 }
    )
  }

  try {
    const db = getFirestore(firebaseApp)
    const assinaturasRef = collection(db, 'assinaturas')

    // 4️⃣ Usa limit(1) para eficiência
    const q = query(
      assinaturasRef,
      where('nome', '==', nome),
      limit(1)
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    // Pega o único doc retornado
    const docSnap = snapshot.docs[0]
    const raw = docSnap.data()

    // 5️⃣ Converte Timestamp (se houver) em string ISO
    const dataCriacaoTs = raw.dataCriacao
    const dataCriacao = typeof dataCriacaoTs?.toDate === 'function'
      ? dataCriacaoTs.toDate().toISOString()
      : new Date(dataCriacaoTs).toISOString()

    const assinatura: Assinatura = {
      id: docSnap.id,
      nome: raw.nome,
      urlImagem: raw.urlImagem,
      dataCriacao
    }

    // 6️⃣ Resposta padronizada
    return NextResponse.json(
      { success: true, assinatura },
      { status: 200 }
    )
  } catch (err) {
    console.error('Erro ao buscar assinatura:', err)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao buscar assinatura' },
      { status: 500 }
    )
  }
}