"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { firebaseAuth, firestore } from "@/lib/firebase"
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, ArrowLeft, UserPlus, CheckCircle, Users, Trash2, Edit, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Navbar from '@/components/navbar'

interface Usuario {
  id: string
  nome: string
  email: string
  funcao: string
  chave_de_acesso: string
  primeiro_login: boolean
  senha?: string
  data_criacao?: string
}

export default function CadastrarUsuarioPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  
  // Form data
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [funcao, setFuncao] = useState("")
  
  // Lista de usuários
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  // Estados para edição e visualização
  const [editandoUsuario, setEditandoUsuario] = useState<Usuario | null>(null)
  const [visualizandoUsuario, setVisualizandoUsuario] = useState<Usuario | null>(null)
  const [editandoNome, setEditandoNome] = useState("")
  const [editandoEmail, setEditandoEmail] = useState("")
  const [editandoFuncao, setEditandoFuncao] = useState("")
  const [editandoChaveAcesso, setEditandoChaveAcesso] = useState("")

  // NOVO: Estado para controlar se é administrador
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      console.log("🔍 Cadastrar Usuário - Firebase Auth State:", user ? "Autenticado" : "Não autenticado")
      
      if (user) {
        try {
          console.log("🔍 Buscando dados do usuário no Firestore...")
          // Buscar dados do usuário no Firestore
          const usuariosRef = collection(firestore, "usuarios")
          const q = query(usuariosRef, where("email", "==", user.email?.toLowerCase()))
          const querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            const usuarioDoc = querySnapshot.docs[0]
            const usuarioData = usuarioDoc.data() as Usuario
            
            // MODIFICADO: Permite acesso para todos os usuários autenticados
            console.log("✅ Usuário autenticado:", usuarioData.nome, "Função:", usuarioData.funcao)
            setUsuario(usuarioData)
            
            // Define se é administrador
            setIsAdmin(usuarioData.funcao === "Administrador")
            
            // Carrega lista de usuários para todos
            carregarUsuarios()
          } else {
            console.error("❌ Usuário não encontrado no Firestore")
            router.push('/')
          }
        } catch (error) {
          console.error("❌ Erro ao buscar dados do usuário:", error)
          router.push('/')
        }
      } else {
        // Usuário não autenticado no Firebase Auth
        console.log("❌ Usuário não autenticado no Firebase Auth")
        
        // Verificar se há dados do usuário na sessão (login via Firestore)
        const sessionUser = sessionStorage.getItem('usuario')
        if (sessionUser) {
          try {
            const usuarioData = JSON.parse(sessionUser) as Usuario
            console.log("✅ Usuário encontrado na sessão:", usuarioData.nome, "Função:", usuarioData.funcao)
            
            // MODIFICADO: Permite acesso para todos os usuários autenticados
            setUsuario(usuarioData)
            
            // Define se é administrador
            setIsAdmin(usuarioData.funcao === "Administrador")
            
            // Carrega lista de usuários para todos
            carregarUsuarios()
          } catch (error) {
            console.error("❌ Erro ao parsear dados da sessão:", error)
            sessionStorage.removeItem('usuario')
            router.push('/')
          }
        } else {
          console.log("❌ Nenhum usuário na sessão, redirecionando para login")
          router.push('/')
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const carregarUsuarios = async () => {
    setLoadingUsuarios(true)
    try {
      const usuariosRef = collection(firestore, "usuarios")
      const querySnapshot = await getDocs(usuariosRef)
      const usuariosData: Usuario[] = []
      
      querySnapshot.forEach((doc) => {
        usuariosData.push({
          id: doc.id,
          ...doc.data()
        } as Usuario)
      })
      
      // Ordena por data de criação (mais recentes primeiro)
      usuariosData.sort((a, b) => {
        const dataA = a.data_criacao ? new Date(a.data_criacao).getTime() : 0
        const dataB = b.data_criacao ? new Date(b.data_criacao).getTime() : 0
        return dataB - dataA
      })
      
      setUsuarios(usuariosData)
      console.log(`✅ ${usuariosData.length} usuários carregados`)
    } catch (error) {
      console.error("❌ Erro ao carregar usuários:", error)
    } finally {
      setLoadingUsuarios(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      // Validar campos
      if (!nome.trim() || !email.trim() || !funcao) {
        setError("Todos os campos são obrigatórios")
        return
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError("Email inválido")
        return
      }

      // Verificar se email já existe
      const usuariosRef = collection(firestore, "usuarios")
      const q = query(usuariosRef, where("email", "==", email.toLowerCase()))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        setError("Email já cadastrado no sistema")
        return
      }

      // Criar data de expiração (1 ano a frente)
      const dataExpiracao = new Date()
      dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1)

      // Criar novo usuário
      const novoUsuario = {
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        funcao: funcao,
        chave_de_acesso: dataExpiracao.toISOString(),
        primeiro_login: true,
        senha: null, // Senha será definida no primeiro login
        data_criacao: new Date().toISOString()
      }

      await addDoc(usuariosRef, novoUsuario)

      console.log("✅ Usuário criado com sucesso!")
      setSuccess(true)
      
      // Limpar formulário
      setNome("")
      setEmail("")
      setFuncao("")
      
      // Recarrega lista de usuários
      await carregarUsuarios()

    } catch (error) {
      console.error("❌ Erro ao criar usuário:", error)
      setError("Erro interno do servidor")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletarUsuario = async (userId: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${nome}"?`)) {
      return
    }

    try {
      await deleteDoc(doc(firestore, "usuarios", userId))
      console.log(`✅ Usuário "${nome}" excluído com sucesso`)
      await carregarUsuarios() // Recarrega a lista
    } catch (error) {
      console.error("❌ Erro ao excluir usuário:", error)
      alert("Erro ao excluir usuário")
    }
  }

  const handleVoltar = () => {
    router.push('/dashboard')
  }

  const formatarData = (dataString: string) => {
    try {
      return new Date(dataString).toLocaleDateString('pt-BR')
    } catch {
      return 'Data inválida'
    }
  }

  const formatarDataExpiracao = (dataString: string) => {
    try {
      const data = new Date(dataString)
      const hoje = new Date()
      const diasRestantes = Math.ceil((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diasRestantes < 0) {
        return <Badge variant="destructive">Expirada</Badge>
      } else if (diasRestantes <= 30) {
        return <Badge variant="secondary">{diasRestantes} dias</Badge>
      } else {
        return <Badge variant="default">{formatarData(dataString)}</Badge>
      }
    } catch {
      return 'Data inválida'
    }
  }

  const handleEditarUsuario = (user: Usuario) => {
    setEditandoUsuario(user)
    setEditandoNome(user.nome)
    setEditandoEmail(user.email)
    setEditandoFuncao(user.funcao)
    setEditandoChaveAcesso(user.chave_de_acesso)
    setShowForm(true) // Mostra o formulário para edição
  }

  const handleVisualizarUsuario = (user: Usuario) => {
    setVisualizandoUsuario(user)
  }

  const handleSalvarEdicao = async () => {
    if (!editandoUsuario) return

    setSubmitting(true)
    setError("")

    try {
      // Validar campos
      if (!editandoNome.trim() || !editandoEmail.trim() || !editandoFuncao) {
        setError("Todos os campos são obrigatórios")
        return
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(editandoEmail)) {
        setError("Email inválido")
        return
      }

      // Verificar se email já existe (exceto para o usuário atual)
      if (editandoEmail.toLowerCase() !== editandoUsuario.email.toLowerCase()) {
        const usuariosRef = collection(firestore, "usuarios")
        const q = query(usuariosRef, where("email", "==", editandoEmail.toLowerCase()))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          setError("Email já cadastrado no sistema")
          return
        }
      }

      // Atualizar usuário
      const usuarioRef = doc(firestore, "usuarios", editandoUsuario.id)
      await updateDoc(usuarioRef, {
        nome: editandoNome.trim(),
        email: editandoEmail.toLowerCase().trim(),
        funcao: editandoFuncao,
        chave_de_acesso: editandoChaveAcesso,
        data_atualizacao: new Date().toISOString()
      })

      console.log("✅ Usuário atualizado com sucesso!")
      
      // Limpa estados de edição
      setEditandoUsuario(null)
      setEditandoNome("")
      setEditandoEmail("")
      setEditandoFuncao("")
      setEditandoChaveAcesso("")
      
      // Recarrega lista de usuários
      await carregarUsuarios()
      
      // Mostra mensagem de sucesso
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

    } catch (error) {
      console.error("❌ Erro ao atualizar usuário:", error)
      setError("Erro interno do servidor")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelarEdicao = () => {
    setEditandoUsuario(null)
    setEditandoNome("")
    setEditandoEmail("")
    setEditandoFuncao("")
    setEditandoChaveAcesso("")
    setShowForm(false)
  }

  const handleFecharVisualizacao = () => {
    setVisualizandoUsuario(null)
  }

  const handleRenovarChaveAcesso = async (userId: string) => {
    try {
      // Criar nova data de expiração (1 ano a frente)
      const novaDataExpiracao = new Date()
      novaDataExpiracao.setFullYear(novaDataExpiracao.getFullYear() + 1)

      const usuarioRef = doc(firestore, "usuarios", userId)
      await updateDoc(usuarioRef, {
        chave_de_acesso: novaDataExpiracao.toISOString(),
        data_atualizacao: new Date().toISOString()
      })

      console.log("✅ Chave de acesso renovada com sucesso!")
      await carregarUsuarios() // Recarrega a lista
      
      // Mostra mensagem de sucesso
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error("❌ Erro ao renovar chave de acesso:", error)
      alert("Erro ao renovar chave de acesso")
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      {/* Usando o componente Navbar */}
      <Navbar currentPage="usuarios" usuario={usuario} onLogout={handleVoltar} />
      <div style={{height: 60}} />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold" style={{ color: "#06459a" }}>Gestão de Usuários</h1>
          
          {/* MODIFICADO: Botão de novo usuário apenas para administradores */}
          {isAdmin && (
            <Button
              onClick={() => {
                setShowForm(!showForm)
                if (editandoUsuario) {
                  handleCancelarEdicao()
                }
              }}
              style={{ backgroundColor: "#06459a", color: "#ffffff" }}
            >
              {showForm ? (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Ver Lista
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </>
              )}
            </Button>
          )}
        </div>

        {/* MODIFICADO: Formulário apenas para administradores */}
        {showForm && isAdmin && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: "#06459a" }}>
                {editandoUsuario ? (
                  <>
                    <Edit className="h-5 w-5" />
                    <span>Editar Usuário: {editandoUsuario.nome}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    <span>Cadastrar Novo Usuário</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {success && (
                <Alert className="mb-4 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {editandoUsuario ? "Usuário atualizado com sucesso!" : "Usuário criado com sucesso!"}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={editandoUsuario ? (e) => { e.preventDefault(); handleSalvarEdicao(); } : handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      type="text"
                      value={editandoUsuario ? editandoNome : nome}
                      onChange={(e) => editandoUsuario ? setEditandoNome(e.target.value) : setNome(e.target.value)}
                      required
                      placeholder="Digite o nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editandoUsuario ? editandoEmail : email}
                      onChange={(e) => editandoUsuario ? setEditandoEmail(e.target.value) : setEmail(e.target.value)}
                      required
                      placeholder="Digite o email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="funcao">Função</Label>
                    <Select 
                      value={editandoUsuario ? editandoFuncao : funcao} 
                      onValueChange={editandoUsuario ? setEditandoFuncao : setFuncao} 
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Administrador">Administrador</SelectItem>
                        <SelectItem value="Usuário">Usuário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editandoUsuario && (
                    <div className="space-y-2">
                      <Label htmlFor="chaveAcesso">Chave de Acesso</Label>
                      <Input
                        id="chaveAcesso"
                        type="date"
                        value={editandoChaveAcesso ? editandoChaveAcesso.split('T')[0] : ''}
                        onChange={(e) => setEditandoChaveAcesso(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                    style={{ backgroundColor: "#06459a", color: "#ffffff" }}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editandoUsuario ? "Salvando..." : "Criando..."}
                      </>
                    ) : (
                      <>
                        {editandoUsuario ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Salvar Alterações
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Criar Usuário
                          </>
                        )}
                      </>
                    )}
                  </Button>

                  {editandoUsuario && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelarEdicao}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Modal de Visualização - disponível para todos */}
        {visualizandoUsuario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-lg">
                    {visualizandoUsuario.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{visualizandoUsuario.nome}</h3>
                  <p className="text-gray-600">{visualizandoUsuario.email}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="font-medium">Função:</span>
                  <Badge 
                    variant={visualizandoUsuario.funcao === "Administrador" ? "default" : "secondary"}
                    style={{ 
                      backgroundColor: visualizandoUsuario.funcao === "Administrador" ? "#06459a" : "#6b7280",
                      color: "#ffffff"
                    }}
                  >
                    {visualizandoUsuario.funcao}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge 
                    variant={visualizandoUsuario.primeiro_login ? "destructive" : "default"}
                    style={{ 
                      backgroundColor: visualizandoUsuario.primeiro_login ? "#dc2626" : "#059669",
                      color: "#ffffff"
                    }}
                  >
                    {visualizandoUsuario.primeiro_login ? "Primeiro Login" : "Ativo"}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Chave de Acesso:</span>
                  <span className="text-gray-600">
                    {formatarData(visualizandoUsuario.chave_de_acesso)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Data Criação:</span>
                  <span className="text-gray-600">
                    {visualizandoUsuario.data_criacao ? formatarData(visualizandoUsuario.data_criacao) : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                {/* MODIFICADO: Botões de ação apenas para administradores */}
                {isAdmin && (
                  <>
                    <Button
                      onClick={() => {
                        setVisualizandoUsuario(null)
                        handleEditarUsuario(visualizandoUsuario)
                      }}
                      style={{ backgroundColor: "#06459a", color: "#ffffff" }}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    
                    <Button
                      onClick={() => handleRenovarChaveAcesso(visualizandoUsuario.id)}
                      variant="outline"
                      className="flex-1"
                    >
                      Renovar Chave
                    </Button>
                  </>
                )}
                
                <Button
                  onClick={handleFecharVisualizacao}
                  variant="outline"
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Usuários - disponível para todos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2" style={{ color: "#06459a" }}>
              <Users className="h-5 w-5" />
              <span>Usuários do Sistema</span>
              <Badge variant="secondary">{usuarios.length} usuários</Badge>
              
              {/* MODIFICADO: Indicador de permissões */}
              {!isAdmin && (
                <Badge variant="outline" className="ml-2">
                  Modo Visualização
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsuarios ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando usuários...</p>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum usuário cadastrado ainda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Função</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Chave de Acesso</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Data Criação</th>
                      
                      {/* MODIFICADO: Coluna de ações apenas para administradores */}
                      {isAdmin && (
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">
                                {user.nome.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{user.nome}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={user.funcao === "Administrador" ? "default" : "secondary"}
                            style={{ 
                              backgroundColor: user.funcao === "Administrador" ? "#06459a" : "#6b7280",
                              color: "#ffffff"
                            }}
                          >
                            {user.funcao}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={user.primeiro_login ? "destructive" : "default"}
                            style={{ 
                              backgroundColor: user.primeiro_login ? "#dc2626" : "#059669",
                              color: "#ffffff"
                            }}
                          >
                            {user.primeiro_login ? "Primeiro Login" : "Ativo"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {formatarDataExpiracao(user.chave_de_acesso)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {user.data_criacao ? formatarData(user.data_criacao) : 'N/A'}
                        </td>
                        
                        {/* MODIFICADO: Ações apenas para administradores */}
                        {isAdmin && (
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVisualizarUsuario(user)}
                                title="Visualizar detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditarUsuario(user)}
                                title="Editar usuário"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {user.id !== usuario.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeletarUsuario(user.id, user.nome)}
                                  style={{ borderColor: "#dc2626", color: "#dc2626" }}
                                  title="Excluir usuário"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 