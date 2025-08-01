"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { collection, getDocs, getFirestore } from "firebase/firestore"
import { firebaseApp } from "@/lib/firebase"
import { FileText, Calendar, Download, ArrowLeft, Filter } from "lucide-react"

interface Certificado {
  id: string
  cargaHoraria: string | number
  dataConclusao: string
  dataEmissao: string
  documento: string
  empresa: string
  instrutor: string
  nome: string
  treinamento: string
}

interface RelatorioData {
  nome: string
  documento: string
  treinamento: string
  empresa: string
  cargaHoraria: string | number
  instrutor: string
  dataConclusao: string
  dataEmissao: string
  id: string
}

export default function Relatorios() {
  const router = useRouter()
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [certificados, setCertificados] = useState<RelatorioData[]>([])
  const [loading, setLoading] = useState(false)
  const [filtrados, setFiltrados] = useState<RelatorioData[]>([])

  // Carregar todos os certificados
  useEffect(() => {
    async function fetchCertificados() {
      try {
        setLoading(true)
        const db = getFirestore(firebaseApp)
        const alunosRef = collection(db, "alunos")
        const alunosSnap = await getDocs(alunosRef)
        
        const todosCertificados: RelatorioData[] = []
        
        alunosSnap.forEach(docSnap => {
          const data = docSnap.data()
          const certificadosAluno = data.certificados || []
          
          certificadosAluno.forEach((cert: any) => {
            todosCertificados.push({
              nome: cert.nome || '',
              documento: cert.documento || '',
              treinamento: cert.treinamento || '',
              empresa: cert.empresa || '',
              cargaHoraria: cert.cargaHoraria || '',
              instrutor: cert.instrutor || '',
              dataConclusao: cert.dataConclusao || '',
              dataEmissao: cert.dataEmissao || '',
              id: cert.id || ''
            })
          })
        })
        
        console.log("📊 Total de certificados carregados:", todosCertificados.length)
        
        setCertificados(todosCertificados)
        setFiltrados(todosCertificados)
      } catch (error) {
        console.error("Erro ao carregar certificados:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCertificados()
  }, [])

  // Filtrar por data
  const filtrarPorData = () => {
    console.log("🔍 Iniciando filtro por data...")
    console.log("📅 Data Início:", dataInicio)
    console.log("📅 Data Fim:", dataFim)
    console.log("📊 Total de certificados:", certificados.length)
    
    if (!dataInicio && !dataFim) {
      console.log("❌ Nenhuma data selecionada, mostrando todos os certificados")
      setFiltrados(certificados)
      return
    }

    const filtrados = certificados.filter(cert => {
      // Verificar se a data de emissão é válida
      if (!cert.dataEmissao) {
        return false
      }
      
      // Função para converter string de data para Date
      const parseDate = (dateString: string): Date | null => {
        if (!dateString) return null
        
        try {
          // Se já é um objeto Date
          if (dateString instanceof Date) {
            return dateString
          }
          
          // Se é string, tentar diferentes formatos
          if (typeof dateString === 'string') {
            // Formato DD/MM/YYYY
            if (dateString.includes('/')) {
              const parts = dateString.split('/')
              if (parts.length === 3) {
                const [day, month, year] = parts
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
              }
            }
            
            // Formato YYYY-MM-DD
            if (dateString.includes('-') && dateString.length === 10) {
              return new Date(dateString)
            }
            
            // Formato DD-MM-YYYY
            if (dateString.includes('-') && dateString.length === 10) {
              const parts = dateString.split('-')
              if (parts.length === 3 && parts[0].length === 2) {
                const [day, month, year] = parts
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
              }
            }
            
            // Formato português: "23 de junho de 2025"
            if (dateString.includes(' de ') && dateString.includes(' de ')) {
              const parts = dateString.split(' de ')
              if (parts.length === 3) {
                const day = parseInt(parts[0])
                const monthName = parts[1].toLowerCase()
                const year = parseInt(parts[2])
                
                // Mapear nomes dos meses para números
                const monthMap: { [key: string]: number } = {
                  'janeiro': 0, 'jan': 0,
                  'fevereiro': 1, 'fev': 1,
                  'março': 2, 'mar': 2,
                  'abril': 3, 'abr': 3,
                  'maio': 4, 'mai': 4,
                  'junho': 5, 'jun': 5,
                  'julho': 6, 'jul': 6,
                  'agosto': 7, 'ago': 7,
                  'setembro': 8, 'set': 8,
                  'outubro': 9, 'out': 9,
                  'novembro': 10, 'nov': 10,
                  'dezembro': 11, 'dez': 11
                }
                
                const month = monthMap[monthName]
                if (month !== undefined && !isNaN(day) && !isNaN(year)) {
                  return new Date(year, month, day)
                }
              }
            }
            
            // Tentar parse direto
            const parsed = new Date(dateString)
            if (!isNaN(parsed.getTime())) {
              return parsed
            }
          }
          
          return null
        } catch (error) {
          return null
        }
      }
      
      // Converter data de emissão
      const dataEmissao = parseDate(cert.dataEmissao)
      if (!dataEmissao) {
        return false
      }
      
      // Converter datas de filtro
      const inicio = dataInicio ? parseDate(dataInicio) : null
      const fim = dataFim ? parseDate(dataFim) : null
      
      // Se fim foi fornecido, ajustar para o final do dia
      if (fim) {
        fim.setHours(23, 59, 59, 999)
      }

      // Aplicar filtros
      let resultado = true

      if (inicio && fim) {
        resultado = dataEmissao >= inicio && dataEmissao <= fim
      } else if (inicio) {
        resultado = dataEmissao >= inicio
      } else if (fim) {
        resultado = dataEmissao <= fim
      }
      
      return resultado
    })

    console.log("📊 Total de certificados filtrados:", filtrados.length)
    setFiltrados(filtrados)
  }

  // Gerar CSV
  const gerarCSV = () => {
    if (filtrados.length === 0) {
      alert("Nenhum certificado encontrado para o período selecionado.")
      return
    }

    const headers = [
      "Nome",
      "Documento", 
      "Treinamento",
      "Empresa",
      "Carga Horária",
      "Instrutor",
      "Data Conclusão",
      "Data Emissão",
      "ID"
    ]

    const csvContent = [
      headers.join(","),
      ...filtrados.map(cert => [
        `"${cert.nome}"`,
        `"${cert.documento}"`,
        `"${cert.treinamento}"`,
        `"${cert.empresa}"`,
        `"${cert.cargaHoraria}"`,
        `"${cert.instrutor}"`,
        `"${cert.dataConclusao}"`,
        `"${cert.dataEmissao}"`,
        `"${cert.id}"`
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `relatorio_certificados_${dataInicio || 'inicio'}_${dataFim || 'fim'}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Limpar filtros
  const limparFiltros = () => {
    setDataInicio("")
    setDataFim("")
    setFiltrados(certificados)
  }

  // Função para formatar data para exibição
  const formatarData = (dataString: string) => {
    if (!dataString) return '-'
    
    try {
      let data: Date
      
      // Tentar diferentes formatos de data
      if (dataString.includes('/')) {
        // Formato DD/MM/YYYY
        const [day, month, year] = dataString.split('/')
        data = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      } else if (dataString.includes('-')) {
        // Formato YYYY-MM-DD ou DD-MM-YYYY
        const parts = dataString.split('-')
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          data = new Date(dataString)
        } else {
          // DD-MM-YYYY
          const [day, month, year] = parts
          data = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        }
      } else if (dataString.includes(' de ') && dataString.includes(' de ')) {
        // Formato português: "23 de junho de 2025"
        const parts = dataString.split(' de ')
        if (parts.length === 3) {
          const day = parseInt(parts[0])
          const monthName = parts[1].toLowerCase()
          const year = parseInt(parts[2])
          
          // Mapear nomes dos meses para números
          const monthMap: { [key: string]: number } = {
            'janeiro': 0, 'jan': 0,
            'fevereiro': 1, 'fev': 1,
            'março': 2, 'mar': 2,
            'abril': 3, 'abr': 3,
            'maio': 4, 'mai': 4,
            'junho': 5, 'jun': 5,
            'julho': 6, 'jul': 6,
            'agosto': 7, 'ago': 7,
            'setembro': 8, 'set': 8,
            'outubro': 9, 'out': 9,
            'novembro': 10, 'nov': 10,
            'dezembro': 11, 'dez': 11
          }
          
          const month = monthMap[monthName]
          if (month !== undefined && !isNaN(day) && !isNaN(year)) {
            data = new Date(year, month, day)
          } else {
            return dataString // Retorna original se não conseguir parsear
          }
        } else {
          return dataString // Retorna original se não conseguir parsear
        }
      } else {
        // Tentar parse direto
        data = new Date(dataString)
      }
      
      if (isNaN(data.getTime())) {
        return dataString // Retorna original se não conseguir parsear
      }
      
      return data.toLocaleDateString('pt-BR')
    } catch (error) {
      return dataString // Retorna original se houver erro
    }
  }

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
              className="text-white hover:text-blue-200 font-medium transition border-b-2 border-white"
            >
              Relatórios
            </button>
            <button
              className="text-white hover:text-blue-200 font-medium transition"
              onClick={() => router.push('/cadastrar-usuario')}
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
              onClick={() => router.push('/logout')}
            >
              Sair
            </button>
          </div>
        </div>
      </nav>
      <div style={{height: 60}} /> {/* Espaço para a navbar fixa */}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header da página */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Dashboard
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          </div>
          <p className="text-gray-600">Gere relatórios de certificados por período de emissão</p>
        </div>

        {/* Card de filtros */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Filter className="h-5 w-5" />
              Filtros do Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Data de Início */}
              <div>
                <Label htmlFor="data-inicio" className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  Data de Início
                </Label>
                <Input
                  id="data-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Data de Fim */}
              <div>
                <Label htmlFor="data-fim" className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  Data de Fim
                </Label>
                <Input
                  id="data-fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Botões */}
              <div className="flex items-end gap-2">
                <Button 
                  onClick={filtrarPorData}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
                <Button 
                  onClick={limparFiltros}
                  variant="outline"
                  className="flex-1"
                >
                  Limpar
                </Button>
              </div>
            </div>

            {/* Resumo */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{filtrados.length}</span> certificado{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}
                  {dataInicio || dataFim ? (
                    <span className="ml-2">
                      no período: {dataInicio || 'início'} até {dataFim || 'fim'}
                    </span>
                  ) : (
                    <span className="ml-2">(todos os certificados)</span>
                  )}
                </div>
                {filtrados.length > 0 && (
                  <Button 
                    onClick={gerarCSV}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de certificados */}
        {loading ? (
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Carregando certificados...</span>
              </div>
            </CardContent>
          </Card>
        ) : filtrados.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum certificado encontrado
              </h3>
              <p className="text-gray-600">
                {dataInicio || dataFim 
                  ? 'Não foram encontrados certificados no período selecionado. Tente ajustar as datas.'
                  : 'Ainda não há certificados cadastrados no sistema.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <FileText className="h-5 w-5" />
                Certificados do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Nome</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Documento</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Treinamento</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Empresa</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Carga Horária</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Instrutor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Data Conclusão</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Data Emissão</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((cert, index) => (
                      <tr key={cert.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{cert.nome}</td>
                        <td className="py-3 px-4 text-gray-600">{cert.documento}</td>
                        <td className="py-3 px-4 text-gray-900">{cert.treinamento}</td>
                        <td className="py-3 px-4 text-gray-600">{cert.empresa}</td>
                        <td className="py-3 px-4 text-gray-600">{cert.cargaHoraria} horas</td>
                        <td className="py-3 px-4 text-gray-600">{cert.instrutor}</td>
                        <td className="py-3 px-4 text-gray-600">{formatarData(cert.dataConclusao)}</td>
                        <td className="py-3 px-4 text-gray-600">{formatarData(cert.dataEmissao)}</td>
                        <td className="py-3 px-4 text-gray-400 text-xs">{cert.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
} 