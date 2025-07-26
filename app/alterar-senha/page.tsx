"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { hashPassword, isTokenExpired, formatExpirationTime } from "@/lib/password-utils"
import { sendEmailClient } from "@/lib/email-client"
import { AlertCircle, CheckCircle, Eye, EyeOff, Clock } from "lucide-react"
import { firebaseAuth } from "@/lib/firebase"
import { confirmPasswordReset, verifyPasswordResetCode, updatePassword, createUserWithEmailAndPassword } from "firebase/auth"
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"

// Definir tipo auxiliar para os dados do usuário
interface UsuarioFirestore {
  id: string
  nome: string
  email: string
  reset_token: string | null
  reset_token_expires: string | null
  [key: string]: any
}

export default function AlterarSenhaPage() {
  const searchParams = useSearchParams()
  const oobCode = searchParams.get("oobCode") // Firebase usa oobCode para reset de senha
  const primeiroLogin = searchParams.get("primeiro_login") === "true"
  const emailParam = searchParams.get("email")

  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (primeiroLogin && emailParam) {
      // Fluxo de primeiro login
      validatePrimeiroLogin()
    } else if (oobCode) {
      // Fluxo de redefinição de senha
      validateToken()
    } else {
      setError("Parâmetros inválidos na URL")
      setTokenValid(false)
    }
  }, [oobCode, primeiroLogin, emailParam])

  const validatePrimeiroLogin = async () => {
    try {
      console.log("🔍 === VALIDANDO PRIMEIRO LOGIN ===")
      console.log("📧 Email:", emailParam)

      if (!emailParam) {
        setError("Email não fornecido")
        setTokenValid(false)
        return
      }

      // Buscar dados do usuário no Firestore
      const firestore = getFirestore()
      const usuariosRef = collection(firestore, "usuarios")
      const q = query(usuariosRef, where("email", "==", emailParam.toLowerCase()))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setError("Usuário não encontrado no sistema")
        setTokenValid(false)
        return
      }

      const usuarioDoc = querySnapshot.docs[0]
      const usuario = usuarioDoc.data()

      // Verificar se é realmente primeiro login
      if (!usuario.primeiro_login) {
        setError("Este não é um primeiro login")
        setTokenValid(false)
        return
      }

      setUserEmail(emailParam)
      setUserName(usuario.nome || "Usuário")
      setTokenValid(true)

    } catch (err: any) {
      console.error("❌ Erro ao validar primeiro login:", err)
      setError("Erro ao validar primeiro login")
      setTokenValid(false)
    }
  }

  const validateToken = async () => {
    try {
      console.log("🔍 === VALIDANDO TOKEN DE REDEFINIÇÃO ===")
      console.log("🔑 Código recebido:", oobCode)

      if (!oobCode || oobCode.length < 10) {
        console.error("❌ Código inválido ou muito curto")
        setError("Código de redefinição inválido")
        setTokenValid(false)
        return
      }

      // Verificar se o código é válido usando Firebase
      const email = await verifyPasswordResetCode(firebaseAuth, oobCode)
      console.log("✅ Código válido para email:", email)
      
      setUserEmail(email)
      setUserName("Usuário") // Nome será buscado do Firestore se necessário
      setTokenValid(true)

    } catch (err: any) {
      console.error("❌ Erro ao validar código:", err)
      if (err.code === "auth/invalid-action-code") {
        setError("Código de redefinição inválido ou expirado")
      } else if (err.code === "auth/expired-action-code") {
        setError("Código de redefinição expirado. Solicite um novo link.")
      } else {
        setError("Erro ao validar código de redefinição")
      }
      setTokenValid(false)
    }
  }

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push("A senha deve ter pelo menos 8 caracteres")
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("A senha deve conter pelo menos uma letra maiúscula")
    }
    if (!/[a-z]/.test(password)) {
      errors.push("A senha deve conter pelo menos uma letra minúscula")
    }
    if (!/[0-9]/.test(password)) {
      errors.push("A senha deve conter pelo menos um número")
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("A senha deve conter pelo menos um caractere especial")
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("🔄 Iniciando alteração de senha")

      // Validar senhas
      if (novaSenha !== confirmarSenha) {
        setError("As senhas não coincidem")
        setLoading(false)
        return
      }

      const passwordErrors = validatePassword(novaSenha)
      if (passwordErrors.length > 0) {
        setError(passwordErrors.join(". "))
        setLoading(false)
        return
      }

      if (primeiroLogin) {
        // Fluxo de primeiro login - criar usuário no Firebase Auth e atualizar Firestore
        console.log("🆕 Primeiro login - criando usuário no Firebase Auth e atualizando Firestore")
        
        const firestore = getFirestore()
        const usuariosRef = collection(firestore, "usuarios")
        const q = query(usuariosRef, where("email", "==", userEmail.toLowerCase()))
        const querySnapshot = await getDocs(q)
        
        if (querySnapshot.empty) {
          setError("Usuário não encontrado")
          setLoading(false)
          return
        }

        const usuarioDoc = querySnapshot.docs[0]
        const usuario = usuarioDoc.data()
        
        try {
          // Criar usuário no Firebase Auth
          console.log("🔐 Criando usuário no Firebase Auth...")
          console.log("📧 Email:", userEmail)
          console.log("🔑 Senha:", novaSenha ? "***" + novaSenha.slice(-3) : "vazia")
          const userCredential = await createUserWithEmailAndPassword(firebaseAuth, userEmail, novaSenha)
          console.log("✅ Usuário criado no Firebase Auth com UID:", userCredential.user.uid)
          
          // Criptografar senha para salvar no Firestore (backup)
          const hashedPassword = await hashPassword(novaSenha)
          
          // Atualizar dados no Firestore
          await updateDoc(usuarioDoc.ref, {
            senha: hashedPassword,
            primeiro_login: false,
            updated_at: new Date().toISOString(),
          })
          
          console.log("✅ Dados atualizados no Firestore para primeiro login")
        } catch (authError: any) {
          console.error("❌ Erro ao criar usuário no Firebase Auth:", authError)
          
          if (authError.code === "auth/email-already-in-use") {
            // Usuário já existe no Firebase Auth, apenas atualizar senha
            console.log("⚠️ Usuário já existe no Firebase Auth, atualizando senha...")
            
            // Criptografar senha para salvar no Firestore
            const hashedPassword = await hashPassword(novaSenha)
            
            await updateDoc(usuarioDoc.ref, {
              senha: hashedPassword,
              primeiro_login: false,
              updated_at: new Date().toISOString(),
            })
            
            console.log("✅ Senha atualizada no Firestore (usuário já existia no Auth)")
          } else {
            throw authError
          }
        }
      } else {
        // Fluxo de redefinição de senha
        if (!oobCode || typeof oobCode !== 'string') {
          setError("Código de redefinição inválido.")
          setLoading(false)
          return
        }

        // Resetar senha no Firebase Auth usando o código
        await confirmPasswordReset(firebaseAuth, oobCode, novaSenha)
        console.log("✅ Senha alterada no Firebase Auth")

        // Atualizar campos adicionais no Firestore (se necessário)
        try {
          const firestore = getFirestore()
          const usuariosRef = collection(firestore, "usuarios")
          const q = query(usuariosRef, where("email", "==", userEmail.toLowerCase()))
          const querySnapshot = await getDocs(q)
          
          if (!querySnapshot.empty) {
            const usuarioDoc = querySnapshot.docs[0]
            await updateDoc(usuarioDoc.ref, {
              primeiro_login: false,
              updated_at: new Date().toISOString(),
            })
            console.log("✅ Dados do usuário atualizados no Firestore")
          }
        } catch (firestoreError) {
          console.warn("⚠️ Erro ao atualizar dados no Firestore:", firestoreError)
          // Não falha o processo se não conseguir atualizar o Firestore
        }
      }

      // Enviar email de confirmação via API route
      console.log("📧 Enviando email de confirmação...")
      try {
        await sendEmailClient({
          type: "password-changed",
          to: userEmail,
          nome: userName,
        })
      } catch (emailError) {
        console.warn("⚠️ Erro ao enviar email de confirmação:", emailError)
        // Não falha o processo se não conseguir enviar o email
      }

      setSuccess(true)
    } catch (err: any) {
      console.error("❌ Erro ao alterar senha:", err)
      if (err.code === "auth/invalid-action-code") {
        setError("Código de redefinição inválido ou expirado")
      } else if (err.code === "auth/expired-action-code") {
        setError("Código de redefinição expirado. Solicite um novo link.")
      } else if (err.code === "auth/weak-password") {
        setError("A senha é muito fraca. Escolha uma senha mais forte.")
      } else {
        setError("Erro interno. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#06459a" }}>
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">
              {primeiroLogin ? "🔍 Validando primeiro login..." : "🔍 Validando código..."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#06459a" }}>
        <Card className="w-full max-w-4xl mx-4">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle style={{ color: "#06459a" }}>
              {primeiroLogin ? "❌ Erro no Primeiro Login" : "❌ Código Inválido"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button
                onClick={() => window.location.href = '/'}
                style={{ backgroundColor: "#06459a", color: "#ffffff" }}
              >
                Voltar ao Login
              </Button>
            </div>
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
            <CardTitle style={{ color: "#06459a" }}>
              {primeiroLogin ? "✅ Senha Criada!" : "✅ Senha Alterada!"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              {primeiroLogin 
                ? <>Parabéns, <strong>{userName}</strong>! Sua senha foi criada com sucesso.</>
                : <>Parabéns, <strong>{userName}</strong>! Sua senha foi alterada com sucesso.</>
              }
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Agora você pode fazer login com sua nova senha.
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              style={{ backgroundColor: "#06459a", color: "#ffffff" }}
            >
              Ir para o Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#06459a" }}>
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle style={{ color: "#06459a" }}>
            {primeiroLogin ? "🔑 Criar Senha" : "🔑 Alterar Senha"}
          </CardTitle>
          {primeiroLogin && (
            <p className="text-sm text-gray-600">
              Olá, <strong>{userName}</strong>! Crie sua primeira senha.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="novaSenha">
                {primeiroLogin ? "Nova Senha" : "Nova Senha"}
              </Label>
              <div className="relative">
                <Input
                  id="novaSenha"
                  type={showPassword ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required
                  placeholder={primeiroLogin ? "Digite sua nova senha" : "Digite sua nova senha"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">
                {primeiroLogin ? "Confirmar Senha" : "Confirmar Nova Senha"}
              </Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                  placeholder={primeiroLogin ? "Confirme sua senha" : "Confirme sua nova senha"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-semibold mb-2">📋 Requisitos da senha:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Pelo menos 8 caracteres</li>
                <li>• Pelo menos uma letra maiúscula</li>
                <li>• Pelo menos uma letra minúscula</li>
                <li>• Pelo menos um número</li>
                <li>• Pelo menos um caractere especial (!@#$%^&*)</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              style={{ backgroundColor: "#06459a", color: "#ffffff" }}
            >
              {loading 
                ? "🔄 Processando..." 
                : primeiroLogin 
                ? "🔑 Criar Senha" 
                : "🔑 Alterar Senha"
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
