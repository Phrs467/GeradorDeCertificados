import { NextRequest, NextResponse } from 'next/server'
import { firestore } from '@/lib/firebase'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do certificado é obrigatório' },
        { status: 400 }
      )
    }

    // Busca o certificado no Firestore usando o ID do certificado dentro do array de todos os alunos
    const alunosRef = collection(firestore, "alunos")
    const alunosSnap = await getDocs(alunosRef)
    let certificado = null
    alunosSnap.forEach(docSnap => {
      const data = docSnap.data()
      const found = (data.certificados || []).find((c: any) => c.id === id)
      if (found) {
        certificado = found
      }
    })
    if (!certificado) {
      return NextResponse.json(
        { error: 'Certificado não encontrado' },
        { status: 404 }
      )
    }
    // Retorna os dados do certificado
    return NextResponse.json(certificado)
    
  } catch (error) {
    console.error('Erro ao verificar certificado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 