import { NextRequest, NextResponse } from 'next/server'
import { firestore } from '@/lib/firebase'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')

    console.log('🔍 Verificando certificado com ID:', id)

    if (!id) {
      console.log('❌ ID do certificado não fornecido')
      return NextResponse.json(
        { error: 'ID do certificado é obrigatório' },
        { status: 400 }
      )
    }

    // Busca o certificado no Firestore usando o ID do certificado dentro do array de todos os alunos
    const alunosRef = collection(firestore, "alunos")
    const alunosSnap = await getDocs(alunosRef)
    console.log('📚 Verificando', alunosSnap.size, 'alunos...')
    
    let certificado = null
    let alunoEncontrado = null
    
    alunosSnap.forEach(docSnap => {
      const data = docSnap.data()
      const certificados = data.certificados || []
      console.log(`🔍 Verificando aluno: ${data.nome} (${certificados.length} certificados)`)
      
      const found = certificados.find((c: any) => {
        console.log(`  - Certificado ID: ${c.id}, Procurando por: ${id}`)
        return String(c.id) === String(id)
      })
      
      if (found) {
        certificado = found
        alunoEncontrado = data.nome
        console.log('✅ Certificado encontrado no aluno:', data.nome)
      }
    })
    
    if (!certificado) {
      console.log('❌ Certificado não encontrado')
      return NextResponse.json(
        { error: 'Certificado não encontrado' },
        { status: 404 }
      )
    }
    
    console.log('✅ Retornando certificado encontrado:', certificado)
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