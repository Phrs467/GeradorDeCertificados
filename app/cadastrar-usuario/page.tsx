"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { firebaseAuth, firestore } from "@/lib/firebase"
import { collection, query, where, getDocs, addDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, ArrowLeft, UserPlus, CheckCircle } from "lucide-react"

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
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  
  // Form data
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [funcao, setFuncao] = useState("")

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
            
            // Verificar se é administrador
            if (usuarioData.funcao !== "Administrador") {
              console.error("❌ Usuário não é administrador")
              router.push('/dashboard')
              return
            }
            
            console.log("✅ Administrador autenticado:", usuarioData.nome)
            setUsuario(usuarioData)
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
            console.log("✅ Usuário encontrado na sessão:", usuarioData.nome)
            
            // Verificar se é administrador
            if (usuarioData.funcao !== "Administrador") {
              console.error("❌ Usuário na sessão não é administrador")
              router.push('/dashboard')
              return
            }
            
            console.log("✅ Administrador na sessão:", usuarioData.nome)
            setUsuario(usuarioData)
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

    } catch (error) {
      console.error("❌ Erro ao criar usuário:", error)
      setError("Erro interno do servidor")
    } finally {
      setSubmitting(false)
    }
  }

  const handleVoltar = () => {
    router.push('/dashboard')
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
    <div className="min-h-screen" style={{ backgroundColor: "#06459a" }}>
      {/* Header */}
      <header className="shadow-sm border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img
                src="/OwlTechLogo.png"
                alt="Logo OwlTech"
                className="w-10 h-10 object-contain bg-white rounded-lg"
                style={{ padding: 2 }}
              />
              <h1 className="text-xl font-bold" style={{ color: "#06459a" }}>Owl Tech - Sistema de Certificados</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Olá, {usuario.nome}</span>
              <Button
                onClick={handleVoltar}
                variant="outline"
                size="sm"
                style={{ borderColor: "#06459a", color: "#06459a" }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                  onClick={handleVoltar}
                  style={{ backgroundColor: "#06459a", color: "#ffffff" }}
                  className="w-full"
                >
                  Voltar ao Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="funcao">Função</Label>
                  <Select value={funcao} onValueChange={setFuncao} required>
                    <SelectTrigger>
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
                  className="w-full"
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
  )
} 