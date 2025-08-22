"use client"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { doc, getDoc, collection, query, where, getDocs, getFirestore } from "firebase/firestore"
import { firebaseApp } from "@/lib/firebase"
import { User, Building, Calendar, Clock, Award, ArrowLeft, Edit, Download } from "lucide-react"
import ProtectedRoute from "@/components/protected-route"

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

interface Aluno {
  nome: string
  documento: string
  certificados: Certificado[]
}

export default function PerfilAluno() {
  const params = useParams<{ id: string; nome: string }>()
  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingCertificates, setDownloadingCertificates] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    async function fetchAluno() {
      try {
        setLoading(true)
        const db = getFirestore(firebaseApp)
        // Busca o aluno pelo id na coleção 'alunos'
        const alunoRef = doc(db, "alunos", params.id)
        const alunoSnap = await getDoc(alunoRef)
        if (!alunoSnap.exists()) {
          setError("Aluno não encontrado")
          return
        }
        const alunoData = alunoSnap.data()
        setAluno({
          nome: alunoData.nome,
          documento: alunoData.documento,
          certificados: alunoData.certificados || []
        })
      } catch (err) {
        setError("Erro ao carregar dados do aluno")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAluno()
  }, [params.id, params.nome])

  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando dados do aluno...</span>
        </div>
      </div>
    </div>
  )
  
  if (error) return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-4xl mx-auto py-8 px-4 text-red-600">{error}</div>
    </div>
  )
  
  if (!aluno) return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-4xl mx-auto py-8 px-4">Aluno não encontrado.</div>
    </div>
  )

  const certificadosPorEmpresa: Record<string, Certificado[]> = {}
  aluno.certificados.forEach(cert => {
    if (!certificadosPorEmpresa[cert.empresa]) certificadosPorEmpresa[cert.empresa] = []
    certificadosPorEmpresa[cert.empresa].push(cert)
  })

  const handleDownloadCertificado = async (certificado: Certificado) => {
    // Adiciona o certificado ao conjunto de downloads em andamento
    setDownloadingCertificates(prev => new Set(prev).add(certificado.id))
    
    try {
      console.log('🔄 Iniciando download do certificado:', certificado.id)
      const response = await fetch(`/api/certificados/download/${certificado.id}`);
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Erro na API:', errorData)
        alert(`Erro ao baixar certificado: ${errorData.error || 'Erro desconhecido'}`)
        return
      }
      
      const blob = await response.blob();
      console.log('✅ Blob recebido, tamanho:', blob.size, 'bytes')
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado_${certificado.treinamento.toLowerCase().replace(/\s/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      console.log('✅ Download concluído com sucesso')
    } catch (error) {
      console.error("❌ Erro ao baixar certificado:", error);
      alert("Erro ao baixar certificado.");
    } finally {
      // Remove o certificado do conjunto de downloads em andamento
      setDownloadingCertificates(prev => {
        const newSet = new Set(prev)
        newSet.delete(certificado.id)
        return newSet
      })
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      {/* Navbar fixa no topo */}
      <nav className="fixed top-0 left-0 w-full z-50 shadow border-b border-blue-900" style={{height: 60, backgroundColor: '#06459a'}}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <img src="/OwlTechLogo.png" alt="Logo OwlTech" className="w-8 h-8 object-contain bg-white rounded-lg" style={{ padding: 2 }} />
            <span className="font-bold text-white text-lg">Owl Tech</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              className="text-white hover:text-blue-200 font-medium transition"
              onClick={() => router.push('/dashboard')}
            >
              Dashboard
            </button>
            <button
              className="text-white hover:text-blue-200 font-medium transition border-b-2 border-white"
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
            onClick={() => router.push('/alunos')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para lista de alunos
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <User className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Perfil do Aluno</h1>
          </div>
        </div>

        {/* Informações do aluno */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-blue-900 text-xl mb-2">{aluno.nome}</h3>
                <div className="text-gray-600">Documento: {aluno.documento}</div>
              </div>
              <div className="flex items-center gap-4">
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificados por empresa */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="h-6 w-6 text-blue-600" />
            Certificados por Empresa
          </h2>
          
          {Object.entries(certificadosPorEmpresa).map(([empresa, certificados]) => (
            <Card key={empresa} className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Building className="h-5 w-5" />
                  {empresa}
                  <span className="text-sm text-gray-500 font-normal">
                    ({certificados.length} certificado{certificados.length !== 1 ? 's' : ''})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {certificados.map((cert) => (
                    <Card key={cert.id} className="border-blue-200 hover:border-blue-300 transition">
                      <CardContent className="p-4">
                        <div className="mb-3">
                          <h4 className="font-semibold text-blue-900 text-lg mb-1">{cert.treinamento}</h4>
                          <div className="text-sm text-gray-600">Instrutor: {cert.instrutor}</div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Carga Horária: {cert.cargaHoraria} horas</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Conclusão: {cert.dataConclusao}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Emissão: {cert.dataEmissao}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            ID: {cert.id}
                          </div>
                        </div>
                        
                        {/* Botões de ação */}
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => router.push(`/alunos/editar/${cert.id}`)}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDownloadCertificado(cert)}
                            disabled={downloadingCertificates.has(cert.id)}
                            className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition ${
                              downloadingCertificates.has(cert.id)
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {downloadingCertificates.has(cert.id) ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                Baixando...
                              </>
                            ) : (
                              <>
                                <Download className="h-3 w-3" />
                                Download
                              </>
                            )}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
    </ProtectedRoute>
  )
} 