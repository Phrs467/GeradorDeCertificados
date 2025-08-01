"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { collection, getDocs, getFirestore } from "firebase/firestore"
import { firebaseApp } from "@/lib/firebase"
import { Search, Users, Building, User, Hash } from "lucide-react"

interface Aluno {
  id: string
  nome: string
  empresa: string
  documento: string
  certificados: any[]
}

export default function ListaAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [empresas, setEmpresas] = useState<string[]>([])
  const [filtroNome, setFiltroNome] = useState("")
  const [filtroEmpresa, setFiltroEmpresa] = useState("todas")
  const [filtroId, setFiltroId] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchAlunos() {
      setLoading(true)
      const db = getFirestore(firebaseApp)
      const alunosRef = collection(db, "alunos")
      const snapshot = await getDocs(alunosRef)
      const alunosArr: Aluno[] = []
      const empresasSet = new Set<string>()
      snapshot.forEach(doc => {
        const data = doc.data()
        alunosArr.push({
          id: doc.id,
          nome: data.nome,
          empresa: data.empresa,
          documento: data.documento,
          certificados: data.certificados || []
        })
        if (data.empresa) empresasSet.add(data.empresa)
      })
      setAlunos(alunosArr)
      setEmpresas(Array.from(empresasSet).sort())
      setLoading(false)
    }
    fetchAlunos()
  }, [])

  const alunosFiltrados = alunos.filter(
    (a) => {
      const matchNome = a.nome.toLowerCase().includes(filtroNome.toLowerCase())
      const matchEmpresa = filtroEmpresa === "todas" || a.empresa === filtroEmpresa
      
      // Busca por ID do certificado nos certificados do aluno
      const matchId = !filtroId || 
        a.documento.toLowerCase().includes(filtroId.toLowerCase()) ||
        a.id.toLowerCase().includes(filtroId.toLowerCase()) ||
        a.certificados.some((cert: any) => 
          cert.id && cert.id.toLowerCase().includes(filtroId.toLowerCase())
        )
      
      return matchNome && matchEmpresa && matchId
    }
  )

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
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Alunos</h1>
          </div>
          <p className="text-gray-600">Busque e visualize os alunos cadastrados no sistema</p>
        </div>

        {/* Card de busca */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Search className="h-5 w-5" />
              Buscar Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Filtro por Nome */}
              <div>
                <Label htmlFor="filtro-nome" className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  Nome do Aluno
                </Label>
                <Input
                  id="filtro-nome"
                  placeholder="Buscar por nome..."
                  value={filtroNome}
                  onChange={(e) => setFiltroNome(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Filtro por Empresa */}
              <div>
                <Label htmlFor="filtro-empresa" className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4" />
                  Empresa
                </Label>
                <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as empresas</SelectItem>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa} value={empresa}>
                        {empresa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por ID */}
              <div>
                <Label htmlFor="filtro-id" className="flex items-center gap-2 mb-2">
                  <Hash className="h-4 w-4" />
                  ID do Certificado
                </Label>
                <Input
                  id="filtro-id"
                  placeholder="Buscar por ID do certificado..."
                  value={filtroId}
                  onChange={(e) => setFiltroId(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{alunosFiltrados.length} aluno{alunosFiltrados.length !== 1 ? 's' : ''} encontrado{alunosFiltrados.length !== 1 ? 's' : ''}</span>
              </div>
              {(filtroNome || filtroEmpresa !== "todas" || filtroId) && (
                <div className="flex items-center gap-1">
                  <Search className="h-4 w-4" />
                  <span>Filtros ativos</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de alunos */}
        {loading ? (
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Carregando alunos...</span>
              </div>
            </CardContent>
          </Card>
        ) : alunosFiltrados.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {(filtroNome || filtroEmpresa !== "todas" || filtroId) ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
              </h3>
              <p className="text-gray-600">
                {(filtroNome || filtroEmpresa !== "todas" || filtroId) 
                  ? 'Não foram encontrados alunos com os filtros aplicados. Tente ajustar os critérios de busca.'
                  : 'Ainda não há alunos cadastrados no sistema.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {alunosFiltrados.map(aluno => (
              <Card 
                key={aluno.id} 
                className="shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-blue-200"
                onClick={() => router.push(`/alunos/${aluno.id}/${encodeURIComponent(aluno.nome)}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-blue-900 mb-1 truncate">
                        {aluno.nome}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building className="h-4 w-4" />
                        <span className="truncate">{aluno.empresa}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      <span>Certificados: {aluno.certificados.length}</span>
                    </div>
                    {aluno.certificados.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">IDs: {aluno.certificados.slice(0, 2).map((cert: any) => cert.id).join(', ')}{aluno.certificados.length > 2 ? '...' : ''}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="text-xs text-blue-600 font-medium">
                      Clique para ver detalhes
                    </div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
} 