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
  [key: string]: any
}

export default function DashboardPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        try {
          // Buscar dados do usuário no Firestore
          const usuariosRef = collection(firestore, "usuarios")
          const q = query(usuariosRef, where("email", "==", user.email?.toLowerCase()))
          const querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            const usuarioDoc = querySnapshot.docs[0]
            const usuarioData = usuarioDoc.data() as Usuario
            setUsuario(usuarioData)
          } else {
            console.error("Usuário não encontrado no Firestore")
            await signOut(firebaseAuth)
            router.push('/')
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error)
          await signOut(firebaseAuth)
          router.push('/')
        }
      } else {
        // Usuário não autenticado, redirecionar para login
        router.push('/')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth)
      router.push('/')
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
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