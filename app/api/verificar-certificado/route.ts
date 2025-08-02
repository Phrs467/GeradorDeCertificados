import { NextRequest, NextResponse } from 'next/server'
import { firestore } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

// 1️⃣ Garante que este handler seja sempre executado no servidor por requisição
export const dynamic = 'force-dynamic'

interface Certificado {
  id: string
  // …outras propriedades que você tenha no seu certificado
}

export async function GET(request: NextRequest) {
  // 2️⃣ Extrai o param fora do try
  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: 'ID do certificado é obrigatório' },
      { status: 400 }
    )
  }

  try {
    // 3️⃣ Busca todos os alunos
    const alunosSnap = await getDocs(collection(firestore, 'alunos'))

    let certificado: Certificado | null = null

    // 4️⃣ Usa for…of para poder dar break
    for (const alunoDoc of alunosSnap.docs) {
      const data = alunoDoc.data() as { certificados?: Certificado[] }
      const found = (data.certificados ?? []).find(c => c.id === id)
      if (found) {
        certificado = found
        break
      }
    }

    if (!certificado) {
      return NextResponse.json(
        { error: 'Certificado não encontrado' },
        { status: 404 }
      )
    }

    // 5️⃣ Retorna somente o objeto encontrado
    return NextResponse.json(certificado)
  } catch (err) {
    console.error('Erro ao verificar certificado:', err)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}