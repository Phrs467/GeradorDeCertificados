"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { comparePassword, isBcryptHash } from "@/lib/password-utils"
import { sendEmailClient } from "@/lib/email-client"
import { AlertCircle, Mail, CheckCircle, Send, Info, Lock, Eye, EyeOff, UserPlus } from "lucide-react"
import { firebaseAuth, firestore, actionCodeSettings } from "@/lib/firebase"
import { sendSignInLinkToEmail, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth"
import { collection, query, where, getDocs } from "firebase/firestore"

interface LoginFormProps {
  onLoginSuccess: (usuario: any) => void
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'password' | 'link'>('password')
  const [showPrimeiroAcessoDialog, setShowPrimeiroAcessoDialog] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert("Link copiado para a área de transferência!")
    } catch (err) {
      console.error("Erro ao copiar:", err)
    }
  }

  const handleLoginWithPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("🔐 === INICIANDO LOGIN ===")
      console.log("📧 Email:", email)
      console.log("🔑 Senha fornecida:", senha ? "***" + senha.slice(-3) : "vazia")

      // 1. Verificar se o usuário existe no Firestore
      console.log("1️⃣ Verificando usuário no Firestore...")
      const usuariosRef = collection(firestore, "usuarios")
      const q = query(usuariosRef, where("email", "==", email.toLowerCase()))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        console.log("❌ Usuário não encontrado no Firestore")
        setError("Email não encontrado no sistema.")
        setLoading(false)
        return
      }

      const usuarioDoc = querySnapshot.docs[0]
      const usuario = usuarioDoc.data()
      console.log("✅ Usuário encontrado no Firestore:", usuario.nome)

      // 2. Verificar se a chave de acesso não expirou
      console.log("2️⃣ Verificando chave de acesso...")
      const dataAtual = new Date()
      const chaveAcesso = new Date(usuario.chave_de_acesso)
      if (chaveAcesso < dataAtual) {
        console.log("❌ Chave de acesso expirada")
        setError("Chave de acesso expirada. Entre em contato com o administrador.")
        setLoading(false)
        return
      }
      console.log("✅ Chave de acesso válida")

      // 3. Verificar se é primeiro login
      console.log("3️⃣ Verificando primeiro login...")
      if (usuario.primeiro_login) {
        console.log("🆕 Primeiro login detectado - redirecionando para alterar senha")
        setLoading(false) // Parar loading antes do redirecionamento
        setTimeout(() => {
          window.location.href = `/alterar-senha?primeiro_login=true&email=${encodeURIComponent(email)}`
        }, 100)
        return
      }
      console.log("✅ Não é primeiro login")

      // 4. Verificar se há senha no Firestore
      console.log("4️⃣ Verificando senha no Firestore...")
      if (usuario.senha) {
        console.log("🔐 Senha encontrada no Firestore, verificando...")
        let senhaValida = false
        
        try {
          if (isBcryptHash(usuario.senha)) {
            console.log("🔐 Verificando senha criptografada...")
            senhaValida = await comparePassword(senha, usuario.senha)
            console.log("🔐 Resultado da comparação bcrypt:", senhaValida)
          } else {
            console.log("🔐 Verificando senha em texto...")
            senhaValida = usuario.senha.trim() === senha.trim()
            console.log("🔐 Resultado da comparação texto:", senhaValida)
          }
        } catch (error) {
          console.error("❌ Erro ao verificar senha:", error)
          setError("Erro ao verificar senha. Tente novamente.")
          setLoading(false)
          return
        }

        if (senhaValida) {
          console.log("✅ Login com senha do Firestore bem-sucedido!")
          console.log("🔄 Chamando onLoginSuccess...")
          
          // Salvar dados do usuário na sessão
          sessionStorage.setItem('usuario', JSON.stringify(usuario))
          console.log("💾 Dados do usuário salvos na sessão")
          
          setLoading(false) // Parar loading antes do sucesso
          setTimeout(() => {
            onLoginSuccess(usuario)
          }, 100)
          return
        } else {
          console.log("❌ Senha incorreta no Firestore")
          setError("Email ou senha incorretos")
          setLoading(false)
          return
        }
      }

      // 5. Se não há senha no Firestore, tentar Firebase Auth
      console.log("5️⃣ Tentando autenticação no Firebase Auth...")
      try {
        await signInWithEmailAndPassword(firebaseAuth, email, senha)
        console.log("✅ Login com Firebase Auth bem-sucedido!")
        console.log("🔄 Chamando onLoginSuccess...")
        
        // Salvar dados do usuário na sessão
        sessionStorage.setItem('usuario', JSON.stringify(usuario))
        console.log("💾 Dados do usuário salvos na sessão")
        
        setLoading(false) // Parar loading antes do sucesso
        setTimeout(() => {
          onLoginSuccess(usuario)
        }, 100)
        return
      } catch (authError: any) {
        console.error("❌ Erro na autenticação Firebase Auth:", authError)
        
        if (authError.code === "auth/user-not-found") {
          setError("Email não encontrado no sistema.")
        } else if (authError.code === "auth/wrong-password") {
          setError("Email ou senha incorretos")
        } else {
          setError("Suas credenciais estão incorretas. Tente novamente.")
        }
        setLoading(false)
        return
      }

    } catch (err: any) {
      console.error("❌ Erro geral no login:", err)
      setError("Erro interno do servidor. Tente novamente.")
      setLoading(false)
    }
  }

  const handleSendLoginLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("🔐 Iniciando envio de link de login...")
      console.log("📧 Email:", email)

      // Verificar se o usuário existe no Firestore
      const usuariosRef = collection(firestore, "usuarios")
      const q = query(usuariosRef, where("email", "==", email.toLowerCase()))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setError("Email não encontrado no sistema.")
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

      // Enviar link de autenticação
      await sendSignInLinkToEmail(firebaseAuth, email, actionCodeSettings)

      // Salvar email no localStorage
      window.localStorage.setItem('emailForSignIn', email)

      console.log("✅ Link de login enviado com sucesso!")
      setSuccess(true)
      setEmailSent(true)

    } catch (err: any) {
      console.error("❌ Erro ao enviar link:", err)
      if (err.code === "auth/invalid-email") {
        setError("Email inválido.")
      } else if (err.code === "auth/user-not-found") {
        setError("Email não encontrado no sistema.")
      } else {
        setError("Erro ao enviar link de login. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSendResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("🔐 Iniciando envio de email de redefinição de senha...")
      console.log("📧 Email:", email)

      // Verificar se o usuário existe no Firestore
      const usuariosRef = collection(firestore, "usuarios")
      const q = query(usuariosRef, where("email", "==", email.toLowerCase()))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setError("Email não encontrado no sistema.")
        setLoading(false)
        return
      }

      // Enviar email de redefinição de senha
      await sendPasswordResetEmail(firebaseAuth, email)

      console.log("✅ Email de redefinição enviado com sucesso!")
      setResetEmailSent(true)

    } catch (err: any) {
      console.error("❌ Erro ao enviar email de reset:", err)
      if (err.code === "auth/invalid-email") {
        setError("Email inválido.")
      } else if (err.code === "auth/user-not-found") {
        setError("Email não encontrado no sistema.")
      } else {
        setError("Erro ao enviar email de redefinição. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePrimeiroAcesso = () => {
    if (!email.trim()) {
      setShowPrimeiroAcessoDialog(true)
      return
    }
    
    // Verificar se o usuário existe no Firestore
    const verificarUsuario = async () => {
      setLoading(true)
      setError("")

      try {
        const usuariosRef = collection(firestore, "usuarios")
        const q = query(usuariosRef, where("email", "==", email.toLowerCase()))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          setError("Email não encontrado no sistema.")
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

        // Verificar se é primeiro login
        if (!usuario.primeiro_login) {
          setError("Este usuário já possui senha cadastrada. Use o login normal.")
          setLoading(false)
          return
        }

        // Redirecionar para tela de primeiro acesso
        window.location.href = `/alterar-senha?primeiro_login=true&email=${encodeURIComponent(email)}`

      } catch (err: any) {
        console.error("❌ Erro ao verificar usuário:", err)
        setError("Erro interno do servidor")
      } finally {
        setLoading(false)
      }
    }

    verificarUsuario()
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#06459a" }}>
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <img
                src="/Owl%20Tech.png"
                alt="Logo da Empresa"
                className="h-20 w-auto"
                style={{ objectFit: "contain" }}
              />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#06459a" }}>
              {showResetPassword ? "Redefinir Senha" : "Login"}
            </h1>
          </CardHeader>
          <CardContent>
            {!emailSent && !resetEmailSent ? (
              <>
                {!showResetPassword && (
                  <div className="mb-4">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setLoginMethod('password')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                          loginMethod === 'password'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        Senha
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginMethod('link')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                          loginMethod === 'link'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        Link de Login
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-600 mb-4 text-center">
                  {showResetPassword 
                    ? "Digite seu email para receber um link de redefinição de senha"
                    : loginMethod === 'password'
                    ? "Digite seu email e senha para fazer login"
                    : "Digite seu email para receber um link de login seguro"
                  }
                </p>

                <form onSubmit={
                  showResetPassword 
                    ? handleSendResetPassword 
                    : loginMethod === 'password' 
                    ? handleLoginWithPassword 
                    : handleSendLoginLink
                } className="space-y-4">
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

                  {loginMethod === 'password' && !showResetPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="senha">Senha</Label>
                      <div className="relative">
                        <Input
                          id="senha"
                          type={showPassword ? "text" : "password"}
                          value={senha}
                          onChange={(e) => setSenha(e.target.value)}
                          required
                          placeholder="Digite sua senha"
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
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                    style={{ backgroundColor: "#06459a", color: "#ffffff" }}
                  >
                    {loading ? (
                      <>
                        <Send className="h-4 w-4 mr-2 animate-spin" />
                        {showResetPassword ? "Enviando..." : "Entrando..."}
                      </>
                    ) : (
                      <>
                        {showResetPassword ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Enviar Link de Redefinição
                          </>
                        ) : loginMethod === 'password' ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Entrar
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Link de Login
                          </>
                        )}
                      </>
                    )}
                  </Button>

                  {!showResetPassword && loginMethod === 'password' && (
                    <div className="text-center space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline block"
                      >
                        Esqueci minha senha
                      </button>
                      <button
                        type="button"
                        onClick={handlePrimeiroAcesso}
                        className="text-sm text-green-600 hover:text-green-800 underline block"
                      >
                        Primeiro Acesso
                      </button>
                    </div>
                  )}

                  {!showResetPassword && loginMethod === 'link' && (
                    <div className="text-center space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline block"
                      >
                        Esqueci minha senha
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginMethod('password')}
                        className="text-sm text-gray-600 hover:text-gray-800 underline block"
                      >
                        Prefiro usar senha
                      </button>
                    </div>
                  )}

                  {showResetPassword && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setShowResetPassword(false)
                          setError("")
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Voltar ao login
                      </button>
                    </div>
                  )}
                </form>
              </>
            ) : emailSent ? (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2" style={{ color: "#06459a" }}>
                  ✅ Link Enviado!
                </h2>
                <p className="text-gray-600 mb-4">
                  Enviamos um link de login seguro para <strong>{email}</strong>.
                  <br />
                  <br />
                  <strong>📧 Verifique sua caixa de entrada e pasta de spam.</strong>
                  <br />
                  <br />
                  Clique no link do email para fazer login.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setEmailSent(false)
                      setSuccess(false)
                      setError("")
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Enviar Novo Link
                  </Button>
                  <Button
                    onClick={() => {
                      setEmailSent(false)
                      setSuccess(false)
                      setError("")
                      setEmail("")
                    }}
                    style={{ backgroundColor: "#06459a", color: "#ffffff" }}
                    className="w-full"
                  >
                    Voltar ao Login
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2" style={{ color: "#06459a" }}>
                  ✅ Email de Redefinição Enviado!
                </h2>
                <p className="text-gray-600 mb-4">
                  Enviamos um link de redefinição de senha para <strong>{email}</strong>.
                  <br />
                  <br />
                  <strong>📧 Verifique sua caixa de entrada e pasta de spam.</strong>
                  <br />
                  <br />
                  Clique no link do email para redefinir sua senha.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setResetEmailSent(false)
                      setError("")
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Enviar Novo Email
                  </Button>
                  <Button
                    onClick={() => {
                      setResetEmailSent(false)
                      setShowResetPassword(false)
                      setError("")
                      setEmail("")
                    }}
                    style={{ backgroundColor: "#06459a", color: "#ffffff" }}
                    className="w-full"
                  >
                    Voltar ao Login
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para primeiro acesso sem email */}
      <Dialog open={showPrimeiroAcessoDialog} onOpenChange={setShowPrimeiroAcessoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Primeiro Acesso
            </DialogTitle>
            <DialogDescription>
              Para acessar a tela de primeiro acesso, você precisa digitar seu email no campo acima.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowPrimeiroAcessoDialog(false)}
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
