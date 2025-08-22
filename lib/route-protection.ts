// Configuração de proteção de rotas
export interface RouteProtectionConfig {
  path: string
  requiresAuth: boolean
  requiredRole?: string
  redirectTo?: string
}

// Rotas que não precisam de autenticação
export const PUBLIC_ROUTES: string[] = [
  '/', // Página de login
  '/finishSignIn', // Finalização de login do Firebase
  '/alterar-senha', // Alterar senha (acessada via links específicos)
]

// Rotas que precisam de autenticação
export const PROTECTED_ROUTES: RouteProtectionConfig[] = [
  {
    path: '/dashboard',
    requiresAuth: true,
  },
  {
    path: '/alunos',
    requiresAuth: true,
  },
  {
    path: '/alunos/[id]',
    requiresAuth: true,
  },
  {
    path: '/alunos/editar',
    requiresAuth: true,
  },
  {
    path: '/relatorios',
    requiresAuth: true,
  },
  {
    path: '/assinaturas',
    requiresAuth: true,
  },
  {
    path: '/cadastrar-usuario',
    requiresAuth: true,
    requiredRole: 'Administrador',
    redirectTo: '/dashboard',
  },
]

// Função para verificar se uma rota é pública
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route.includes('[') && route.includes(']')) {
      // Rota dinâmica - verificar padrão
      const routePattern = route.replace(/\[.*?\]/g, '[^/]+')
      const regex = new RegExp(`^${routePattern}$`)
      return regex.test(pathname)
    }
    return pathname === route || pathname.startsWith(route + '/')
  })
}

// Função para verificar se uma rota é protegida
export function isProtectedRoute(pathname: string): boolean {
  return !isPublicRoute(pathname)
}

// Função para obter configuração de proteção de uma rota
export function getRouteProtectionConfig(pathname: string): RouteProtectionConfig | null {
  return PROTECTED_ROUTES.find(config => {
    if (config.path.includes('[') && config.path.includes(']')) {
      // Rota dinâmica - verificar padrão
      const routePattern = config.path.replace(/\[.*?\]/g, '[^/]+')
      const regex = new RegExp(`^${routePattern}$`)
      return regex.test(pathname)
    }
    return pathname === config.path || pathname.startsWith(config.path + '/')
  }) || null
}
