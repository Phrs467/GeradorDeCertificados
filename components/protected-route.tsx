"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { firebaseAuth, firestore } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"

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

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string // Função específica necessária (ex: "Administrador")
  redirectTo?: string // Para onde redirecionar se não autorizado
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = "/" 
}: ProtectedRouteProps) {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      console.log("🔍 ProtectedRoute - Firebase Auth State:", user ? "Autenticado" : "Não autenticado")
      
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
            
            // Verificar se a chave de acesso não expirou
            const dataAtual = new Date()
            const chaveAcesso = new Date(usuarioData.chave_de_acesso)
            if (chaveAcesso < dataAtual) {
              console.error("❌ Chave de acesso expirada")
              await firebaseAuth.signOut()
              sessionStorage.removeItem('usuario')
              router.push('/')
              return
            }
            
            // Verificar se tem a função necessária (se especificada)
            if (requiredRole && usuarioData.funcao !== requiredRole) {
              console.error(`❌ Usuário não tem a função necessária: ${requiredRole}`)
              router.push('/dashboard')
              return
            }
            
            setUsuario(usuarioData)
            setAuthorized(true)
          } else {
            console.error("❌ Usuário não encontrado no Firestore")
            await firebaseAuth.signOut()
            router.push('/')
          }
        } catch (error) {
          console.error("❌ Erro ao buscar dados do usuário:", error)
          await firebaseAuth.signOut()
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
            
            // Verificar se a chave de acesso não expirou
            const dataAtual = new Date()
            const chaveAcesso = new Date(usuarioData.chave_de_acesso)
            if (chaveAcesso < dataAtual) {
              console.error("❌ Chave de acesso expirada na sessão")
              sessionStorage.removeItem('usuario')
              router.push('/')
              return
            }
            
            // Verificar se tem a função necessária (se especificada)
            if (requiredRole && usuarioData.funcao !== requiredRole) {
              console.error(`❌ Usuário na sessão não tem a função necessária: ${requiredRole}`)
              router.push('/dashboard')
              return
            }
            
            setUsuario(usuarioData)
            setAuthorized(true)
          } catch (error) {
            console.error("❌ Erro ao parsear dados da sessão:", error)
            sessionStorage.removeItem('usuario')
            router.push('/')
          }
        } else {
          console.log("❌ Nenhum usuário na sessão, redirecionando para login")
          router.push(redirectTo)
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router, requiredRole, redirectTo])

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#06459a" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Se não está autorizado, não renderizar nada (já foi redirecionado)
  if (!authorized) {
    return null
  }

  // Se está autorizado, renderizar o conteúdo protegido
  return <>{children}</>
}
