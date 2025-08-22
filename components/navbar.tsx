"use client"

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface NavbarProps {
  currentPage?: string
  usuario?: {
    nome: string
    funcao?: string
  }
  onLogout?: () => void
}

export default function Navbar({ currentPage, usuario, onLogout }: NavbarProps) {
  const router = useRouter()

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      // Fallback padrão
      sessionStorage.removeItem('usuario')
      router.push('/')
    }
  }

  return (
    <nav className="fixed top-0 left-0 w-full z-50 shadow border-b border-blue-900" style={{height: 60, backgroundColor: '#06459a'}}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-4">
          <img src="/OwlTechLogo.png" alt="Logo ISP Certificados" className="w-8 h-8 object-contain bg-white rounded-lg" style={{ padding: 2 }} />
          <span className="font-bold text-white text-lg">ISP CERTIFICADOS</span>
        </div>
        
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            className={`text-white hover:text-blue-200 font-medium transition ${
              currentPage === 'dashboard' ? 'bg-white bg-opacity-20' : ''
            }`}
            onClick={() => router.push('/dashboard')}
          >
            Dashboard
          </Button>
          
          <Button
            variant="ghost"
            className={`text-white hover:text-blue-200 font-medium transition ${
              currentPage === 'alunos' ? 'bg-white bg-opacity-20' : ''
            }`}
            onClick={() => router.push('/alunos')}
          >
            Alunos
          </Button>
          
          <Button
            variant="ghost"
            className={`text-white hover:text-blue-200 font-medium transition ${
              currentPage === 'relatorios' ? 'bg-white bg-opacity-20' : ''
            }`}
            onClick={() => router.push('/relatorios')}
          >
            Relatórios
          </Button>
          
          <Button
            variant="ghost"
            className={`text-white hover:text-blue-200 font-medium transition ${
              currentPage === 'usuarios' ? 'bg-white bg-opacity-20' : ''
            }`}
            onClick={() => router.push('/cadastrar-usuario')}
          >
            Usuários
          </Button>
          
          <Button
            variant="ghost"
            className={`text-white hover:text-blue-200 font-medium transition ${
              currentPage === 'assinaturas' ? 'bg-white bg-opacity-20' : ''
            }`}
            onClick={() => router.push('/assinaturas')}
          >
            Assinaturas
          </Button>
          
          <Button
            variant="ghost"
            className={`text-white hover:text-blue-200 font-medium transition ${
              currentPage === 'conteudo-pragmatico' ? 'bg-white bg-opacity-20' : ''
            }`}
            onClick={() => router.push('/conteudo-pragmatico')}
          >
            Conteúdo Pragmático
          </Button>
          
          <Button
            variant="ghost"
            className="text-white hover:text-blue-200 font-medium transition"
            onClick={handleLogout}
          >
            Sair
          </Button>
        </div>
      </div>
    </nav>
  )
}

