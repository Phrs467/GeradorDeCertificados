import { type NextRequest, NextResponse } from "next/server"
import { generatePasswordResetEmail, generatePasswordChangedEmail } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const { type, to, nome, resetLink } = await request.json()

    // Validar dados obrigatórios
    if (!type || !to || !nome) {
      return NextResponse.json({ success: false, error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    const resendApiKey = process.env.RESEND_API_KEY
    // Usar domínio padrão do Resend que não precisa de verificação
    const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev"
    const fromName = process.env.FROM_NAME || "Sistema Owl Tech"

    if (!resendApiKey) {
      console.log("⚠️ RESEND_API_KEY não configurada. Simulando envio de email...")
      console.log("📧 Email que seria enviado:")
      console.log("📧 Para:", to)
      console.log("📧 De:", `${fromName} <${fromEmail}>`)
      console.log("📧 Tipo:", type)

      // Simular delay de envio
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return NextResponse.json({ success: true, simulated: true })
    }

    let subject: string
    let html: string

    // Gerar conteúdo baseado no tipo
    switch (type) {
      case "password-reset":
        if (!resetLink) {
          return NextResponse.json(
            { success: false, error: "resetLink é obrigatório para password-reset" },
            { status: 400 },
          )
        }
        subject = "🔑 Alterar Senha - Owl Tech"
        html = generatePasswordResetEmail(nome, resetLink)
        break

      case "password-changed":
        subject = "✅ Senha Alterada com Sucesso - Owl Tech"
        html = generatePasswordChangedEmail(nome)
        break

      default:
        return NextResponse.json({ success: false, error: "Tipo de email inválido" }, { status: 400 })
    }

    console.log("📧 Enviando email via Resend...")
    console.log("📧 Para:", to)
    console.log("📧 De:", `${fromName} <${fromEmail}>`)
    console.log("📧 Assunto:", subject)

    // Envio real com Resend usando domínio verificado
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject: subject,
        html: html,
      }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error("❌ Erro no Resend:", responseData)

      // Se for erro de domínio não verificado, usar fallback
      if (responseData.error && responseData.error.includes("domain is not verified")) {
        console.log("⚠️ Domínio não verificado, usando fallback...")

        // Tentar novamente com domínio padrão do Resend
        const fallbackResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `${fromName} <onboarding@resend.dev>`,
            to: [to],
            subject: subject,
            html: html,
          }),
        })

        const fallbackData = await fallbackResponse.json()

        if (!fallbackResponse.ok) {
          console.error("❌ Erro no fallback:", fallbackData)
          return NextResponse.json(
            {
              success: false,
              error: fallbackData.message || "Erro ao enviar email",
            },
            { status: 500 },
          )
        }

        console.log("✅ Email enviado com sucesso via fallback:", fallbackData)
        return NextResponse.json({ success: true, data: fallbackData, fallback: true })
      }

      return NextResponse.json(
        {
          success: false,
          error: responseData.message || responseData.error || "Erro ao enviar email",
        },
        { status: 500 },
      )
    }

    console.log("✅ Email enviado com sucesso via Resend:", responseData)
    return NextResponse.json({ success: true, data: responseData })
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/GeradorDeCertificados',
  assetPrefix: '/GeradorDeCertificados/',
}
export default nextConfig
