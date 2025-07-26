"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { comparePassword, isBcryptHash } from "@/lib/password-utils"
import { sendEmailClient } from "@/lib/email-client"
import { AlertCircle, Mail, CheckCircle, Send, Info, Lock, Eye, EyeOff } from "lucide-react"
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
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'password' | 'link'>('password')

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
      console.log("🔐 Iniciando login com senha...")
      console.log("📧 Email:", email)
      console.log("🔑 Senha fornecida:", senha ? "***" + senha.slice(-3) : "vazia")

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

      // Tentar autenticar com Firebase Auth primeiro
      try {
        console.log("🔐 Tentando autenticação no Firebase Auth...")
        await signInWithEmailAndPassword(firebaseAuth, email, senha)
        console.log("✅ Login com Firebase Auth bem-sucedido!")
        
        // Se o Firebase Auth funcionou, verificar se é primeiro login
        if (usuario.primeiro_login) {
          console.log("🆕 Primeiro login detectado - redirecionando para alterar senha")
          window.location.href = `/alterar-senha?primeiro_login=true&email=${encodeURIComponent(email)}`
          return
        }

        // Login bem-sucedido - não verificar Firestore se Firebase Auth funcionou
        console.log("✅ Login bem-sucedido via Firebase Auth")
        onLoginSuccess(usuario)
        return
      } catch (authError: any) {
        console.error("❌ Erro na autenticação Firebase Auth:", authError)
        
        // Se o usuário não existe no Firebase Auth, tentar verificar senha no Firestore
        if (authError.code === "auth/user-not-found") {
          console.log("👤 Usuário não encontrado no Firebase Auth, tentando Firestore...")
          
          // Verificar se há senha no Firestore (fallback para usuários antigos)
          if (usuario.senha) {
            let senhaValida = false
            
            if (isBcryptHash(usuario.senha)) {
              console.log("🔐 Verificando senha criptografada no Firestore...")
              console.log("🔐 Hash armazenado:", usuario.senha.substring(0, 20) + "...")
              senhaValida = await comparePassword(senha, usuario.senha)
              console.log("🔐 Resultado da comparação bcrypt:", senhaValida)
            } else {
              console.log("🔐 Verificando senha em texto no Firestore...")
              console.log("🔐 Senha armazenada:", usuario.senha)
              senhaValida = usuario.senha.trim() === senha.trim()
              console.log("🔐 Resultado da comparação texto:", senhaValida)
            }

            if (senhaValida) {
              console.log("✅ Login com senha do Firestore bem-sucedido!")
              
              // Verificar se é primeiro login
              if (usuario.primeiro_login) {
                console.log("🆕 Primeiro login detectado - redirecionando para alterar senha")
                window.location.href = `/alterar-senha?primeiro_login=true&email=${encodeURIComponent(email)}`
                return
              }

              // Login bem-sucedido
              onLoginSuccess(usuario)
              return
            } else {
              console.log("❌ Senha incorreta no Firestore")
            }
          } else {
            console.log("❌ Nenhuma senha encontrada no Firestore")
          }
          
          setError("Email ou senha incorretos")
        } else if (authError.code === "auth/wrong-password") {
          console.log("❌ Senha incorreta no Firebase Auth")
          setError("Email ou senha incorretos")
        } else {
          console.log("❌ Outro erro de autenticação:", authError.code)
          setError("Suas credenciais estão incorretas. Tente novamente.")
        }
      }

    } catch (err: any) {
      console.error("❌ Erro no login:", err)
      setError("Erro interno do servidor")
    } finally {
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
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Esqueci minha senha
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
    </>
  )
}
