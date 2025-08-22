import * as XLSX from 'xlsx'
import QRCode from 'qrcode'
import { buscarAssinatura } from './assinatura-utils'

export interface Pessoa {
  ID?: string
  EMPRESA?: string
  ALUNO?: string
  DOCUMENTO?: string
  INSTRUTOR?: string
  TREINAMENTO?: string
  'CARGA HORARIA'?: string
  'DATA CONCLUSÃO'?: string
  'DATA EMISSÃO'?: string
  'Emitido\nRelatorio'?: string
}

export interface CertificadoData {
  id: string
  nome: string
  documento: string
  treinamento: string
  empresa: string
  cargaHoraria: string
  instrutor: string
  dataConclusao: string
  dataEmissao: string
  certificado: string
}

export interface ErroLinha {
  linha: number
  erro: string
  dados: any
}

export interface ResultadoProcessamento {
  pessoas: Pessoa[]
  erros: ErroLinha[]
}

export function formatarDataPorExtenso(valor: any): string {
  if (!valor) return ''
  
  const data = new Date(valor)
  if (isNaN(data.getTime())) return String(valor)
  
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function processarArquivoExcel(arquivo: File): Promise<ResultadoProcessamento> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { cellDates: true })
        const firstSheet = workbook.SheetNames[0]
        const sheet = workbook.Sheets[firstSheet]
        
        console.log(`📊 Planilha: ${firstSheet}`)
        console.log(`📊 Range da planilha: ${sheet['!ref']}`)
        
        const erros: ErroLinha[] = []
        
        // Primeiro, tenta o método original para compatibilidade
        try {
          const pessoasOriginal = XLSX.utils.sheet_to_json(sheet, {
            defval: '',
            raw: false,
            range: 1 // Ignora a primeira linha (cabeçalho)
          }) as Pessoa[]

          console.log(`📊 Método original: ${pessoasOriginal.length} registros`)

          // Filtra registros válidos e captura erros
          const pessoasValidas: Pessoa[] = []
          pessoasOriginal.forEach((pessoa, index) => {
            const linha = index + 3 // +3 porque range: 1 ignora cabeçalho, index começa em 0, e cliente pede +1
            const temNome = pessoa.ALUNO && pessoa.ALUNO.trim() !== ''
            const temDocumento = pessoa.DOCUMENTO && pessoa.DOCUMENTO.trim() !== ''
            const temEmpresa = pessoa.EMPRESA && pessoa.EMPRESA.trim() !== ''
            const temTreinamento = pessoa.TREINAMENTO && pessoa.TREINAMENTO.trim() !== ''
            const temInstrutor = pessoa.INSTRUTOR && pessoa.INSTRUTOR.trim() !== ''
            const temCargaHoraria = pessoa['CARGA HORARIA'] && pessoa['CARGA HORARIA'].toString().trim() !== ''
            const temDataConclusao = pessoa['DATA CONCLUSÃO'] && pessoa['DATA CONCLUSÃO'].toString().trim() !== ''
            
            // Sempre adiciona à lista de pessoas válidas, mas marca erros
            pessoasValidas.push(pessoa)
            
            // Verifica cada campo na ordem especificada
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
            
            if (errosCampos.length > 0) {
              erros.push({
                linha: index + 3, // Linha real na planilha + 1 (regra do cliente)
                erro: errosCampos.join(', '),
                dados: pessoa
              })
            }
          })

          console.log(`✅ Dados processados: ${pessoasValidas.length} registros válidos de ${pessoasOriginal.length} total`)

          if (pessoasValidas.length > 0) {
            resolve({ pessoas: pessoasValidas, erros })
            return
          }
        } catch (error) {
          console.log('Método original falhou, tentando método alternativo...')
        }

        // Método alternativo: processamento manual
        const allData = XLSX.utils.sheet_to_json(sheet, {
          defval: '',
          raw: false,
          header: 1 // Retorna arrays em vez de objetos para debug
        }) as any[][]

        console.log(`📊 Total de linhas na planilha: ${allData.length}`)

        if (allData.length < 2) {
          reject(new Error('Planilha muito pequena ou vazia'))
          return
        }

        // Analisa o cabeçalho para encontrar as colunas corretas
        const cabecalho = allData[0]
        console.log(`📊 Cabeçalho: ${cabecalho.join(' | ')}`)

        // Mapeia as colunas baseado no cabeçalho
        const colunas = {
          ID: -1,
          EMPRESA: -1,
          ALUNO: -1,
          DOCUMENTO: -1,
          INSTRUTOR: -1,
          TREINAMENTO: -1,
          'CARGA HORARIA': -1,
          'DATA CONCLUSÃO': -1,
          'DATA EMISSÃO': -1,
          'Emitido\nRelatorio': -1
        }

        cabecalho.forEach((col, index) => {
          const colStr = String(col).toLowerCase().trim()
          if (colStr.includes('id') || colStr.includes('código')) colunas.ID = index
          else if (colStr.includes('empresa')) colunas.EMPRESA = index
          else if (colStr.includes('aluno') || colStr.includes('nome')) colunas.ALUNO = index
          else if (colStr.includes('documento') || colStr.includes('cpf') || colStr.includes('rg')) colunas.DOCUMENTO = index
          else if (colStr.includes('instrutor') || colStr.includes('professor')) colunas.INSTRUTOR = index
          else if (colStr.includes('treinamento') || colStr.includes('curso')) colunas.TREINAMENTO = index
          else if (colStr.includes('carga') || colStr.includes('horária')) colunas['CARGA HORARIA'] = index
          else if (colStr.includes('conclusão') || colStr.includes('conclusao')) colunas['DATA CONCLUSÃO'] = index
          else if (colStr.includes('emissão') || colStr.includes('emissao')) colunas['DATA EMISSÃO'] = index
          else if (colStr.includes('emitido') || colStr.includes('relatório')) colunas['Emitido\nRelatorio'] = index
        })

        console.log(`📊 Mapeamento de colunas:`, colunas)

        // Filtra linhas vazias e processa apenas linhas com dados
        const linhasComDados = allData.filter((linha, index) => {
          if (index === 0) return false // Ignora cabeçalho

          // Verifica se a linha tem pelo menos um campo com dados
          const temDados = linha.some(cell => cell && String(cell).trim() !== '')
          if (!temDados) {
            console.log(`📊 Linha ${index + 1} vazia, ignorando`)
          }
          return temDados
        })

        console.log(`📊 Linhas com dados (após filtro): ${linhasComDados.length}`)

        // Converte para objetos Pessoa e valida
        const pessoas: Pessoa[] = []
        linhasComDados.forEach((linha, index) => {
          const linhaReal = allData.indexOf(linha) + 1 // Linha real na planilha
          
          const pessoa: Pessoa = {
            ID: colunas.ID >= 0 ? linha[colunas.ID] || '' : '',
            EMPRESA: colunas.EMPRESA >= 0 ? linha[colunas.EMPRESA] || '' : '',
            ALUNO: colunas.ALUNO >= 0 ? linha[colunas.ALUNO] || '' : '',
            DOCUMENTO: colunas.DOCUMENTO >= 0 ? linha[colunas.DOCUMENTO] || '' : '',
            INSTRUTOR: colunas.INSTRUTOR >= 0 ? linha[colunas.INSTRUTOR] || '' : '',
            TREINAMENTO: colunas.TREINAMENTO >= 0 ? linha[colunas.TREINAMENTO] || '' : '',
            'CARGA HORARIA': colunas['CARGA HORARIA'] >= 0 ? linha[colunas['CARGA HORARIA']] || '' : '',
            'DATA CONCLUSÃO': colunas['DATA CONCLUSÃO'] >= 0 ? linha[colunas['DATA CONCLUSÃO']] || '' : '',
            'DATA EMISSÃO': colunas['DATA EMISSÃO'] >= 0 ? linha[colunas['DATA EMISSÃO']] || '' : '',
            'Emitido\nRelatorio': colunas['Emitido\nRelatorio'] >= 0 ? linha[colunas['Emitido\nRelatorio']] || '' : ''
          }

          // Sempre adiciona à lista de pessoas, mas marca erros
          pessoas.push(pessoa)

          // Valida campos obrigatórios na ordem especificada
          const temNome = pessoa.ALUNO && pessoa.ALUNO.trim() !== ''
          const temDocumento = pessoa.DOCUMENTO && pessoa.DOCUMENTO.trim() !== ''
          const temEmpresa = pessoa.EMPRESA && pessoa.EMPRESA.trim() !== ''
          const temTreinamento = pessoa.TREINAMENTO && pessoa.TREINAMENTO.trim() !== ''
          const temInstrutor = pessoa.INSTRUTOR && pessoa.INSTRUTOR.trim() !== ''
          const temCargaHoraria = pessoa['CARGA HORARIA'] && pessoa['CARGA HORARIA'].toString().trim() !== ''
          const temDataConclusao = pessoa['DATA CONCLUSÃO'] && pessoa['DATA CONCLUSÃO'].toString().trim() !== ''
          
          // Verifica cada campo na ordem especificada
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
          
          if (errosCampos.length > 0) {
            erros.push({
              linha: linhaReal + 1, // Linha real na planilha + 1 (regra do cliente)
              erro: errosCampos.join(', '),
              dados: pessoa
            })
          }

          // Log para debug de algumas linhas
          if (index < 3 || index >= linhasComDados.length - 3) {
            console.log(`📊 Linha ${linhaReal}: ${pessoa.ALUNO} - ${pessoa.TREINAMENTO}`)
          }
        })

        console.log(`✅ Dados processados: ${pessoas.length} registros válidos de ${linhasComDados.length} linhas com dados`)

        if (pessoas.length === 0 && erros.length === 0) {
          reject(new Error('Nenhum registro válido encontrado na planilha'))
          return
        }

        resolve({ pessoas, erros })
      } catch (error) {
        console.error('Erro ao processar arquivo Excel:', error)
        reject(new Error('Erro ao processar arquivo Excel'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'))
    }
    
    reader.readAsArrayBuffer(arquivo)
  })
}

