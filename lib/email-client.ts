// Cliente para envio de emails (usado no frontend)
export interface SendEmailRequest {
  type: "password-reset" | "password-changed"
  to: string
  nome: string
  resetLink?: string
}

export interface SendEmailResponse {
  success: boolean
  error?: string
  simulated?: boolean
  data?: any
}

export async function sendEmailClient(request: SendEmailRequest): Promise<SendEmailResponse> {
  try {
    console.log("📧 Enviando email via API route...")

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("❌ Erro na API de email:", result)
      return {
        success: false,
        error: result.error || "Erro ao enviar email",
      }
    }

    if (result.simulated) {
      console.log("⚠️ Email simulado (desenvolvimento)")
    } else {
      console.log("✅ Email enviado com sucesso!")
    }

    return result
  } catch (error) {
    console.error("❌ Erro ao chamar API de email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro de conexão",
    }
  }
}
