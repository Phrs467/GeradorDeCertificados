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
import { gerarPDFCompleto, criarZIPComPDFs, downloadBlob, PDFData } from '@/lib/pdf-generator'
// Remover: import { adicionarCertificado } from '@/app/api/verificar-certificado/route'
import ProgressBar from '@/components/progress-bar'
import { AlertCircle, CheckCircle, XCircle, Upload, FileText, LogOut, Download, FileArchive, UserPlus } from "lucide-react"
import { useRef } from 'react'
import QRCode from 'qrcode'

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
      
      // Carrega os templates em paralelo
      const [templateFrenteResponse, templateVersoResponse] = await Promise.all([
        fetch('/template-frente.html'),
        fetch('/template-verso.html')
      ])
      
      if (!templateFrenteResponse.ok || !templateVersoResponse.ok) {
        throw new Error('Erro ao carregar templates')
      }
      
      const templateFrente = await templateFrenteResponse.text()
      const templateVerso = await templateVersoResponse.text()

      // Processa certificados em lotes para melhor performance
      const BATCH_SIZE = 3 // Processa 3 certificados por vez
      
      for (let i = 0; i < pessoas.length; i += BATCH_SIZE) {
        const batch = pessoas.slice(i, i + BATCH_SIZE)
        
        // Atualiza progresso
        setProgresso({ 
          atual: i + 1, 
          total: pessoas.length, 
          mensagem: `Processando lote ${Math.floor(i / BATCH_SIZE) + 1}...` 
        })
        
        // Processa o lote em paralelo
        const batchPromises = batch.map(async (pessoa, batchIndex) => {
          const globalIndex = i + batchIndex
          const linhaReal = globalIndex + 1 // Linha real na planilha (considerando que começamos do índice 0)
          const nome = pessoa.ALUNO || 'Sem Nome'
          const documento = pessoa.DOCUMENTO || ''
          const planilhaId = pessoa.ID || ''
          
          // Usa a função sanitizarNome com controle de duplicatas usando documento
          const nomeSanitizado = sanitizarNome(nome, documento, pessoasProcessadas)
          
          // Se está no modo correção, só processa o registro com o ID especificado
          if (modoCorrecao && String(planilhaId).trim() !== String(idCorrecao).trim()) {
            console.log(`⏭️ Linha ${linhaReal}: Modo correção - pulando registro com ID "${planilhaId}" (não é o ID "${idCorrecao}" especificado)`)
            return {
              nome: nomeSanitizado,
              certificadoCompleto: new Blob(),
              sucesso: false,
              erro: `Modo correção - ID "${planilhaId}" não corresponde ao ID "${idCorrecao}" especificado`,
              linha: linhaReal,
              skipped: true
            }
          }
          
          // Verifica se é um registro com "Sem Nome" - não gera certificado
          if (nome === 'Sem Nome' || nome.trim() === '') {
            // console.log(`❌ Linha ${linhaReal}: Nome vazio ou "Sem Nome"`)
            return {
              nome: 'Sem Nome',
              certificadoCompleto: new Blob(),
              sucesso: false,
              erro: 'Nome do aluno está vazio',
              linha: linhaReal,
              skipped: true
            }
          }
          
          // Verifica outros campos importantes na ordem especificada
          const temNome = pessoa.ALUNO && pessoa.ALUNO.trim() !== ''
          const temDocumento = pessoa.DOCUMENTO && pessoa.DOCUMENTO.trim() !== ''
          const temEmpresa = pessoa.EMPRESA && pessoa.EMPRESA.trim() !== ''
          const temTreinamento = pessoa.TREINAMENTO && pessoa.TREINAMENTO.trim() !== ''
          const temInstrutor = pessoa.INSTRUTOR && pessoa.INSTRUTOR.trim() !== ''
          const temCargaHoraria = pessoa['CARGA HORARIA'] && pessoa['CARGA HORARIA'].toString().trim() !== ''
          const temDataConclusao = pessoa['DATA CONCLUSÃO'] && pessoa['DATA CONCLUSÃO'].toString().trim() !== ''
          
          // Verifica se há campos vazios importantes na ordem especificada
          const errosCampos: string[] = []
          
          // 1. Documento (caso haja e não haja nome)
          if (!temNome && !temDocumento) {
            errosCampos.push('Documento está vazio')
          }
          
          // 2. Aluno (caso haja)
          if (!temNome) {
            errosCampos.push('Nome do aluno está vazio')
          }
          
          // 3. Outros campos obrigatórios
          if (!temEmpresa) errosCampos.push('Empresa está vazia')
          if (!temTreinamento) errosCampos.push('Treinamento está vazio')
          if (!temInstrutor) errosCampos.push('Nome do instrutor está vazio')
          if (!temCargaHoraria) errosCampos.push('Carga horária está vazia')
          if (!temDataConclusao) errosCampos.push('Data de conclusão está vazia')
          
          // Se há campos vazios importantes, não gera certificado
          if (errosCampos.length > 0) {
            // console.log(`❌ Linha ${linhaReal}: Erros de validação - ${errosCampos.join(', ')}`)
            return {
              nome: nome,
              certificadoCompleto: new Blob(),
              sucesso: false,
              erro: errosCampos.join(', '),
              linha: linhaReal,
              skipped: true
            }
          }
          
          // console.log(`✅ Linha ${linhaReal}: Nome sanitizado = "${nomeSanitizado}"`)
          
          try {
            // Primeiro, verifica se o ID já existe no banco
            const dadosCertificado = prepararDadosCertificado(pessoa)
            // console.log('📝 Dados do certificado a serem salvos:', dadosCertificado)
            
            // Se estiver no modo correção, verifica se o ID da planilha corresponde ao especificado
            if (modoCorrecao) {
              if (!idCorrecao.trim()) {
                // console.log('❌ Modo correção ativo mas ID não fornecido')
                return {
                  nome: nomeSanitizado,
                  certificadoCompleto: new Blob(),
                  sucesso: false,
                  erro: 'ID de correção não fornecido',
                  linha: linhaReal,
                  skipped: true
                }
              }
              // console.log('🔧 Modo correção ativo, verificando ID da planilha:', planilhaId)
            }
            
            const response = await fetch('/api/importar-certificados', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(modoCorrecao && { 'x-correcao': 'true' })
              },
              body: JSON.stringify(dadosCertificado),
            })
            
            const result = await response.json()
            // console.log('📊 Documento já existia?', result.exists ? 'Sim' : 'Não')
            // console.log('📊 Resultado completo da API:', result)
            
            // Verifica se o certificado já existe no banco
            if (result.exists && !modoCorrecao) {
              console.log(`⏭️ Linha ${linhaReal}: Certificado já existe no banco, pulando geração do PDF`)
              return {
                nome: nomeSanitizado,
                certificadoCompleto: new Blob(),
                sucesso: false,
                erro: 'Certificado já existe no banco de dados',
                linha: linhaReal,
                skipped: true
              }
            }
            
            // Verifica se houve erro na API
            if (!result.success) {
              console.log(`❌ Linha ${linhaReal}: Erro na API - ${result.error || 'Erro desconhecido'}`)
              return {
                nome: nomeSanitizado,
                certificadoCompleto: new Blob(),
                sucesso: false,
                erro: result.error || 'Erro na API',
                linha: linhaReal,
                skipped: true
              }
            }
            
            // Se está no modo correção, sempre gera o PDF (sobrescreve dados)
            if (modoCorrecao) {
              // console.log(`🔧 Linha ${linhaReal}: Modo correção - sobrescrevendo dados existentes`)
            } else {
              // console.log(`🆕 Linha ${linhaReal}: Certificado novo, gerando PDF...`)
            }
            
            const firestoreId = result.id // ID do documento no Firestore
            // console.log('🆔 ID do documento no Firestore:', firestoreId)
            
            // Gera QR code com o ID do Firestore
            const urlVerificacao = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/id/${firestoreId}`
            // console.log('🔗 URL de verificação:', urlVerificacao)
            const qrCodeDataURL = await QRCode.toDataURL(urlVerificacao)
            
            // Gera HTML da frente com QR code atualizado
            const nome = pessoa.ALUNO || ''
            const doc = pessoa.DOCUMENTO || ''
            const instrutor = pessoa.INSTRUTOR || ''
            const treinamento = pessoa.TREINAMENTO || ''
            const cargaHoraria = pessoa['CARGA HORARIA'] || ''
            const empresa = pessoa.EMPRESA || ''
            
            // Atualiza progresso individual apenas para certificados novos
            setProgresso({ 
              atual: globalIndex + 1, 
              total: pessoas.length, 
              mensagem: `Gerando PDF para: ${nome}` 
            })
            
            const scriptComQR = `
              <script>
                document.getElementById('aluno').textContent = '${nome.replace(/'/g, "\\'")}';
                document.getElementById('documento').textContent = 'DOC: ${doc.replace(/'/g, "\\'")}';
                document.getElementById('treinamento').textContent = '${treinamento.replace(/'/g, "\\'")}';
                document.getElementById('empresa').textContent = '${empresa.replace(/'/g, "\\'")}';
                document.getElementById('cargaHoraria').textContent = '${cargaHoraria} horas';
                document.getElementById('instrutor').textContent = '${instrutor.replace(/'/g, "\\'")}';
                
                // Adiciona QR code com o ID do Firestore
                const qrCodeImg = document.getElementById('qr-code');
                if (qrCodeImg) {
                  qrCodeImg.src = '${qrCodeDataURL}';
                  qrCodeImg.style.display = 'block';
                }
              </script>
            `;
            
            const frenteHTML = templateFrente.replace('</body>', scriptComQR + '</body>')
            
            // Gera HTML do verso
            const dataConclusaoFmt = pessoa['DATA CONCLUSÃO'] ? 
              new Date(pessoa['DATA CONCLUSÃO']).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              }) : ''
            
            const scriptVerso = `
              <script>
                document.getElementById('treinamento').textContent = '${pessoa.TREINAMENTO || ''}';
                document.getElementById('cargaHoraria').textContent = '${pessoa['CARGA HORARIA'] || ''} horas';
                document.getElementById('dataConclusao').textContent = '${dataConclusaoFmt}';
              </script>
            `;
            
            const versoHTML = templateVerso.replace('</body>', scriptVerso + '</body>')

            // Gera PDF completo (frente + verso)
            let certificadoCompleto
            try {
              certificadoCompleto = await gerarPDFCompleto(frenteHTML, versoHTML, nomeSanitizado)
              // console.log(`📄 PDF gerado para "${nomeSanitizado}" - Tamanho: ${certificadoCompleto.size} bytes`)
            } catch (pdfError) {
              console.error(`❌ Erro ao gerar PDF para "${nomeSanitizado}":`, pdfError)
              throw new Error(`Erro na geração do PDF: ${pdfError}`)
            }
            
            return {
              nome: nomeSanitizado,
              certificadoCompleto,
              sucesso: true,
              linha: linhaReal // Adiciona a linha do sucesso
            }
          } catch (error) {
            console.error(`Erro ao gerar certificado para ${nomeSanitizado}:`, error)
            return {
              nome: nomeSanitizado,
              certificadoCompleto: new Blob(),
              sucesso: false,
              erro: error instanceof Error ? error.message : 'Erro desconhecido',
              linha: linhaReal // Adiciona a linha do erro
            }
          }
        })
        
        // Aguarda o lote atual terminar
        const batchResults = await Promise.all(batchPromises)
        
        // Adiciona resultados aos arrays (apenas os que não foram pulados)
        for (const result of batchResults) {
          if (result.sucesso) {
            // console.log(`🎉 Sucesso: "${result.nome}" - PDF gerado`)
            pdfDataArray.push({
              nome: result.nome,
              certificadoCompleto: result.certificadoCompleto
            })
            // console.log(`📦 PDF adicionado ao array. Total atual: ${pdfDataArray.length}`)
          } else if (!result.skipped) {
            // console.log(`💥 Falha: "${result.nome}" - ${result.erro}`)
          } else {
            // console.log(`⏭️ Pulado: "${result.nome}" - ${result.erro}`)
          }
          
          certificadosCriados.push({
            nome: result.nome,
            sucesso: result.sucesso,
            erro: result.erro,
            linha: result.linha
          })
        }
      }
      
      // console.log(`📊 RESUMO DO PROCESSAMENTO:`)
      // console.log(`📦 PDFs no array: ${pdfDataArray.length}`)
      // console.log(`📋 Certificados processados: ${certificadosCriados.length}`)
      // console.log(`✅ Sucessos: ${certificadosCriados.filter(c => c.sucesso).length}`)
      // console.log(`❌ Erros: ${certificadosCriados.filter(c => !c.sucesso && !c.skipped).length}`)
      // console.log(`⏭️ Pulados: ${certificadosCriados.filter(c => c.skipped).length}`)
      
      // Cria arquivo ZIP com todos os PDFs (apenas os bem-sucedidos)
      if (pdfDataArray.length > 0) {
        // console.log(`🗜️ Criando ZIP com ${pdfDataArray.length} PDFs...`)
        setProgresso({ 
          atual: pessoas.length, 
          total: pessoas.length, 
          mensagem: 'Criando arquivo ZIP...' 
        })
        
        const zipBlob = await criarZIPComPDFs(pdfDataArray)
        
        // Faz download do ZIP
        const dataAtual = new Date().toISOString().split('T')[0]
        downloadBlob(zipBlob, `certificados_${dataAtual}.zip`)
        // console.log(`✅ ZIP criado e baixado com sucesso!`)
        
        // Limpa o campo de correção após o download
        if (modoCorrecao) {
          setIdCorrecao('')
          setModoCorrecao(false)
          // console.log('🧹 Campos de correção limpos')
        }
      } else {
        // console.log(`⚠️ Nenhum PDF foi gerado para incluir no ZIP`)
      }
      
      // Calcula estatísticas finais
      const sucessos = certificadosCriados.filter(c => c.sucesso).length
      const erros = certificadosCriados.filter(c => !c.sucesso).length
      const endTime = performance.now()
      const tempoTotal = (endTime - startTime) / 1000
      const tempoMedio = sucessos > 0 ? tempoTotal / sucessos : 0
      
      // console.log(`📊 RESUMO FINAL:`)
      // console.log(`✅ Sucessos: ${sucessos}`)
      // console.log(`❌ Erros: ${erros}`)
      // console.log(`⏱️ Tempo total: ${tempoTotal.toFixed(2)}s`)
      // console.log(`📈 Tempo médio: ${tempoMedio.toFixed(2)}s`)
      
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
      {/* Navbar fixa no topo */}
      <nav className="fixed top-0 left-0 w-full z-50 shadow border-b border-blue-900" style={{height: 60, backgroundColor: '#06459a'}}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <img src="/OwlTechLogo.png" alt="Logo ISP Certificados" className="w-8 h-8 object-contain bg-white rounded-lg" style={{ padding: 2 }} />
            <span className="font-bold text-white text-lg">ISP CERTIFICADOS</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              className="text-white hover:text-blue-200 font-medium transition"
              onClick={() => router.push('/dashboard')}
            >
              Dashboard
            </button>
            <button
              className="text-white hover:text-blue-200 font-medium transition"
              onClick={() => router.push('/alunos')}
            >
              Alunos
            </button>
            <button
              className="text-white hover:text-blue-200 font-medium transition"
              onClick={() => router.push('/relatorios')}
            >
              Relatórios
            </button>
            <button
              className="text-white hover:text-blue-200 font-medium transition"
              onClick={handleCadastrarUsuario}
            >
              Usuários
            </button>
            <button
              className="text-white hover:text-blue-200 font-medium transition"
              onClick={() => router.push('/assinaturas')}
            >
              Assinaturas
            </button>
            <button
              className="text-white hover:text-blue-200 font-medium transition"
              onClick={onLogout}
            >
              Sair
            </button>
          </div>
        </div>
      </nav>
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
