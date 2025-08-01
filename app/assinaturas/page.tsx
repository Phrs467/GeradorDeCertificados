"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { collection, getDocs, addDoc, deleteDoc, doc, getFirestore } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { firebaseApp } from "@/lib/firebase"
import { Search, FileText, Upload, Trash2, Plus, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

interface Assinatura {
  id: string
  nome: string
  urlImagem: string
  dataCriacao: Date
}

export default function Assinaturas() {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [filtroNome, setFiltroNome] = useState("")
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [nomeAssinatura, setNomeAssinatura] = useState("")
  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchAssinaturas()
  }, [])

  async function fetchAssinaturas() {
    setLoading(true)
    try {
      const db = getFirestore(firebaseApp)
      const assinaturasRef = collection(db, "assinaturas")
      const snapshot = await getDocs(assinaturasRef)
      const assinaturasData: Assinatura[] = []
      
      snapshot.forEach(doc => {
        const data = doc.data()
        assinaturasData.push({
          id: doc.id,
          nome: data.nome,
          urlImagem: data.urlImagem,
          dataCriacao: data.dataCriacao?.toDate() || new Date()
        })
      })
      
      setAssinaturas(assinaturasData.sort((a, b) => b.dataCriacao.getTime() - a.dataCriacao.getTime()))
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error)
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar assinaturas' })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar se é uma imagem PNG
      if (!file.type.includes('image/')) {
        setMensagem({ tipo: 'erro', texto: 'Por favor, selecione apenas arquivos de imagem' })
        return
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setMensagem({ tipo: 'erro', texto: 'A imagem deve ter menos de 5MB' })
        return
      }

      setArquivoImagem(file)
      
      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setMensagem(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nomeAssinatura.trim() || !arquivoImagem) {
      setMensagem({ tipo: 'erro', texto: 'Por favor, preencha todos os campos' })
      return
    }

    setUploading(true)
    setMensagem(null)

    try {
      const storage = getStorage(firebaseApp)
      const db = getFirestore(firebaseApp)
      
      // Upload da imagem para o Firebase Storage
      const nomeArquivo = `assinaturas/${Date.now()}_${arquivoImagem.name}`
      const storageRef = ref(storage, nomeArquivo)
      await uploadBytes(storageRef, arquivoImagem)
      
      // Obter URL de download
      const downloadURL = await getDownloadURL(storageRef)
      
      // Salvar dados no Firestore
      const assinaturaData = {
        nome: nomeAssinatura.trim(),
        urlImagem: downloadURL,
        dataCriacao: new Date()
      }
      
      await addDoc(collection(db, "assinaturas"), assinaturaData)
      
      // Limpar formulário
      setNomeAssinatura("")
      setArquivoImagem(null)
      setPreviewUrl(null)
      
      // Recarregar lista
      await fetchAssinaturas()
      
      setMensagem({ tipo: 'sucesso', texto: 'Assinatura cadastrada com sucesso!' })
    } catch (error) {
      console.error('Erro ao cadastrar assinatura:', error)
      setMensagem({ tipo: 'erro', texto: 'Erro ao cadastrar assinatura' })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (assinatura: Assinatura) => {
    if (!confirm(`Tem certeza que deseja excluir a assinatura "${assinatura.nome}"?`)) {
      return
    }

    try {
      const db = getFirestore(firebaseApp)
      const storage = getStorage(firebaseApp)
      
      // Deletar do Firestore
      await deleteDoc(doc(db, "assinaturas", assinatura.id))
      
      // Deletar arquivo do Storage
      const storageRef = ref(storage, assinatura.urlImagem)
      await deleteObject(storageRef)
      
      // Recarregar lista
      await fetchAssinaturas()
      
      setMensagem({ tipo: 'sucesso', texto: 'Assinatura excluída com sucesso!' })
    } catch (error) {
      console.error('Erro ao excluir assinatura:', error)
      setMensagem({ tipo: 'erro', texto: 'Erro ao excluir assinatura' })
    }
  }

  const assinaturasFiltradas = assinaturas.filter(
    (a) => a.nome.toLowerCase().includes(filtroNome.toLowerCase())
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
              onClick={() => router.push('/cadastrar-usuario')}
            >
              Usuários
            </button>
            <button
              className="text-white hover:text-blue-200 font-medium transition border-b-2 border-white"
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
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Assinaturas</h1>
          </div>
          <p className="text-gray-600">Cadastre e gerencie assinaturas para uso nos certificados</p>
        </div>

        {/* Mensagem de feedback */}
        {mensagem && (
          <Alert className={`mb-6 ${mensagem.tipo === 'sucesso' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            {mensagem.tipo === 'sucesso' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={mensagem.tipo === 'sucesso' ? 'text-green-800' : 'text-red-800'}>
              {mensagem.texto}
            </AlertDescription>
          </Alert>
        )}

        {/* Card de cadastro */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Plus className="h-5 w-5" />
              Cadastrar Nova Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Campo Nome */}
                <div>
                  <Label htmlFor="nome-assinatura" className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    Nome Completo
                  </Label>
                  <Input
                    id="nome-assinatura"
                    placeholder="Digite o nome completo..."
                    value={nomeAssinatura}
                    onChange={(e) => setNomeAssinatura(e.target.value)}
                    className="h-10"
                    required
                  />
                </div>

                {/* Campo Upload de Imagem */}
                <div>
                  <Label htmlFor="imagem-assinatura" className="flex items-center gap-2 mb-2">
                    <Upload className="h-4 w-4" />
                    Imagem da Assinatura (PNG)
                  </Label>
                  <Input
                    id="imagem-assinatura"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="h-10"
                    required
                  />
                </div>
              </div>

              {/* Preview da imagem */}
              {previewUrl && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Preview da Imagem:
                  </Label>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <img 
                      src={previewUrl} 
                      alt="Preview da assinatura" 
                      className="max-w-xs max-h-32 object-contain"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={uploading || !nomeAssinatura.trim() || !arquivoImagem}
                className="w-full md:w-auto"
                style={{
                  backgroundColor: uploading || !nomeAssinatura.trim() || !arquivoImagem ? "#cccccc" : "#06459a",
                  color: "#ffffff",
                }}
              >
                {uploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Assinatura
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Card de busca */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Search className="h-5 w-5" />
              Buscar Assinaturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="filtro-nome" className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  Nome da Assinatura
                </Label>
                <Input
                  id="filtro-nome"
                  placeholder="Buscar por nome..."
                  value={filtroNome}
                  onChange={(e) => setFiltroNome(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{assinaturasFiltradas.length} assinatura{assinaturasFiltradas.length !== 1 ? 's' : ''} encontrada{assinaturasFiltradas.length !== 1 ? 's' : ''}</span>
                </div>
                {filtroNome && (
                  <div className="flex items-center gap-1">
                    <Search className="h-4 w-4" />
                    <span>Filtro ativo</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de assinaturas */}
        {loading ? (
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Carregando assinaturas...</span>
              </div>
            </CardContent>
          </Card>
        ) : assinaturasFiltradas.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filtroNome ? 'Nenhuma assinatura encontrada' : 'Nenhuma assinatura cadastrada'}
              </h3>
              <p className="text-gray-600">
                {filtroNome 
                  ? 'Não foram encontradas assinaturas com o filtro aplicado. Tente ajustar o critério de busca.'
                  : 'Ainda não há assinaturas cadastradas no sistema. Use o formulário acima para cadastrar a primeira assinatura.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assinaturasFiltradas.map(assinatura => (
              <Card 
                key={assinatura.id} 
                className="shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-blue-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-blue-900 mb-1 truncate">
                        {assinatura.nome}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span>Cadastrada em {assinatura.dataCriacao.toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview da assinatura */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <img 
                      src={assinatura.urlImagem} 
                      alt={`Assinatura de ${assinatura.nome}`}
                      className="max-w-full max-h-20 object-contain mx-auto"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="text-xs text-blue-600 font-medium">
                      ID: {assinatura.id}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(assinatura)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Excluir
                    </Button>
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