export async function gerarHTMLCertificado(pessoa: Pessoa, template: string): Promise<string> {
  const nome = pessoa.ALUNO || ''
  const doc = pessoa.DOCUMENTO || ''
  const instrutor = pessoa.INSTRUTOR || ''
  const treinamento = pessoa.TREINAMENTO || ''
  const cargaHoraria = pessoa['CARGA HORARIA'] || ''
  const empresa = pessoa.EMPRESA || ''

  // Gera QR code com o link de verificação (em paralelo)
  const id = pessoa.ID || ''
  const urlVerificacao = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/id/${id}`
  const qrCodePromise = gerarQRCode(urlVerificacao)

  // Busca assinaturas em paralelo (instrutor e coordenador se disponível)
  const assinaturaInstrutorPromise = instrutor ? buscarAssinatura(instrutor) : Promise.resolve(null)
  const assinaturaCoordenadorPromise = buscarAssinatura('Coordenador') // Assinatura padrão do coordenador

  // Aguarda todas as operações assíncronas
  const [qrCodeDataURL, assinaturaInstrutor, assinaturaCoordenador] = await Promise.all([
    qrCodePromise,
    assinaturaInstrutorPromise,
    assinaturaCoordenadorPromise
  ])

  // Gera HTML das assinaturas
  let htmlAssinaturas = ''
  
  if (assinaturaInstrutor || assinaturaCoordenador) {
    htmlAssinaturas = `
      <div style="display: flex; justify-content: space-around; margin-top: 40px; padding: 0 20px;">
        ${assinaturaInstrutor ? `
          <div style="text-align: center;">
            <img src="data:image/png;base64,${assinaturaInstrutor.imagemBase64}" 
                 alt="Assinatura de ${assinaturaInstrutor.nome}" 
                 style="max-width: 180px; max-height: 70px; object-fit: contain;"
                 onerror="this.style.display='none';">
            <div style="margin-top: 5px; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 3px;">
              ${assinaturaInstrutor.nome}
            </div>
            <div style="font-size: 10px; color: #888;">Instrutor</div>
          </div>
        ` : ''}
        ${assinaturaCoordenador ? `
          <div style="text-align: center;">
            <img src="data:image/png;base64,${assinaturaCoordenador.imagemBase64}" 
                 alt="Assinatura de ${assinaturaCoordenador.nome}" 
                 style="max-width: 180px; max-height: 70px; object-fit: contain;"
                 onerror="this.style.display='none';">
            <div style="margin-top: 5px; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 3px;">
              ${assinaturaCoordenador.nome}
            </div>
            <div style="font-size: 10px; color: #888;">Coordenador</div>
          </div>
        ` : ''}
      </div>
    `
  }

  // Prepara o script de forma mais eficiente
  const script = `
    <script>
      document.getElementById('aluno').textContent = '${nome.replace(/'/g, "\\'")}';
      document.getElementById('documento').textContent = 'DOC: ${doc.replace(/'/g, "\\'")}';
      document.getElementById('treinamento').textContent = '${treinamento.replace(/'/g, "\\'")}';
      document.getElementById('empresa').textContent = '${empresa.replace(/'/g, "\\'")}';
      document.getElementById('cargaHoraria').textContent = '${cargaHoraria} horas';
      document.getElementById('instrutor').textContent = '${instrutor.replace(/'/g, "\\'")}';
      
      // Adiciona QR code se foi gerado com sucesso
      const qrCodeImg = document.getElementById('qr-code');
      if (qrCodeImg) {
        qrCodeImg.src = '${qrCodeDataURL}';
        qrCodeImg.style.display = 'block';
      }
      
      // Adiciona assinaturas se disponíveis
      const assinaturasContainer = document.getElementById('assinaturas-container');
      if (assinaturasContainer) {
        assinaturasContainer.innerHTML = \`${htmlAssinaturas.replace(/`/g, '\\`')}\`;
      }
    </script>
  `
  
  return template.replace('</body>', script + '</body>')
}

