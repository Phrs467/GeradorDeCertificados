import bcrypt from "bcryptjs"
import crypto from "crypto"

// Utilitários para trabalhar com senhas
export async function hashPassword(password: string): Promise<string> {
  try {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  } catch (error) {
    console.error("Erro ao criptografar senha:", error)
    throw new Error("Erro ao criptografar senha")
  }
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error("Erro ao comparar senha:", error)
    return false
  }
}

export function isBcryptHash(str: string): boolean {
  if (!str || typeof str !== 'string') return false
  return str.startsWith("$2b$") || str.startsWith("$2a$") || str.startsWith("$2y$")
}

export function generateResetToken(): string {
  // Gerar token mais simples e garantir que seja string
  const token = crypto.randomBytes(32).toString("hex")
  console.log("🔑 Token gerado internamente:", token)
  console.log("🔑 Tipo do token:", typeof token)
  console.log("🔑 Tamanho do token:", token.length)
  return token
}

export function isTokenExpired(expiresAt: string): boolean {
  try {
    const now = new Date()
    const expires = new Date(expiresAt)

    console.log("🕐 Verificação de expiração:", {
      agora: now.toISOString(),
      expira: expires.toISOString(),
      expirou: now > expires,
      diferenca: `${Math.round((expires.getTime() - now.getTime()) / (1000 * 60))} minutos`,
    })

    return now > expires
  } catch (error) {
    console.error("Erro ao verificar expiração do token:", error)
    return true
  }
}

export function formatExpirationTime(expiresAt: string): string {
  try {
    const expires = new Date(expiresAt)
    const now = new Date()
    const diffMinutes = Math.round((expires.getTime() - now.getTime()) / (1000 * 60))

    if (diffMinutes < 0) {
      return "Expirado"
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minutos restantes`
    } else {
      const hours = Math.floor(diffMinutes / 60)
      const minutes = diffMinutes % 60
      return `${hours}h ${minutes}min restantes`
    }
  } catch (error) {
    console.error("Erro ao formatar tempo de expiração:", error)
    return "Tempo desconhecido"
  }
}
