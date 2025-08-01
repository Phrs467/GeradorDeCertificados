"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { firebaseAuth, firestore } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import Dashboard from "@/components/dashboard"

interface Usuario {
  id: string
  nome: string
  email: string
  chave_de_acesso: string
  funcao?: string
  primeiro_login?: boolean
  senha?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      console.log("🔍 Dashboard - Firebase Auth State:", user ? "Autenticado" : "Não autenticado")
      
      if (user) {
        try {
          console.log("🔍 Buscando dados do usuário no Firestore...")
          // Buscar dados do usuário no Firestore
          const usuariosRef = collection(firestore, "usuarios")
          const q = query(usuariosRef, where("email", "==", user.email?.toLowerCase()))
          const querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            const usuarioDoc = querySnapshot.docs[0]
            const usuarioData = usuarioDoc.data() as Usuario
            console.log("✅ Usuário encontrado no Firestore:", usuarioData.nome)
            setUsuario(usuarioData)
          } else {
            console.error("❌ Usuário não encontrado no Firestore")
            await signOut(firebaseAuth)
            router.push('/')
          }
        } catch (error) {
          console.error("❌ Erro ao buscar dados do usuário:", error)
          await signOut(firebaseAuth)
          router.push('/')
        }
      } else {
        // Usuário não autenticado no Firebase Auth
        console.log("❌ Usuário não autenticado no Firebase Auth")
        
        // Verificar se há dados do usuário na sessão (login via Firestore)
        const sessionUser = sessionStorage.getItem('usuario')
        if (sessionUser) {
          try {
            const usuarioData = JSON.parse(sessionUser) as Usuario
            console.log("✅ Usuário encontrado na sessão:", usuarioData.nome)
            setUsuario(usuarioData)
          } catch (error) {
            console.error("❌ Erro ao parsear dados da sessão:", error)
            sessionStorage.removeItem('usuario')
            router.push('/')
          }
        } else {
          console.log("❌ Nenhum usuário na sessão, redirecionando para login")
          router.push('/')
        }
      }
      setLoading(false)
      setAuthChecked(true)
    })

    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    try {
      console.log("🚪 Fazendo logout...")
      await signOut(firebaseAuth)
      sessionStorage.removeItem('usuario')
      router.push('/')
    } catch (error) {
      console.error("❌ Erro ao fazer logout:", error)
    }
  }

  const handleLoginSuccess = (usuarioLogado: Usuario) => {
    setUsuario(usuarioLogado)
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

  if (!usuario) {
    return null
  }

  return <Dashboard usuario={usuario} onLogout={handleLogout} />
} 