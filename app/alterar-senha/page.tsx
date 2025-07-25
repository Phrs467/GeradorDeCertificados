"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { hashPassword, isTokenExpired, formatExpirationTime } from "@/lib/password-utils"
import { sendEmailClient } from "@/lib/email-client"
import { AlertCircle, CheckCircle, Eye, EyeOff, Clock } from "lucide-react"

export default function AlterarSenhaPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [tokenExpiration, setTokenExpiration] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    if (token) {
      validateToken()
    } else {
      setError("Token de reset não fornecido na URL")
      setTokenValid(false)
    }
  }, [token])

  const validateToken = async () => {
    try {
      console.log("🔍 === INICIANDO VALIDAÇÃO DE TOKEN ===")
      console.log("🔑 Token recebido:", token)
      console.log("📏 Tamanho do token:", token?.length)
      console.log("🔤 Tipo do token:", typeof token)

      if (!token || token.length < 10) {
        console.error("❌ Token inválido ou muito curto")
        setError("Token inválido")
        setTokenValid(false)
        return
      }

      // Teste 1: Contar quantos tokens existem no banco
      console.log("🔍 TESTE 1: Contando tokens no banco...")
      const { count, error: countError } = await supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true })
        .not("reset_token", "is", null)

      console.log("📊 Quantidade de tokens no banco:", count)
      console.log("❌ Erro na contagem:", countError)

      // Teste 2: Buscar TODOS os tokens para comparação
      console.log("🔍 TESTE 2: Buscando TODOS os tokens...")
      const { data: allTokens, error: allTokensError } = await supabase
        .from("usuarios")
        .select("id, nome, email, reset_token, reset_token_expires")
        .not("reset_token", "is", null)

      console.log("📊 Todos os tokens encontrados:", allTokens)
      console.log("❌ Erro na busca geral:", allTokensError)

      // Teste 3: Buscar especificamente pelo token usando diferentes métodos
      console.log("🔍 TESTE 3: Busca específica pelo token...")

      // Método 1: Busca direta
      const { data: usuarios1, error: error1 } = await supabase
        .from("usuarios")
        .select("nome, email, reset_token, reset_token_expires")
        .eq("reset_token", token)

      console.log("📊 Método 1 (eq):", { usuarios: usuarios1?.length || 0, error: error1 })

      // Método 2: Busca com filtro
      const { data: usuarios2, error: error2 } = await supabase
        .from("usuarios")
        .select("nome, email, reset_token, reset_token_expires")
        .filter("reset_token", "eq", token)

      console.log("📊 Método 2 (filter):", { usuarios: usuarios2?.length || 0, error: error2 })

      // Método 3: Busca com SQL raw (se possível)
      console.log("🔍 TESTE 4: Comparação manual de tokens...")
      let tokenMatch = null
      if (allTokens && allTokens.length > 0) {
        tokenMatch = allTokens.find((t) => t.reset_token === token)
        console.log("🔍 Token encontrado na comparação manual:", !!tokenMatch)

        // Comparar caractere por caractere
        allTokens.forEach((t, index) => {
          console.log(`🔍 Token ${index + 1}:`)
          console.log(`  - Email: ${t.email}`)
          console.log(`  - Token no banco: "${t.reset_token}"`)
          console.log(`  - Token recebido: "${token}"`)
          console.log(`  - Iguais: ${t.reset_token === token}`)
          console.log(`  - Tamanho banco: ${t.reset_token?.length}`)
          console.log(`  - Tamanho recebido: ${token.length}`)

          if (t.reset_token && token) {
            // Comparar os primeiros 20 caracteres
            const banco20 = t.reset_token.substring(0, 20)
            const recebido20 = token.substring(0, 20)
            console.log(`  - Primeiros 20 (banco): "${banco20}"`)
            console.log(`  - Primeiros 20 (recebido): "${recebido20}"`)
            console.log(`  - Primeiros 20 iguais: ${banco20 === recebido20}`)
          }
        })
      }

      // Usar o resultado da busca
      const usuarios = usuarios1 || usuarios2 || (tokenMatch ? [tokenMatch] : [])

      setDebugInfo({
        tokenRecebido: token,
        tamanhoToken: token?.length,
        tipoToken: typeof token,
        totalTokensNoBanco: count || 0,
        usuariosEncontrados: usuarios?.length || 0,
        metodo1Resultado: usuarios1?.length || 0,
        metodo2Resultado: usuarios2?.length || 0,
        comparacaoManual: !!tokenMatch,
        erro1: error1?.message,
        erro2: error2?.message,
        todosTokens: allTokens?.map((t) => ({
          email: t.email,
          token: t.reset_token?.substring(0, 20) + "...",
          tokenCompleto: t.reset_token,
          expires: t.reset_token_expires,
          tokenMatch: t.reset_token === token,
          tamanhoToken: t.reset_token?.length,
        })),
      })

      if (!usuarios || usuarios.length === 0) {
        console.error("❌ Nenhum usuário encontrado com este token")
        setError("Token inválido ou não encontrado")
        setTokenValid(false)
        return
      }

      if (usuarios.length > 1) {
        console.error("❌ Múltiplos usuários com o mesmo token encontrados")
        setError("Erro: múltiplos tokens encontrados")
        setTokenValid(false)
        return
      }

      const usuario = usuarios[0]

      console.log("✅ Usuário encontrado:", {
        nome: usuario.nome,
        email: usuario.email,
        tokenMatch: usuario.reset_token === token,
        expires: usuario.reset_token_expires,
      })

      // Verificar se o token realmente corresponde (comparação extra)
      if (usuario.reset_token !== token) {
        console.error("❌ Token não corresponde exatamente")
        console.log("Token esperado:", token)
        console.log("Token no banco:", usuario.reset_token)
        setError("Token não corresponde")
        setTokenValid(false)
        return
      }

      console.log("⏰ Verificando expiração...")
      console.log("🕐 Token expira em:", usuario.reset_token_expires)
      console.log("🕐 Data atual:", new Date().toISOString())

      if (isTokenExpired(usuario.reset_token_expires)) {
        console.error("❌ Token expirado")
        setError(`Token expirado. Solicite um novo link de alteração de senha.`)
        setTokenValid(false)
        return
      }

      console.log("✅ Token válido e não expirado")
      setUserName(usuario.nome)
      setUserEmail(usuario.email)
      setTokenExpiration(formatExpirationTime(usuario.reset_token_expires))
      setTokenValid(true)
    } catch (err) {
      console.error("❌ Erro ao validar token:", err)
      setError("Erro interno ao validar token")
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

      // Criptografar nova senha
      console.log("🔐 Criptografando senha...")
      const hashedPassword = await hashPassword(novaSenha)
      console.log("✅ Senha criptografada")

      // Atualizar senha no banco
      console.log("💾 Atualizando no banco...")
      const { error: updateError } = await supabase
        .from("usuarios")
        .update({
          senha: hashedPassword,
          primeiro_login: false,
          reset_token: null,
          reset_token_expires: null,
        })
        .eq("reset_token", token)

      if (updateError) {
        console.error("❌ Erro ao atualizar senha:", updateError)
        setError("Erro ao atualizar senha. Tente novamente.")
        setLoading(false)
        return
      }

      console.log("✅ Senha atualizada com sucesso!")

      // Enviar email de confirmação via API route
      console.log("📧 Enviando email de confirmação...")
      await sendEmailClient({
        type: "password-changed",
        to: userEmail,
        nome: userName,
      })

      setSuccess(true)
    } catch (err) {
      console.error("❌ Erro ao alterar senha:", err)
      setError("Erro interno. Tente novamente.")
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
            <p className="mt-2 text-gray-600">🔍 Validando token...</p>
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
            <CardTitle style={{ color: "#06459a" }}>❌ Token Inválido</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            {/* Informações de debug super detalhadas */}
            {debugInfo && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <p className="text-sm font-bold text-gray-700 mb-3">🔍 Debug Detalhado:</p>
                <div className="text-xs text-gray-600 space-y-3">
                  {/* Informações básicas */}
                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold mb-2">📊 Informações Básicas:</div>
                    <div>
                      Token recebido: <code className="bg-gray-100 p-1 rounded">{debugInfo.tokenRecebido}</code>
                    </div>
                    <div>Tamanho: {debugInfo.tamanhoToken} caracteres</div>
                    <div>Tipo: {debugInfo.tipoToken}</div>
                    <div>Total de tokens no banco: {debugInfo.totalTokensNoBanco}</div>
                  </div>

                  {/* Resultados das buscas */}
                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold mb-2">🔍 Resultados das Buscas:</div>
                    <div>Método 1 (eq): {debugInfo.metodo1Resultado} usuários</div>
                    <div>Método 2 (filter): {debugInfo.metodo2Resultado} usuários</div>
                    <div>Comparação manual: {debugInfo.comparacaoManual ? "✅ Encontrado" : "❌ Não encontrado"}</div>
                    {debugInfo.erro1 && <div>Erro método 1: {debugInfo.erro1}</div>}
                    {debugInfo.erro2 && <div>Erro método 2: {debugInfo.erro2}</div>}
                  </div>

                  {/* Tokens no banco */}
                  {debugInfo.todosTokens && debugInfo.todosTokens.length > 0 && (
                    <div className="bg-white p-3 rounded border">
                      <div className="font-semibold mb-2">🔑 Tokens no Banco ({debugInfo.todosTokens.length}):</div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {debugInfo.todosTokens.map((t: any, i: number) => (
                          <div key={i} className="bg-gray-50 p-2 rounded border-l-4 border-blue-500">
                            <div>
                              <strong>Email:</strong> {t.email}
                            </div>
                            <div>
                              <strong>Token (início):</strong> {t.token}
                            </div>
                            <div>
                              <strong>Tamanho:</strong> {t.tamanhoToken} caracteres
                            </div>
                            <div>
                              <strong>Expira:</strong> {new Date(t.expires).toLocaleString("pt-BR")}
                            </div>
                            <div>
                              <strong>Match:</strong>{" "}
                              <span className={t.tokenMatch ? "text-green-600" : "text-red-600"}>
                                {t.tokenMatch ? "✅ SIM" : "❌ NÃO"}
                              </span>
                            </div>
                            {!t.tokenMatch && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-blue-600">Ver token completo</summary>
                                <div className="mt-1 p-2 bg-white rounded border">
                                  <div>
                                    <strong>Token no banco:</strong>
                                  </div>
                                  <code className="text-xs break-all">{t.tokenCompleto}</code>
                                  <div className="mt-1">
                                    <strong>Token recebido:</strong>
                                  </div>
                                  <code className="text-xs break-all">{debugInfo.tokenRecebido}</code>
                                </div>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={() => (window.location.href = "/")}
              className="w-full mt-4"
              style={{ backgroundColor: "#06459a", color: "#ffffff" }}
            >
              🔙 Voltar ao Login
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
            <CardTitle style={{ color: "#06459a" }}>✅ Senha Alterada!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Parabéns, <strong>{userName}</strong>! Sua senha foi alterada com sucesso.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Enviamos um email de confirmação para <strong>{userEmail}</strong>.
            </p>
            <p className="text-sm text-gray-600 mb-4">Agora você pode fazer login com sua nova senha.</p>
            <Button
              onClick={() => (window.location.href = "/")}
              className="w-full"
              style={{ backgroundColor: "#06459a", color: "#ffffff" }}
            >
              🔐 Ir para Login
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
          <CardTitle style={{ color: "#06459a" }}>🔑 Alterar Senha</CardTitle>
          <p className="text-sm text-gray-600">
            Olá, <strong>{userName}</strong>!
          </p>
          <p className="text-sm text-gray-500">({userEmail})</p>
          {tokenExpiration && (
            <div className="flex items-center justify-center gap-1 text-xs text-orange-600 mt-2">
              <Clock className="h-3 w-3" />
              {tokenExpiration}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="novaSenha"
                  type={showPassword ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required
                  placeholder="Digite sua nova senha"
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
              <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                  placeholder="Confirme sua nova senha"
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

            <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded">
              <p>
                <strong>📋 Requisitos da senha:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Pelo menos 8 caracteres</li>
                <li>Uma letra maiúscula (A-Z)</li>
                <li>Uma letra minúscula (a-z)</li>
                <li>Um número (0-9)</li>
                <li>Um caractere especial (!@#$%^&*)</li>
              </ul>
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
              {loading ? "🔄 Alterando..." : "🔑 Alterar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
