"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase, type Usuario } from "@/lib/supabase"
import { comparePassword, isBcryptHash } from "@/lib/password-utils"
import { sendEmailClient } from "@/lib/email-client"
import { AlertCircle, Mail, CheckCircle, Send, Info } from "lucide-react"

interface LoginFormProps {
  onLoginSuccess: (usuario: Usuario) => void
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showExpiredModal, setShowExpiredModal] = useState(false)
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false)
  const [showEmailSentModal, setShowEmailSentModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null)
  const [resetLink, setResetLink] = useState("")
  const [emailSendResult, setEmailSendResult] = useState<{
    success: boolean
    error?: string
    simulated?: boolean
    fallback?: boolean
  } | null>(null)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert("Link copiado para a área de transferência!")
    } catch (err) {
      console.error("Erro ao copiar:", err)
      // Fallback para navegadores mais antigos
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      alert("Link copiado!")
    }
  }

  const handleSendResetEmail = async (usuario: Usuario) => {
    try {
      console.log("🔄 === FORÇANDO SALVAMENTO DE TOKEN ===")
      console.log("👤 Usuário:", usuario.email, "ID:", usuario.id)

      // Gerar token muito simples
      const timestamp = Date.now().toString()
      const resetToken = `reset_${timestamp}`
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      console.log("🔑 Token super simples:", resetToken)
      console.log("🔑 Tamanho:", resetToken.length)

      // MÉTODO 1: Update usando email ao invés de ID
      console.log("💾 MÉTODO 1: Update por email...")
      const { data: method1, error: error1 } = await supabase
        .from("usuarios")
        .update({
          reset_token: resetToken,
          reset_token_expires: expiresAt.toISOString(),
        })
        .eq("email", usuario.email)
        .select("reset_token, reset_token_expires")

      console.log("📊 Resultado método 1:", { data: method1, error: error1?.message })

      if (!error1 && method1 && method1.length > 0) {
        console.log("✅ Método 1 funcionou!")

        // Verificar se realmente salvou
        const { data: verify1, error: verifyError1 } = await supabase
          .from("usuarios")
          .select("reset_token, reset_token_expires")
          .eq("email", usuario.email)
          .single()

        if (verify1?.reset_token === resetToken) {
          console.log("✅ Token confirmado pelo método 1")

          // Gerar link e enviar email
          const resetLink = `${window.location.origin}/alterar-senha?token=${resetToken}`
          const emailResult = await sendEmailClient({
            type: "password-reset",
            to: usuario.email,
            nome: usuario.nome,
            resetLink: resetLink,
          })

          return {
            success: emailResult.success,
            link: resetLink,
            error: emailResult.error,
            simulated: emailResult.simulated,
            fallback: emailResult.fallback,
          }
        }
      }

      // MÉTODO 2: Update usando RPC (função do banco)
      console.log("💾 MÉTODO 2: Tentando RPC...")
      try {
        const { data: method2, error: error2 } = await supabase.rpc("update_reset_token", {
          user_email: usuario.email,
          new_token: resetToken,
          expires_at: expiresAt.toISOString(),
        })

        console.log("📊 Resultado método 2 (RPC):", { data: method2, error: error2?.message })

        if (!error2) {
          // Verificar se RPC funcionou
          const { data: verify2, error: verifyError2 } = await supabase
            .from("usuarios")
            .select("reset_token")
            .eq("email", usuario.email)
            .single()

          if (verify2?.reset_token === resetToken) {
            console.log("✅ RPC funcionou!")

            const resetLink = `${window.location.origin}/alterar-senha?token=${resetToken}`
            const emailResult = await sendEmailClient({
              type: "password-reset",
              to: usuario.email,
              nome: usuario.nome,
              resetLink: resetLink,
            })

            return {
              success: emailResult.success,
              link: resetLink,
              error: emailResult.error,
              simulated: emailResult.simulated,
              fallback: emailResult.fallback,
            }
          }
        }
      } catch (rpcError) {
        console.log("⚠️ RPC não disponível:", rpcError)
      }

      // MÉTODO 3: Update com upsert
      console.log("💾 MÉTODO 3: Tentando upsert...")
      const { data: method3, error: error3 } = await supabase
        .from("usuarios")
        .upsert(
          {
            email: usuario.email,
            nome: usuario.nome,
            senha: usuario.senha,
            chave_de_acesso: usuario.chave_de_acesso,
            reset_token: resetToken,
            reset_token_expires: expiresAt.toISOString(),
            primeiro_login: usuario.primeiro_login,
          },
          {
            onConflict: "email",
            ignoreDuplicates: false,
          },
        )
        .select("reset_token")

      console.log("📊 Resultado método 3 (upsert):", { data: method3, error: error3?.message })

      if (!error3 && method3 && method3.length > 0) {
        const { data: verify3, error: verifyError3 } = await supabase
          .from("usuarios")
          .select("reset_token")
          .eq("email", usuario.email)
          .single()

        if (verify3?.reset_token === resetToken) {
          console.log("✅ Upsert funcionou!")

          const resetLink = `${window.location.origin}/alterar-senha?token=${resetToken}`
          const emailResult = await sendEmailClient({
            type: "password-reset",
            to: usuario.email,
            nome: usuario.nome,
            resetLink: resetLink,
          })

          return {
            success: emailResult.success,
            link: resetLink,
            error: emailResult.error,
            simulated: emailResult.simulated,
            fallback: emailResult.fallback,
          }
        }
      }

      // MÉTODO 4: Múltiplos updates pequenos
      console.log("💾 MÉTODO 4: Updates separados...")

      // Primeiro limpar
      const { error: clearError } = await supabase
        .from("usuarios")
        .update({ reset_token: null, reset_token_expires: null })
        .eq("email", usuario.email)

      console.log("🧹 Limpeza:", clearError?.message || "OK")

      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Depois salvar só o token
      const { error: tokenError } = await supabase
        .from("usuarios")
        .update({ reset_token: resetToken })
        .eq("email", usuario.email)

      console.log("🔑 Salvamento token:", tokenError?.message || "OK")

      await new Promise((resolve) => setTimeout(resolve, 500))

      // Depois salvar a data
      const { error: dateError } = await supabase
        .from("usuarios")
        .update({ reset_token_expires: expiresAt.toISOString() })
        .eq("email", usuario.email)

      console.log("📅 Salvamento data:", dateError?.message || "OK")

      // Verificar resultado final
      const { data: finalCheck, error: finalError } = await supabase
        .from("usuarios")
        .select("reset_token, reset_token_expires")
        .eq("email", usuario.email)
        .single()

      console.log("📊 Verificação final:", {
        token: finalCheck?.reset_token,
        expires: finalCheck?.reset_token_expires,
        error: finalError?.message,
      })

      if (finalCheck?.reset_token === resetToken) {
        console.log("✅ Método 4 funcionou!")

        const resetLink = `${window.location.origin}/alterar-senha?token=${resetToken}`
        const emailResult = await sendEmailClient({
          type: "password-reset",
          to: usuario.email,
          nome: usuario.nome,
          resetLink: resetLink,
        })

        return {
          success: emailResult.success,
          link: resetLink,
          error: emailResult.error,
          simulated: emailResult.simulated,
          fallback: emailResult.fallback,
        }
      }

      // Se chegou aqui, nenhum método funcionou
      console.error("❌ TODOS OS MÉTODOS FALHARAM")
      return {
        success: false,
        link: "",
        error: "Impossível salvar token no banco - todos os métodos falharam",
      }
    } catch (error) {
      console.error("❌ Erro geral:", error)
      return {
        success: false,
        link: "",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!supabase) {
        setError("Erro de configuração do sistema.")
        setLoading(false)
        return
      }

      console.log("🔐 Tentando login com:", email)

      // Buscar usuário no banco
      const { data: usuario, error: dbError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .single()

      if (dbError || !usuario) {
        console.error("❌ Usuário não encontrado:", dbError)
        setError("Email ou senha incorretos")
        setLoading(false)
        return
      }

      console.log("✅ Usuário encontrado:", {
        nome: usuario.nome,
        email: usuario.email,
        primeiro_login: usuario.primeiro_login,
      })

      // Verificar senha
      let senhaValida = false

      if (isBcryptHash(usuario.senha)) {
        senhaValida = await comparePassword(senha, usuario.senha)
      } else {
        senhaValida = usuario.senha.trim() === senha.trim()
      }

      if (!senhaValida) {
        console.error("❌ Senha incorreta")
        setError("Email ou senha incorretos")
        setLoading(false)
        return
      }

      // Verificar se a chave de acesso não expirou
      const dataAtual = new Date()
      const chaveAcesso = new Date(usuario.chave_de_acesso)

      if (chaveAcesso < dataAtual) {
        console.error("❌ Chave de acesso expirada")
        setShowExpiredModal(true)
        setLoading(false)
        return
      }

      // Verificar se é primeiro login
      if (usuario.primeiro_login) {
        console.log("🆕 Primeiro login detectado")
        setCurrentUser(usuario)
        setShowFirstLoginModal(true)
        setLoading(false)
        return
      }

      // Login bem-sucedido
      console.log("✅ Login realizado com sucesso!")
      onLoginSuccess(usuario)
    } catch (err) {
      console.error("❌ Erro no login:", err)
      setError("Erro interno do servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleFirstLoginConfirm = async () => {
    if (!currentUser) return

    setLoading(true)
    const result = await handleSendResetEmail(currentUser)

    setEmailSendResult(result)
    setResetLink(result.link)
    setShowFirstLoginModal(false)
    setShowEmailSentModal(true)

    if (!result.success) {
      setError(result.error || "Erro ao enviar email")
    }

    setLoading(false)
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
              Login
            </h1>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  placeholder="Sua senha"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                style={{ backgroundColor: "#06459a", color: "#ffffff" }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Modal de primeiro login */}
      {showFirstLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md mx-4">
            <div className="text-center">
              <Mail className="h-12 w-12 mx-auto mb-4" style={{ color: "#06459a" }} />
              <h2 className="text-xl font-bold mb-2" style={{ color: "#06459a" }}>
                🆕 Primeiro Acesso
              </h2>
              <p className="text-gray-600 mb-4">
                Este é seu primeiro login. Precisamos que você altere sua senha para continuar.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Enviaremos um link seguro para <strong>{currentUser?.email}</strong> para que você possa definir sua
                nova senha.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => setShowFirstLoginModal(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={handleFirstLoginConfirm}
                  disabled={loading}
                  className="flex-1"
                  style={{ backgroundColor: "#06459a", color: "#ffffff" }}
                >
                  {loading ? (
                    <>
                      <Send className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de email enviado */}
      {showEmailSentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg mx-4">
            <div className="text-center">
              {emailSendResult?.success ? (
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              ) : (
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              )}

              <h2 className="text-xl font-bold mb-2" style={{ color: "#06459a" }}>
                {emailSendResult?.success ? "✅ Email Enviado!" : "❌ Erro no Envio"}
              </h2>

              {emailSendResult?.success ? (
                <>
                  <p className="text-gray-600 mb-4">
                    {emailSendResult.simulated ? (
                      <>
                        <strong>⚠️ Modo Desenvolvimento:</strong> Email simulado enviado para{" "}
                        <strong>{currentUser?.email}</strong>. Verifique o console do navegador para ver o link.
                      </>
                    ) : (
                      <>
                        Enviamos um link seguro para <strong>{currentUser?.email}</strong>.
                        <br />
                        <br />
                        <strong>📧 Verifique sua caixa de entrada e pasta de spam.</strong>
                        <br />
                        <br />
                        Clique no link do email para alterar sua senha.
                      </>
                    )}
                  </p>

                  {emailSendResult.fallback && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-blue-800 text-sm">
                        <Info className="h-4 w-4" />
                        <span>Email enviado via domínio padrão do Resend</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-red-600 mb-4">
                  <p>Não foi possível enviar o email.</p>
                  {emailSendResult?.error && <p className="text-sm mt-2">Erro: {emailSendResult.error}</p>}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowEmailSentModal(false)}
                  className="flex-1"
                  style={{ backgroundColor: "#06459a", color: "#ffffff" }}
                >
                  {emailSendResult?.success ? "Entendi" : "Tentar Novamente"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de chave expirada */}
      {showExpiredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md mx-4">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2" style={{ color: "#06459a" }}>
                ⏰ Chave de Acesso Expirada
              </h2>
              <p className="text-gray-600 mb-4">
                A sua chave de acesso expirou, favor entrar em contato com o suporte do desenvolvimento da Ownl Tech.
              </p>
              <Button
                onClick={() => setShowExpiredModal(false)}
                style={{ backgroundColor: "#06459a", color: "#ffffff" }}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