export function sanitizarNome(nome: string, documento?: string, pessoasProcessadas?: Map<string, number>): string {
  // Se temos controle de pessoas processadas, verifica duplicatas
  if (pessoasProcessadas) {
    const nomeOriginal = nome.trim()
    let contador = pessoasProcessadas.get(nomeOriginal) || 0
    contador++
    pessoasProcessadas.set(nomeOriginal, contador)
    
    console.log(`🔍 Processando: "${nomeOriginal}" (contador: ${contador})`)
    
    // Se é a segunda ocorrência ou mais, adiciona numeração
    if (contador > 1) {
      const nomeComNumero = `${nomeOriginal}(${contador})`
      console.log(`🔢 Usando numeração: "${nomeComNumero}"`)
      return nomeComNumero
    } else {
      console.log(`✅ Primeira ocorrência: "${nomeOriginal}"`)
      return nomeOriginal
    }
  }
  
  // Se não há controle de duplicatas, retorna o nome original
  return nome.trim()
}

// Cache para QR codes já gerados
const qrCodeCache = new Map<string, string>()

export async function gerarQRCode(url: string): Promise<string> {
  // Verifica se já existe no cache
  if (qrCodeCache.has(url)) {
    return qrCodeCache.get(url)!
  }

  try {
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      width: 120,
      margin: 2,
      color: {
        dark: '#0B1947',
        light: '#FFFFFF'
      }
    })
    
    // Adiciona ao cache
    qrCodeCache.set(url, qrCodeDataURL)
    return qrCodeDataURL
  } catch (error) {
    console.error('Erro ao gerar QR code:', error)
    return ''
  }
}

export function prepararDadosCertificado(pessoa: Pessoa): CertificadoData {
  return {
    id: pessoa.ID || '',
    nome: pessoa.ALUNO || '',
    documento: pessoa.DOCUMENTO || '',
    treinamento: pessoa.TREINAMENTO || '',
    empresa: pessoa.EMPRESA || '',
    cargaHoraria: pessoa['CARGA HORARIA'] || '',
    instrutor: pessoa.INSTRUTOR || '',
    dataConclusao: formatarDataPorExtenso(pessoa['DATA CONCLUSÃO']),
    dataEmissao: formatarDataPorExtenso(pessoa['DATA EMISSÃO']),
    certificado: 'CERT. N. MERGEFIELD CERT ISP/25/MAR/AR/353'
  }
} 