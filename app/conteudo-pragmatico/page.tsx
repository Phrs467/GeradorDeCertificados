"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, CheckCircle, XCircle, Plus, Search, Edit, Trash2, ArrowLeft } from "lucide-react"
import { firestore } from '@/lib/firebase'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy } from 'firebase/firestore'
import Navbar from '@/components/navbar'

interface Usuario {
  id: string
  nome: string
  email: string
  chave_de_acesso: string
  funcao?: string
}

interface ConteudoPragmatico {
  id: string
  empresa: string
  treinamento: string
  conteudo: string
  dataCriacao: Date
  dataAtualizacao: Date
}

export default function ConteudoPragmaticoPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  // Estados do formulário
  const [empresa, setEmpresa] = useState('')
  const [treinamento, setTreinamento] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [editando, setEditando] = useState<string | null>(null)

  // Estados da lista
  const [conteudos, setConteudos] = useState<ConteudoPragmatico[]>([])
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null)

  // Estados de busca
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [filtroTreinamento, setFiltroTreinamento] = useState('')

  useEffect(() => {
    // Verificar autenticação
    const sessionUser = sessionStorage.getItem('usuario')
    if (sessionUser) {
      try {
        const usuarioData = JSON.parse(sessionUser) as Usuario
        setUsuario(usuarioData)
        setAuthChecked(true)
      } catch (error) {
        console.error('❌ Erro ao parsear dados da sessão:', error)
        sessionStorage.removeItem('usuario')
        router.push('/')
        return
      }
    } else {
      router.push('/')
      return
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    if (usuario) {
      carregarConteudos()
    }
  }, [usuario])

  const carregarConteudos = async () => {
    setCarregando(true)
    try {
      const conteudosRef = collection(firestore, "conteudos_pragmaticos")
      const q = query(conteudosRef, orderBy("dataCriacao", "desc"))
      const snapshot = await getDocs(q)
      
      const conteudosData: ConteudoPragmatico[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        conteudosData.push({
          id: doc.id,
          empresa: data.empresa || '',
          treinamento: data.treinamento || '',
          conteudo: data.conteudo || '',
          dataCriacao: data.dataCriacao?.toDate() || new Date(),
          dataAtualizacao: data.dataAtualizacao?.toDate() || new Date()
        })
      })
      
      setConteudos(conteudosData)
    } catch (error) {
      console.error('❌ Erro ao carregar conteúdos:', error)
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar conteúdos' })
    } finally {
      setCarregando(false)
    }
  }

  const salvarConteudo = async () => {
    if (!empresa.trim() || !treinamento.trim() || !conteudo.trim()) {
      setMensagem({ tipo: 'erro', texto: 'Todos os campos são obrigatórios' })
      return
    }

    setSalvando(true)
    try {
      const dadosConteudo = {
        empresa: empresa.trim(),
        treinamento: treinamento.trim(),
        conteudo: conteudo.trim(),
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      }

      if (editando) {
        // Atualizar conteúdo existente
        const docRef = doc(firestore, "conteudos_pragmaticos", editando)
        await updateDoc(docRef, {
          ...dadosConteudo,
          dataAtualizacao: new Date()
        })
        setMensagem({ tipo: 'sucesso', texto: 'Conteúdo atualizado com sucesso!' })
      } else {
        // Criar novo conteúdo
        await addDoc(collection(firestore, "conteudos_pragmaticos"), dadosConteudo)
        setMensagem({ tipo: 'sucesso', texto: 'Conteúdo criado com sucesso!' })
      }

      // Limpar formulário
      setEmpresa('')
      setTreinamento('')
      setConteudo('')
      setEditando(null)
      
      // Recarregar lista
      await carregarConteudos()
    } catch (error) {
      console.error('❌ Erro ao salvar conteúdo:', error)
      setMensagem({ tipo: 'erro', texto: 'Erro ao salvar conteúdo' })
    } finally {
      setSalvando(false)
    }
  }

  const editarConteudo = (conteudo: ConteudoPragmatico) => {
    setEmpresa(conteudo.empresa)
    setTreinamento(conteudo.treinamento)
    setConteudo(conteudo.conteudo)
    setEditando(conteudo.id)
  }

  const cancelarEdicao = () => {
    setEmpresa('')
    setTreinamento('')
    setConteudo('')
    setEditando(null)
  }

  const excluirConteudo = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este conteúdo?')) return

    try {
      await deleteDoc(doc(firestore, "conteudos_pragmaticos", id))
      setMensagem({ tipo: 'sucesso', texto: 'Conteúdo excluído com sucesso!' })
      await carregarConteudos()
    } catch (error) {
      console.error('❌ Erro ao excluir conteúdo:', error)
      setMensagem({ tipo: 'erro', texto: 'Erro ao excluir conteúdo' })
    }
  }

  const filtrarConteudos = () => {
    return conteudos.filter(cont => {
      const matchEmpresa = !filtroEmpresa || cont.empresa.toLowerCase().includes(filtroEmpresa.toLowerCase())
      const matchTreinamento = !filtroTreinamento || cont.treinamento.toLowerCase().includes(filtroTreinamento.toLowerCase())
      return matchEmpresa && matchTreinamento
    })
  }

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('usuario')
      router.push('/')
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#06459a" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  const conteudosFiltrados = filtrarConteudos()

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      {/* Usando o componente Navbar */}
      <Navbar currentPage="conteudo-pragmatico" usuario={usuario} onLogout={handleLogout} />
      <div style={{height: 60}} />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Conteúdo Pragmático</h1>
              <p className="text-gray-600">Gerencie o conteúdo específico por empresa e treinamento</p>
            </div>
          </div>
        </div>

        {/* Mensagens */}
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: "#06459a" }}>
                <Plus className="h-5 w-5" />
                <span>{editando ? 'Editar' : 'Novo'} Conteúdo</span>
              </CardTitle>
              <CardDescription>
                {editando ? 'Atualize as informações do conteúdo' : 'Crie um novo conteúdo pragmático'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa *</Label>
                <Input
                  id="empresa"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Nome da empresa"
                  disabled={salvando}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="treinamento">Treinamento *</Label>
                <Input
                  id="treinamento"
                  value={treinamento}
                  onChange={(e) => setTreinamento(e.target.value)}
                  placeholder="Nome do treinamento"
                  disabled={salvando}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="conteudo">Conteúdo *</Label>
                <Textarea
                  id="conteudo"
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  placeholder="Digite o conteúdo pragmático..."
                  rows={6}
                  disabled={salvando}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={salvarConteudo}
                  disabled={salvando || !empresa.trim() || !treinamento.trim() || !conteudo.trim()}
                  className="flex-1"
                  style={{ backgroundColor: "#06459a" }}
                >
                  {salvando ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    editando ? 'Atualizar' : 'Salvar'
                  )}
                </Button>
                
                {editando && (
                  <Button
                    variant="outline"
                    onClick={cancelarEdicao}
                    disabled={salvando}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Conteúdos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: "#06459a" }}>
                <span>Conteúdos Cadastrados</span>
                <Badge variant="secondary">{conteudosFiltrados.length}</Badge>
              </CardTitle>
              <CardDescription>
                Gerencie os conteúdos existentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Filtrar por empresa..."
                  value={filtroEmpresa}
                  onChange={(e) => setFiltroEmpresa(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Filtrar por treinamento..."
                  value={filtroTreinamento}
                  onChange={(e) => setFiltroTreinamento(e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* Lista */}
              {carregando ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando conteúdos...</p>
                </div>
              ) : conteudosFiltrados.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Nenhum conteúdo encontrado</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {conteudosFiltrados.map((cont) => (
                    <div key={cont.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {cont.empresa}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {cont.treinamento}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {cont.conteudo}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Criado em: {cont.dataCriacao.toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editarConteudo(cont)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => excluirConteudo(cont.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
