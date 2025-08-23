"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, addDoc, getFirestore } from "firebase/firestore"
import { firebaseApp } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, UserPlus, CheckCircle } from "lucide-react"
import ProtectedRoute from "@/components/protected-route"
import Navbar from '@/components/navbar'

interface Usuario {
  id: string
  nome: string
  email: string
  funcao: string
  chave_de_acesso: string
  primeiro_login: boolean
  senha?: string
}

export default function CadastrarUsuarioPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  
  // Form data
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [funcao, setFuncao] = useState("")

  useEffect(() => {
    console.log("🚀 Iniciando página de cadastro de usuários...")
    
    try {
      // Verificar se estamos no cliente
      if (typeof window === 'undefined') {
        console.log("⚠️ Executando no servidor (SSR)")
        return
      }

      console.log("✅ Executando no cliente")
      
      // Obter dados do usuário da sessão para exibir na navbar
      console.log("🔍 Verificando sessão do usuário...")
      const sessionUser = sessionStorage.getItem('usuario')
      if (sessionUser) {
        try {
          const usuarioData = JSON.parse(sessionUser) as Usuario
          console.log("✅ Usuário encontrado na sessão:", usuarioData.nome)
          setUsuario(usuarioData)
        } catch (parseError) {
          console.error("❌ Erro ao parsear dados da sessão:", parseError)
        }
      } else {
        console.log("⚠️ Nenhum usuário na sessão")
      }
      
      console.log("✅ Página inicializada com sucesso")
    } catch (error) {
      console.error("❌ Erro ao inicializar página:", error)
    } finally {
      setLoading(false)
      console.log("🏁 Loading finalizado")
    }
  }, [])

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

      console.log("📝 Criando usuário:", { nome, email, funcao })

      // Verificar se o Firebase está disponível
      if (!firebaseApp) {
        throw new Error("Firebase não está disponível")
      }

      // Verificar se email já existe
      const db = getFirestore(firebaseApp as any)
      const usuariosRef = collection(db, "usuarios")
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

    } catch (error) {
      console.error("❌ Erro ao criar usuário:", error)
      if (error instanceof Error) {
        setError(`Erro: ${error.message}`)
      } else {
        setError("Erro interno do servidor")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      console.log("🚪 Fazendo logout...")
      sessionStorage.removeItem('usuario')
      router.push('/')
    } catch (error) {
      console.error("❌ Erro ao fazer logout:", error)
    }
  }

  // Loading state
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

  return (
    <ProtectedRoute requiredRole="Administrador">
      <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
        {/* Usando o componente Navbar */}
        <Navbar currentPage="usuarios" usuario={usuario || undefined} onLogout={handleLogout} />
        <div style={{height: 60}} /> {/* Espaço para a navbar fixa */}

        {/* Main Content */}
        <main className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header da página */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <UserPlus className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Cadastrar Usuário</h1>
            </div>
            <p className="text-gray-600">Crie novos usuários no sistema com diferentes níveis de acesso</p>
          </div>

          {success ? (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-green-800">✅ Usuário Criado com Sucesso!</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-green-700 mb-4">
                  O usuário foi cadastrado no sistema e receberá um email para definir sua senha no primeiro acesso.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => setSuccess(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Cadastrar Outro Usuário
                  </Button>
                  <Button
                    onClick={() => router.push('/dashboard')}
                    style={{ backgroundColor: "#06459a", color: "#ffffff" }}
                    className="w-full"
                  >
                    Voltar ao Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2" style={{ color: "#06459a" }}>
                  <UserPlus className="h-5 w-5" />
                  <span>Cadastrar Novo Usuário</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                      placeholder="Digite o nome completo"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Digite o email"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="funcao">Função</Label>
                    <Select value={funcao} onValueChange={setFuncao} required>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Administrador">Administrador</SelectItem>
                        <SelectItem value="Usuário">Usuário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-10"
                    style={{ backgroundColor: "#06459a", color: "#ffffff" }}
                  >
                    {submitting ? (
                      <>
                        <UserPlus className="h-4 w-4 mr-2 animate-spin" />
                        Criando Usuário...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Criar Usuário
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
} 