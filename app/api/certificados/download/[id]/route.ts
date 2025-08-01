import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, getFirestore, collection, getDocs } from 'firebase/firestore'
import { firebaseApp } from '@/lib/firebase'
import { gerarPDFIndividual, CertificadoData } from '@/lib/pdf-download'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Buscando certificado com ID:', params.id)
    const db = getFirestore(firebaseApp)
    // Buscar o certificado pelo id dentro do array de todos os alunos
    const alunosRef = collection(db, "alunos")
    const alunosSnap = await getDocs(alunosRef)
    let certificado = null
    let certificadoId = null
    
    console.log('📚 Verificando', alunosSnap.size, 'alunos...')
    
    alunosSnap.forEach(docSnap => {
      const data = docSnap.data()
      const found = (data.certificados || []).find((c: any) => c.id === params.id)
      if (found) {
        certificado = found
        certificadoId = docSnap.id
        console.log('✅ Certificado encontrado no aluno:', docSnap.id)
      }
    })
    
    if (!certificado) {
      console.log('❌ Certificado não encontrado')
      return NextResponse.json(
        { error: 'Certificado não encontrado' },
        { status: 404 }
      )
    }
    
    console.log('📄 Dados do certificado:', certificado)
    // Prepara os dados do certificado para o script de download
    const certificadoData: CertificadoData = {
      id: params.id,
      aluno: certificado.nome || '',
      documento: certificado.documento || '',
      treinamento: certificado.treinamento || '',
      empresa: certificado.empresa || '',
      cargaHoraria: certificado.cargaHoraria || '',
      instrutor: certificado.instrutor || '',
      dataConclusao: certificado.dataConclusao || '',
      dataEmissao: certificado.dataEmissao || ''
    }

    console.log('🔄 Gerando PDF...')
    // Gera PDF usando o script separado
    const certificadoCompleto = await gerarPDFIndividual(certificadoData)
    
    console.log('✅ PDF gerado com sucesso, tamanho:', certificadoCompleto.size, 'bytes')
    
    // Retorna o PDF para download
    return new NextResponse(certificadoCompleto, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificado_${certificadoData.aluno.replace(/\s/g, '_')}.pdf"`
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF do certificado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 