"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { firebaseAuth } from "@/lib/firebase"
import LoginForm from "@/components/login-form"
import EnvironmentCheck from "@/components/environment-check"

interface Usuario {
  id: string
  nome: string
  email: string
  chave_de_acesso: string
  [key: string]: any
}

export default function Home() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        // Usuário já está autenticado, redirecionar para dashboard
        router.push('/dashboard')
      } else {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleLoginSuccess = (usuarioLogado: Usuario) => {
    setUsuario(usuarioLogado)
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#06459a" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <EnvironmentCheck>
      <LoginForm onLoginSuccess={handleLoginSuccess} />
    </EnvironmentCheck>
  )
}
