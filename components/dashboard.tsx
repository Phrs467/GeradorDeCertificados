"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { processarArquivoExcel, Pessoa, ErroLinha, ResultadoProcessamento, gerarHTMLCertificado, prepararDadosCertificado, sanitizarNome } from '@/lib/certificate-generator'
import { buscarAssinatura } from '@/lib/assinatura-utils'
import { gerarPDFCompleto, criarZIPComPDFs, downloadBlob, PDFData } from '@/lib/pdf-generator'
// Remover: import { adicionarCertificado } from '@/app/api/verificar-certificado/route'
import ProgressBar from '@/components/progress-bar'
import { AlertCircle, CheckCircle, XCircle, Upload, FileText, LogOut, Download, FileArchive, UserPlus } from "lucide-react"
import { useRef } from 'react'
import QRCode from 'qrcode'
import Navbar from '@/components/navbar'

// Definir tipo Usuario localmente
interface Usuario {
  id: string
  nome: string
  email: string
  chave_de_acesso: string
  funcao?: string
}

interface DashboardProps {
  usuario: Usuario
  onLogout: () => void
}

interface CertificadoResultado {
  nome: string
  sucesso: boolean
  erro?: string
  linha?: number
}

interface ResultadoGeracao {
  sucessos: number
  erros: number
  tempoTotal: string
  tempoMedio: string
}

interface Progresso {
  atual: number
  total: number
  mensagem: string
}

