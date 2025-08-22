import { NextRequest, NextResponse } from 'next/server'
import { firestore } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const { documento, certificados } = await request.json()
    
    console.log(`🔍 Verificando certificados existentes para documento: ${documento}`)
    
    // Busca o aluno pelo documento
    const alunosRef = collection(firestore, "alunos")
    const q = query(alunosRef, where("documento", "==", documento))
    const querySnapshot = await getDocs(q)
    
    const certificadosExistentes: string[] = []
    
    if (!querySnapshot.empty) {
      const alunoDoc = querySnapshot.docs[0]
      const alunoData = alunoDoc.data()
      const certificadosAluno = alunoData.certificados || []
      
      // Verifica quais IDs já existem
      certificados.forEach((cert: any) => {
        const existe = certificadosAluno.some((c: any) => String(c.id) === String(cert.id))
        if (existe) {
          certificadosExistentes.push(String(cert.id))
        }
      })
    }
    
    console.log(`�� Certificados existentes encontrados: ${certificadosExistentes.length}`)
    
    return NextResponse.json({
      success: true,
      certificadosExistentes: certificadosExistentes
    })
    
  } catch (error) {
    console.error('Erro ao verificar certificados existentes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
