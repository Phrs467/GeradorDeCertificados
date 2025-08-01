"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { isSignInWithEmailLink, signInWithEmailLink, getAdditionalUserInfo } from "firebase/auth"
import { firebaseAuth, firestore } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Loader2, Mail } from "lucide-react"

function FinishSignInComponent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState("")
  const [showEmailPrompt, setShowEmailPrompt] = useState(false)

  useEffect(() => {
    const finishSignIn = async () => {
      try {
        // Confirmar que o link é para login por email
        if (!isSignInWithEmailLink(firebaseAuth, window.location.href)) {
          setError("Link de autenticação inválido")
          setLoading(false)
          return
        }

        // Obter o email do localStorage
        let userEmail = window.localStorage.getItem('emailForSignIn')
        
        if (!userEmail) {
          // Usuário abriu o link em um dispositivo diferente
          // Para prevenir ataques de fixação de sessão, pedir o email novamente
          setShowEmailPrompt(true)
          setLoading(false)
          return
        }

        // Finalizar o processo de autenticação
        const result = await signInWithEmailLink(firebaseAuth, userEmail, window.location.href)
        const user = result.user

        // Obter informações adicionais do usuário
        const additionalUserInfo = getAdditionalUserInfo(result)
        console.log("Usuário é novo:", additionalUserInfo?.isNewUser)

        // Buscar dados adicionais do usuário no Firestore
        const usuariosRef = collection(firestore, "usuarios")
        const q = query(usuariosRef, where("email", "==", userEmail.toLowerCase()))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          setError("Usuário não encontrado no banco de dados.")
          setLoading(false)
          return
        }

        const usuarioDoc = querySnapshot.docs[0]
        const usuario = usuarioDoc.data()

        // Verificar se a chave de acesso não expirou
        const dataAtual = new Date()
        const chaveAcesso = new Date(usuario.chave_de_acesso)
        if (chaveAcesso < dataAtual) {
          setError("Chave de acesso expirada. Entre em contato com o administrador.")
          setLoading(false)
          return
        }

        // Limpar o email do localStorage
        window.localStorage.removeItem('emailForSignIn')

        // Login bem-sucedido
        setSuccess(true)
        
        // Redirecionar para o dashboard após 2 segundos
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)

      } catch (err: any) {
        console.error("Erro ao finalizar login:", err)
        
        // Tratar erros específicos
        if (err.code === "auth/invalid-email") {
          setError("Email inválido.")
        } else if (err.code === "auth/invalid-action-code") {
          setError("Link inválido ou expirado. Solicite um novo link de login.")
        } else if (err.code === "auth/expired-action-code") {
          setError("Link expirado. Solicite um novo link de login.")
        } else {
          setError("Erro ao finalizar o login. Tente novamente.")
        }
      } finally {
        setLoading(false)
      }
    }

    finishSignIn()
  }, [router])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Por favor, digite seu email.")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Finalizar o processo de autenticação com o email fornecido
      const result = await signInWithEmailLink(firebaseAuth, email, window.location.href)
      const user = result.user

      // Buscar dados adicionais do usuário no Firestore
      const usuariosRef = collection(firestore, "usuarios")
      const q = query(usuariosRef, where("email", "==", email.toLowerCase()))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setError("Usuário não encontrado no banco de dados.")
        setLoading(false)
        return
      }

      const usuarioDoc = querySnapshot.docs[0]
      const usuario = usuarioDoc.data()

      // Verificar se a chave de acesso não expirou
      const dataAtual = new Date()
      const chaveAcesso = new Date(usuario.chave_de_acesso)
      if (chaveAcesso < dataAtual) {
        setError("Chave de acesso expirada. Entre em contato com o administrador.")
        setLoading(false)
        return
      }

      // Login bem-sucedido
      setSuccess(true)
      
      // Redirecionar para o dashboard após 2 segundos
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (err: any) {
      console.error("Erro ao finalizar login:", err)
      
      if (err.code === "auth/invalid-email") {
        setError("Email inválido.")
      } else if (err.code === "auth/invalid-action-code") {
        setError("Link inválido ou expirado. Solicite um novo link de login.")
      } else if (err.code === "auth/expired-action-code") {
        setError("Link expirado. Solicite um novo link de login.")
      } else {
        setError("Erro ao finalizar o login. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#06459a" }}>
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Finalizando login...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showEmailPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#06459a" }}>
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 mx-auto mb-4" style={{ color: "#06459a" }} />
            <CardTitle style={{ color: "#06459a" }}>Confirme seu Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4 text-center">
              Por favor, digite seu email para confirmar o login.
            </p>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Digite seu email"
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                style={{ backgroundColor: "#06459a", color: "#ffffff" }}
              >
                {loading ? "Confirmando..." : "Confirmar Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#06459a" }}>
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle style={{ color: "#06459a" }}>Erro no Login</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => router.push('/')}
              style={{ backgroundColor: "#06459a", color: "#ffffff" }}
            >
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#06459a" }}>
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle style={{ color: "#06459a" }}>Login Realizado!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-green-600 mb-4">Redirecionando para o dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

export default function FinishSignInPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <FinishSignInComponent />
    </Suspense>
  );
}