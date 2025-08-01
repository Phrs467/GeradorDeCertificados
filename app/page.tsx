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
  funcao?: string
  primeiro_login?: boolean
  senha?: string
  [key: string]: any
}

export default function Home() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      console.log("🔍 Firebase Auth State Changed:", user ? "Usuário autenticado" : "Usuário não autenticado")
      
      if (user) {
        // Usuário já está autenticado no Firebase Auth, redirecionar para dashboard
        console.log("✅ Usuário já autenticado, redirecionando para dashboard")
        router.push('/dashboard')
      } else {
        // Usuário não está autenticado no Firebase Auth, mostrar tela de login
        console.log("❌ Usuário não autenticado, mostrando tela de login")
        setLoading(false)
      }
      setAuthChecked(true)
    })

    return () => unsubscribe()
  }, [router])

  const handleLoginSuccess = (usuarioLogado: Usuario) => {
    console.log("🎉 Login bem-sucedido, redirecionando...")
    console.log("👤 Usuário:", usuarioLogado.nome)
    console.log("📧 Email:", usuarioLogado.email)
    console.log("🔑 Função:", usuarioLogado.funcao)
    
    setUsuario(usuarioLogado)
    
    // Forçar redirecionamento para dashboard
    setTimeout(() => {
      console.log("🔄 Executando redirecionamento para dashboard...")
      router.push('/dashboard')
    }, 100)
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