export default function Dashboard({ usuario, onLogout }: DashboardProps) {
  const router = useRouter()
  const [arquivoImportado, setArquivoImportado] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [certificadosGerados, setCertificadosGerados] = useState<CertificadoResultado[]>([])
  const [progresso, setProgresso] = useState<Progresso>({ atual: 0, total: 0, mensagem: '' })
  const [errosValidacao, setErrosValidacao] = useState<any[]>([]) // Changed to any[] as ErroLinha is removed
  const [resultadoGeracao, setResultadoGeracao] = useState<ResultadoGeracao | null>(null)
  const uploadFormRef = useRef<HTMLFormElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<string | null>(null)
  const [modoCorrecao, setModoCorrecao] = useState(false)
  const [idCorrecao, setIdCorrecao] = useState('')

  const formatarTempo = (segundos: number): string => {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const segs = Math.floor(segundos % 60)
    const milissegundos = Math.floor((segundos % 1) * 1000)
    
    if (horas > 0) {
      return `${horas}h ${minutos}m ${segs}s`
    } else if (minutos > 0) {
      return `${minutos}m ${segs}s`
    } else if (segs > 0) {
      return `${segs}s ${milissegundos}ms`
    } else {
      return `${milissegundos}ms`
    }
  }

  const handleCadastrarUsuario = () => {
    console.log("🔘 Botão 'Cadastrar Usuário' clicado")
    console.log("👤 Usuário atual:", usuario.nome)
    console.log("🔑 Função do usuário:", usuario.funcao)
    console.log("🔄 Redirecionando para /cadastrar-usuario...")
    router.push('/cadastrar-usuario')
  }

  const handleImportarArquivo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0]
    if (!arquivo) return

    setArquivoImportado(arquivo)
    setLoading(true)
    setErrosValidacao([])

    try {
      //console.log(`📁 Processando arquivo: ${arquivo.name}`)
      
      const resultado: ResultadoProcessamento = await processarArquivoExcel(arquivo)
      
      setPessoas(resultado.pessoas)
      setErrosValidacao(resultado.erros)
      
      console.log(`✅ Processamento concluído: ${resultado.pessoas.length} registros válidos`)
      if (resultado.erros.length > 0) {
        console.log(`⚠️ Encontrados ${resultado.erros.length} erros de validação`)
      }
      
      // Log dos primeiros e últimos registros para debug
      if (resultado.pessoas.length > 0) {
        console.log(`📊 Primeiro registro: ${resultado.pessoas[0].ALUNO} - ${resultado.pessoas[0].TREINAMENTO}`)
        console.log(`📊 Último registro: ${resultado.pessoas[resultado.pessoas.length - 1].ALUNO} - ${resultado.pessoas[resultado.pessoas.length - 1].TREINAMENTO}`)
      }
      
    } catch (error) {
      console.error('Erro ao processar arquivo:', error)
      alert('Erro ao processar arquivo Excel')
    } finally {
      setLoading(false)
    }
  }

  const handleGerarCertificados = async () => {
    if (!arquivoImportado || pessoas.length === 0) return

    // Validação do modo correção
    if (modoCorrecao && !idCorrecao.trim()) {
      alert('Por favor, forneça o ID da planilha que deseja corrigir. Apenas o registro da planilha com este ID será processado.')
      return
    }

    // Validação adicional: verificar se o ID existe na planilha
    if (modoCorrecao) {
      const idExisteNaPlanilha = pessoas.some(pessoa => String(pessoa.ID).trim() === String(idCorrecao).trim())
      if (!idExisteNaPlanilha) {
        alert(`ID "${idCorrecao}" não encontrado na planilha. Verifique se o ID está correto.`)
        return
      }
      console.log(`🔧 Modo correção ativado para ID: "${idCorrecao}"`)
    }

    setLoading(true)
    const certificadosCriados: CertificadoResultado[] = []
    const pdfDataArray: PDFData[] = []
    const startTime = performance.now()
    
    // Mapa para controlar nomes duplicados
    const pessoasProcessadas = new Map<string, number>()

    try {
      // Inicializa progresso
      setProgresso({ atual: 0, total: pessoas.length, mensagem: 'Carregando templates...' })
      
      // CORREÇÃO: Carrega os templates em paralelo, mas lê cada um apenas uma vez
      const [templateFrenteResponse, templateVersoResponse] = await Promise.all([
        fetch('/template-frente.html'),
        fetch('/template-verso.html')
      ])
      
      if (!templateFrenteResponse.ok || !templateVersoResponse.ok) {
        throw new Error('Erro ao carregar templates')
      }
      
      // CORREÇÃO: Lê cada template apenas uma vez
      const templateFrente = await templateFrenteResponse.text()
      const templateVerso = await templateVersoResponse.text()

      // NOVA LÓGICA: Agrupa certificados por aluno ANTES de processar
      console.log('🔄 Agrupando certificados por aluno...')
      const certificadosPorAluno = new Map<string, {
        nome: string
        documento: string
        empresa: string
        certificados: any[]
      }>()

      // Filtra apenas pessoas válidas para processamento
      const pessoasValidas = pessoas.filter(pessoa => {
        const nome = pessoa.ALUNO || ''
        const documento = pessoa.DOCUMENTO || ''
        return nome.trim() !== '' && documento.trim() !== ''
      })

      // Agrupa por documento (identificação única do aluno)
      pessoasValidas.forEach(pessoa => {
        const documento = String(pessoa.DOCUMENTO || '').trim()
        const documentoNormalizado = documento.replace(/[.\-\s]/g, '')
        
        if (!certificadosPorAluno.has(documentoNormalizado)) {
          certificadosPorAluno.set(documentoNormalizado, {
            nome: pessoa.ALUNO || '',
            documento: documento,
            empresa: pessoa.EMPRESA || '',
            certificados: []
          })
        }

        const certificado = {
          cargaHoraria: Number(pessoa['CARGA HORARIA'] || 0),
          dataConclusao: pessoa['DATA CONCLUSÃO'] || '',
          dataEmissao: pessoa['DATA EMISSÃO'] || '',
          documento: documento,
          empresa: pessoa.EMPRESA || '',
          id: pessoa.ID || '',
          instrutor: pessoa.INSTRUTOR || '',
          nome: pessoa.ALUNO || '',
          treinamento: pessoa.TREINAMENTO || ''
        }

        certificadosPorAluno.get(documentoNormalizado)!.certificados.push(certificado)
      })

      console.log(`🎉 Agrupamento concluído: ${certificadosPorAluno.size} alunos únicos encontrados`)

      // Processa cada aluno com todos os seus certificados
      let totalProcessados = 0
      for (const [documentoNormalizado, dadosAluno] of certificadosPorAluno) {
        console.log(`\n=== PROCESSANDO ALUNO: ${dadosAluno.nome} ===`)
        console.log(`📋 Total de certificados: ${dadosAluno.certificados.length}`)

        // Se está no modo correção, filtra apenas o certificado com o ID especificado
        let certificadosParaProcessar = dadosAluno.certificados
        if (modoCorrecao) {
          certificadosParaProcessar = dadosAluno.certificados.filter(cert => 
            String(cert.id).trim() === String(idCorrecao).trim()
          )
          if (certificadosParaProcessar.length === 0) {
            console.log(`⏭️ Modo correção: Nenhum certificado com ID "${idCorrecao}" encontrado para este aluno`)
            continue
          }
          console.log(`🔧 Modo correção: Processando apenas certificado com ID "${idCorrecao}"`)
        }

        // NOVO: Verifica quais certificados já existem no banco antes de enviar para a API
        let certificadosParaEnviar = certificadosParaProcessar
        if (!modoCorrecao) {
          try {
            console.log(`🔍 Verificando certificados existentes para ${dadosAluno.nome}...`)
            const responseVerificacao = await fetch(`/api/verificar-certificados-existentes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                documento: dadosAluno.documento,
                certificados: certificadosParaProcessar
              })
            })
            
            const resultadoVerificacao = await responseVerificacao.json()
            if (resultadoVerificacao.success) {
              certificadosParaEnviar = certificadosParaProcessar.filter(cert => 
                !resultadoVerificacao.certificadosExistentes.includes(String(cert.id))
              )
              console.log(` Dos ${certificadosParaProcessar.length} certificados, ${certificadosParaEnviar.length} são novos`)
            }
          } catch (error) {
            console.warn(`⚠️ Erro ao verificar certificados existentes:`, error)
            // Se der erro na verificação, envia todos (comportamento atual)
            certificadosParaEnviar = certificadosParaProcessar
          }
        }

        // Se não há certificados novos para enviar, pula
        if (certificadosParaEnviar.length === 0) {
          console.log(`⏭️ Nenhum certificado novo para ${dadosAluno.nome}, pulando`)
          continue
        }

        // Envia APENAS os certificados novos para a API
        try {
          console.log(`📤 Enviando ${certificadosParaEnviar.length} certificados novos para a API...`)
          
          // Cria um objeto com apenas os certificados novos
          const dadosParaAPI = {
            nome: dadosAluno.nome,
            documento: dadosAluno.documento,
            empresa: dadosAluno.empresa,
            certificados: certificadosParaEnviar  // ← Agora envia apenas os novos
          }

          const response = await fetch('/api/importar-certificados', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(modoCorrecao && { 'x-correcao': 'true' })
            },
            body: JSON.stringify(dadosParaAPI),
          })
          
          const result = await response.json()
          
          if (!result.success) {
            console.error(`❌ Erro na API para aluno ${dadosAluno.nome}:`, result.error)
            // Adiciona erro para cada certificado
            certificadosParaProcessar.forEach(cert => {
              certificadosCriados.push({
                nome: dadosAluno.nome,
                sucesso: false,
                erro: result.error || 'Erro na API',
                linha: totalProcessados + 1
              })
              totalProcessados++
            })
            continue
          }

          // IMPORTANTE: Só processa certificados que foram realmente criados/atualizados
          const certificadosProcessados = result.results || []
          
          console.log(`🔍 Resultado da API para ${dadosAluno.nome}:`, result)
          console.log(`📊 Certificados processados pela API:`, certificadosProcessados)
          
          if (certificadosProcessados.length === 0) {
            console.log(`⏭️ Nenhum certificado novo para este aluno, pulando geração de PDFs`)
            continue
          }

          // CRÍTICO: Processa APENAS os certificados retornados pela API como novos/atualizados
          const idsProcessados = new Set((certificadosProcessados || []).map((p: any) => String(p.planilhaId)))
          const certificadosParaPDF = certificadosParaProcessar.filter(c => idsProcessados.has(String(c.id)))

          console.log(`📄 Gerando PDFs para ${certificadosParaPDF.length} certificados processados`)

          // Agora processa apenas os certificados retornados pela API
          for (const certificado of certificadosParaPDF) {
            console.log(`🔄 Processando certificado: ${certificado.id} - ${certificado.treinamento}`)
            
            totalProcessados++
            setProgresso({ 
              atual: totalProcessados, 
              total: pessoasValidas.length, 
              mensagem: `Gerando PDF para: ${dadosAluno.nome} - ${certificado.treinamento}` 
            })

            try {
              // Usa a função sanitizarNome com controle de duplicatas usando documento
              const nomeSanitizado = sanitizarNome(dadosAluno.nome, dadosAluno.documento, pessoasProcessadas)
              console.log(`📝 Nome sanitizado: ${nomeSanitizado}`)
              
              // Gera QR code com o ID do certificado da planilha para validação
              let qrCodeDataURL = ''
              try {
                // Usa o ID do certificado da planilha para o QR Code
                const urlVerificacao = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/id/${certificado.id}`
                qrCodeDataURL = await QRCode.toDataURL(urlVerificacao)
                console.log(`✅ QR Code gerado para URL: ${urlVerificacao}`)
              } catch (error) {
                console.error('❌ Erro ao gerar QR Code:', error)
                qrCodeDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
              }

              // Busca assinatura do instrutor
              let assinaturaBase64 = ''
              try {
                if (certificado.instrutor && certificado.instrutor.trim()) {
                  const response = await fetch(`/api/assinaturas/buscar?nome=${encodeURIComponent(certificado.instrutor.trim())}`)
                  const data = await response.json()
                  if (data.success && data.assinatura && data.assinatura.imagemBase64) {
                    assinaturaBase64 = data.assinatura.imagemBase64
                  }
                }
              } catch (error) {
                console.error(`⚠️ Erro ao buscar assinatura para "${certificado.instrutor}":`, error)
              }

              // Substitui o placeholder da assinatura no template
              let templateComAssinatura = templateFrente
              if (assinaturaBase64) {
                templateComAssinatura = templateFrente.replace('{{ASSINATURA_BASE64}}', assinaturaBase64)
              } else {
                templateComAssinatura = templateFrente.replace('src="data:image/png;base64,{{ASSINATURA_BASE64}}"', 'src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" style="display: none;"')
              }

              const scriptComQR = `
                <script>
                  document.getElementById('aluno').textContent = '${dadosAluno.nome.replace(/'/g, "\\'")}';
                  document.getElementById('documento').textContent = 'DOC: ${dadosAluno.documento.replace(/'/g, "\\'")}';
                  document.getElementById('treinamento').textContent = '${certificado.treinamento.replace(/'/g, "\\'")}';
                  document.getElementById('empresa').textContent = '${dadosAluno.empresa.replace(/'/g, "\\'")}';
                  document.getElementById('cargaHoraria').textContent = '${certificado.cargaHoraria} horas';
                  document.getElementById('instrutor').textContent = '${certificado.instrutor.replace(/'/g, "\\'")}';
                  
                  const qrCodeImg = document.getElementById('qr-code');
                  if (qrCodeImg) {
                    qrCodeImg.src = '${qrCodeDataURL}';
                    qrCodeImg.style.display = 'block';
                  }
                </script>
              `;
              
              const frenteHTML = templateComAssinatura.replace('</body>', scriptComQR + '</body>')
              
              // Busca conteúdo pragmático
              let conteudoPragmatico = ''
              try {
                if (dadosAluno.empresa && certificado.treinamento) {
                  const response = await fetch(`/api/conteudo-pragmatico/buscar?empresa=${encodeURIComponent(dadosAluno.empresa.trim())}&treinamento=${encodeURIComponent(certificado.treinamento.trim())}`)
                  const data = await response.json()
                  if (data.success && data.conteudo) {
                    conteudoPragmatico = data.conteudo.conteudo
                  } else {
                    conteudoPragmatico = 'Conteúdo programático específico do treinamento.'
                  }
                } else {
                  conteudoPragmatico = 'Conteúdo programático específico do treinamento.'
                }
              } catch (error) {
                console.error('❌ Erro ao buscar conteúdo pragmático:', error)
                conteudoPragmatico = 'Conteúdo programático específico do treinamento.'
              }
              
              // Gera HTML do verso
              const dataConclusaoFmt = certificado.dataConclusao ? 
                new Date(certificado.dataConclusao).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                }) : ''
              
              const scriptVerso = `
                <script>
                  document.getElementById('treinamento').textContent = '${certificado.treinamento || ''}';
                  document.getElementById('cargaHoraria').textContent = '${certificado.cargaHoraria || ''} horas';
                  document.getElementById('dataConclusao').textContent = '${dataConclusaoFmt}';
                  document.getElementById('conteudo-pragmatico').textContent = '${conteudoPragmatico.replace(/'/g, "\\'").replace(/\n/g, '\\n')}';
                </script>
              `;
              
              const versoHTML = templateVerso
                .replace('{{CONTEUDO_PRAGMATICO}}', conteudoPragmatico)
                .replace('</body>', scriptVerso + '</body>')

              console.log(`📄 Chamando API para gerar PDF: ${nomeSanitizado}`)
              console.log(`📏 Tamanho HTML frente: ${frenteHTML.length}`)
              console.log(` Tamanho HTML verso: ${versoHTML.length}`)
              
              // Gera PDF completo usando a API diretamente
              try {
                console.log(` Chamando API /api/gerar-pdf...`)
                
                const pdfResponse = await fetch('/api/gerar-pdf', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    frenteHTML,
                    versoHTML,
                    nomeArquivo: nomeSanitizado
                  })
                })

                console.log(`📡 Resposta da API PDF: ${pdfResponse.status} ${pdfResponse.statusText}`)

                if (!pdfResponse.ok) {
                  const errorText = await pdfResponse.text()
                  console.error(`❌ Erro na API de PDF: ${pdfResponse.status} - ${errorText}`)
                  throw new Error(`Erro na API de PDF: ${pdfResponse.status} - ${errorText}`)
                }

                const pdfResult = await pdfResponse.json()
                console.log(`📄 Resultado da API PDF:`, pdfResult)
                
                if (!pdfResult.success) {
                  console.error(`❌ API de PDF retornou erro:`, pdfResult.error)
                  throw new Error(pdfResult.error || 'Erro ao gerar PDF')
                }

                if (!pdfResult.pdfBase64) {
                  console.error(`❌ API de PDF não retornou pdfBase64`)
                  throw new Error('API de PDF não retornou dados do PDF')
                }

                console.log(`✅ PDF base64 recebido, tamanho: ${pdfResult.pdfBase64.length} caracteres`)

                // Converte base64 para blob
                const pdfBytes = atob(pdfResult.pdfBase64)
                const pdfArray = new Uint8Array(pdfBytes.length)
                for (let i = 0; i < pdfBytes.length; i++) {
                  pdfArray[i] = pdfBytes.charCodeAt(i)
                }

                const certificadoCompleto = new Blob([pdfArray], { type: 'application/pdf' })
                console.log(`✅ Blob criado com sucesso, tamanho: ${certificadoCompleto.size} bytes`)
                
                // Adiciona ao array de PDFs
                pdfDataArray.push({
                  nome: nomeSanitizado,
                  certificadoCompleto: certificadoCompleto
                })

                // Marca como sucesso
                certificadosCriados.push({
                  nome: nomeSanitizado,
                  sucesso: true,
                  linha: totalProcessados
                })

                console.log(`✅ PDF adicionado ao array para "${nomeSanitizado}" - ${certificado.treinamento}`)
                console.log(`📊 Total de PDFs no array: ${pdfDataArray.length}`)
                
              } catch (pdfError) {
                console.error(`❌ Erro específico na geração do PDF para ${nomeSanitizado}:`, pdfError)
                throw pdfError // Re-lança o erro para ser capturado pelo catch externo
              }

            } catch (error) {
              console.error(`❌ Erro ao gerar PDF para ${dadosAluno.nome}:`, error)
              certificadosCriados.push({
                nome: dadosAluno.nome,
                sucesso: false,
                erro: error instanceof Error ? error.message : 'Erro desconhecido',
                linha: totalProcessados
              })
            }
          }

        } catch (error) {
          console.error(`❌ Erro ao processar aluno ${dadosAluno.nome}:`, error)
          // Marca todos os certificados deste aluno como erro
          certificadosParaProcessar.forEach(cert => {
            certificadosCriados.push({
              nome: dadosAluno.nome,
              sucesso: false,
              erro: error instanceof Error ? error.message : 'Erro desconhecido',
              linha: totalProcessados + 1
            })
            totalProcessados++
          })
        }
      }

      // Cria arquivo ZIP com todos os PDFs
      if (pdfDataArray.length > 0) {
        setProgresso({ 
          atual: pessoasValidas.length, 
          total: pessoasValidas.length, 
          mensagem: 'Criando arquivo ZIP...' 
        })
        
        const zipBlob = await criarZIPComPDFs(pdfDataArray)
        const dataAtual = new Date().toISOString().split('T')[0]
        downloadBlob(zipBlob, `certificados_${dataAtual}.zip`)
        console.log(`✅ ZIP criado e baixado com sucesso!`)
        
        // Chama a sincronização de alunos após o download do ZIP
        try {
          console.log('🔄 Iniciando sincronização de alunos após download do ZIP...')
          const syncResponse = await fetch('/api/sincronizar-alunos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          })
          
          if (syncResponse.ok) {
            const syncResult = await syncResponse.json()
            console.log('✅ Sincronização concluída:', syncResult.message)
          } else {
            console.log('⚠️ Erro na sincronização, mas ZIP foi baixado com sucesso')
          }
        } catch (syncError) {
          console.log('⚠️ Erro na sincronização, mas ZIP foi baixado com sucesso:', syncError)
        }
        
        // Limpa o campo de correção após o download
        if (modoCorrecao) {
          setIdCorrecao('')
          setModoCorrecao(false)
          console.log('🔄 Campos de correção limpos')
        }
      }

      // Calcula estatísticas finais
      const sucessos = certificadosCriados.filter(c => c.sucesso).length
      const erros = certificadosCriados.filter(c => !c.sucesso).length
      const endTime = performance.now()
      const tempoTotal = (endTime - startTime) / 1000
      const tempoMedio = sucessos > 0 ? tempoTotal / sucessos : 0
      
      setResultadoGeracao({
        sucessos,
        erros,
        tempoTotal: formatarTempo(tempoTotal),
        tempoMedio: formatarTempo(tempoMedio)
      })
      
      setCertificadosGerados(certificadosCriados)
      setProgresso({ atual: 0, total: 0, mensagem: '' })
      
    } catch (error) {
      console.error('Erro ao gerar certificados:', error)
      alert('Erro ao gerar certificados PDF')
    } finally {
      setLoading(false)
    }
  }

  // NOVO: Função para upload de planilha para o endpoint
  const handleUploadCertificados = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)
    setUploadResult(null)
    const formData = new FormData(uploadFormRef.current!)
    try {
      const res = await fetch('/api/importar-certificados', {
              method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setUploadResult(`Importação concluída! ${data.ids.length} certificados importados.`)
      } else {
        setUploadResult('Erro ao importar certificados: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (err) {
      setUploadResult('Erro ao importar certificados: ' + (err as any).message)
    } finally {
      setUploading(false)
    }
  }

  const certificadosSucesso = certificadosGerados.filter(c => c.sucesso)
  const certificadosErro = certificadosGerados.filter(c => !c.sucesso)

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      {/* Usando o componente Navbar */}
      <Navbar currentPage="dashboard" usuario={usuario} onLogout={onLogout} />
      <div style={{height: 60}} /> {/* Espaço para a navbar fixa */}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card de Importação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: "#06459a" }}>
                <Upload className="h-5 w-5" />
                <span>Importar Arquivo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="arquivo">Selecione o arquivo para importação</Label>
                <Input id="arquivo" type="file" onChange={handleImportarArquivo} accept=".csv,.xlsx,.xls" />
              </div>
              
              {/* Caixa de seleção para modo correção */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="modoCorrecao"
                  checked={modoCorrecao}
                  onChange={(e) => setModoCorrecao(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="modoCorrecao" className="text-sm font-medium">
                  Corrigir
                </Label>
              </div>
              
              {/* Campo para ID de correção */}
              {modoCorrecao && (
                <div className="space-y-2">
                  <Label htmlFor="idCorrecao">ID da planilha a ser corrigido</Label>
                  <Input
                    id="idCorrecao"
                    type="text"
                    value={idCorrecao}
                    onChange={(e) => setIdCorrecao(e.target.value)}
                    placeholder="Digite o ID da planilha que deseja corrigir"
                    className="w-full"
                  />
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <p><strong>Modo Correção Ativo:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Apenas o registro com o ID especificado será processado</li>
                      <li>Se o certificado já existir no banco, os dados serão atualizados</li>
                      <li>Um novo PDF será gerado com os dados corrigidos</li>
                      <li>Certificados com outros IDs serão ignorados</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {arquivoImportado && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>Arquivo selecionado:</strong> {arquivoImportado.name}
                  </p>
                  <p className="text-xs text-green-600">Tamanho: {(arquivoImportado.size / 1024).toFixed(2)} KB</p>
                  {pessoas.length > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      <strong>{pessoas.length} registros</strong> processados com sucesso
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Geração */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: "#06459a" }}>
                <FileArchive className="h-5 w-5" />
                <span>Gerar PDFs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Após importar o arquivo, clique no botão abaixo para gerar os certificados completos (frente + verso) em PDF e baixar em arquivo ZIP.
                </p>
                {loading && progresso.total > 0 && (
                  <div className="mt-4">
                    <ProgressBar 
                      current={progresso.atual} 
                      total={progresso.total} 
                      message={progresso.mensagem} 
                    />
                  </div>
                )}
                
                <Button
                  onClick={handleGerarCertificados}
                  disabled={!arquivoImportado || pessoas.length === 0 || loading}
                  className="w-full"
                  style={{
                    backgroundColor: arquivoImportado && pessoas.length > 0 ? "#06459a" : "#cccccc",
                    color: "#ffffff",
                  }}
                >
                  {loading ? (
                    <>
                      <FileArchive className="h-4 w-4 mr-2 animate-spin" />
                      Gerando PDFs...
                    </>
                  ) : (
                    <>
                      <FileArchive className="h-4 w-4 mr-2" />
                      Gerar PDFs ({pessoas.length})
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Erros de Validação */}
        {errosValidacao.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Erros de Validação na Planilha
              </CardTitle>
              <CardDescription className="text-red-600">
                {errosValidacao.length} linha(s) com dados incompletos foram encontradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {errosValidacao.map((erro, index) => (
                  <Alert key={index} className="border-red-300 bg-red-100">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Linha {erro.linha}:</strong> {erro.erro}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seção de Resultados da Geração */}
        {resultadoGeracao && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Resultado da Geração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{resultadoGeracao.sucessos}</div>
                  <div className="text-sm text-green-700">Certificados Gerados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{resultadoGeracao.erros}</div>
                  <div className="text-sm text-red-700">Erros</div>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-600">Tempo Total</div>
                  <div className="text-lg font-semibold">{resultadoGeracao.tempoTotal}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Tempo Médio</div>
                  <div className="text-lg font-semibold">{resultadoGeracao.tempoMedio}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Certificados Gerados */}
        {certificadosGerados.filter(c => c.sucesso).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Certificados Gerados
              </CardTitle>
              <CardDescription>
                {certificadosGerados.filter(c => c.sucesso).length} certificado(s) foram gerados com frente e verso unificados e baixados em arquivo ZIP:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {certificadosGerados.filter(c => c.sucesso).map((certificado, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-800">
                        {certificado.nome}_certificado.pdf
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações do Usuário */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle style={{ color: "#06459a" }}>Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-gray-500">Nome</Label>
                <p className="text-sm">{usuario.nome}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="text-sm">{usuario.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Função</Label>
                <p className="text-sm">{usuario.funcao || "Usuário"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Chave de Acesso válida até</Label>
                <p className="text-sm">{new Date(usuario.chave_de_acesso).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
