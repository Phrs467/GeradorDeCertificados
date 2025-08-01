import { type NextRequest, NextResponse } from "next/server"
import { generatePasswordResetEmail, generatePasswordChangedEmail } from "@/lib/email-service"
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const { type, to, nome, resetLink } = await request.json()

    // Validar dados obrigatórios
    if (!type || !to || !nome) {
      return NextResponse.json({ success: false, error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    const resendApiKey = process.env.RESEND_API_KEY
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

    // Usar a API oficial do Resend
    const resend = new Resend(resendApiKey)
    
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: html,
    })

    if (error) {
      console.error("❌ Erro no Resend:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Erro ao enviar email",
        },
        { status: 500 },
      )
    }

    console.log("✅ Email enviado com sucesso via Resend:", data)
    return NextResponse.json({ success: true, data: data })
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
