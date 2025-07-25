"use client"

import type React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function EnvironmentCheck({ children }: { children: React.ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#06459a" }}>
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="bg-white">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Erro de Configuração</strong>
              <br />
              <br />
              As variáveis de ambiente do Supabase não estão configuradas:
              <br />
              <br />
              <code className="text-xs bg-gray-100 p-1 rounded">
                {!supabaseUrl && "• NEXT_PUBLIC_SUPABASE_URL"}
                <br />
                {!supabaseAnonKey && "• NEXT_PUBLIC_SUPABASE_ANON_KEY"}
              </code>
              <br />
              <br />
              Configure essas variáveis no arquivo <code>.env.local</code> na raiz do projeto.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#06459a" }}>
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="bg-white">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>URL do Supabase Inválida</strong>
              <br />
              <br />A URL fornecida não é válida: <code className="text-xs bg-gray-100 p-1 rounded">{supabaseUrl}</code>
              <br />
              <br />
              Verifique se a URL está no formato correto (ex: https://seu-projeto.supabase.co)
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
