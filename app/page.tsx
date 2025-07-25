"use client"

import { useState } from "react"
import LoginForm from "@/components/login-form"
import Dashboard from "@/components/dashboard"
import EnvironmentCheck from "@/components/environment-check"
import type { Usuario } from "@/lib/supabase"

export default function Home() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  const handleLoginSuccess = (usuarioLogado: Usuario) => {
    setUsuario(usuarioLogado)
  }

  const handleLogout = () => {
    setUsuario(null)
  }

  return (
    <EnvironmentCheck>
      {!usuario ? (
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Dashboard usuario={usuario} onLogout={handleLogout} />
      )}
    </EnvironmentCheck>
  )
}
