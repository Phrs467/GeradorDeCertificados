# 🔒 Sistema de Segurança - Gerador de Certificados

## Visão Geral

Este documento descreve o sistema de segurança implementado para proteger as rotas da aplicação contra acesso não autorizado.

## 🚨 Problema Identificado

**Antes da implementação:** Usuários podiam acessar qualquer página da aplicação diretamente via URL, mesmo sem estar logados, expondo dados sensíveis.

**Exemplo:** Alguém poderia acessar `/alunos` ou `/relatorios` diretamente no navegador sem autenticação.

## ✅ Solução Implementada

### 1. Componente ProtectedRoute

Criamos um componente React que verifica a autenticação antes de renderizar o conteúdo protegido:

```tsx
<ProtectedRoute>
  <ConteudoProtegido />
</ProtectedRoute>
```

**Funcionalidades:**
- ✅ Verifica se o usuário está autenticado no Firebase Auth
- ✅ Verifica se há dados válidos na sessão
- ✅ Valida se a chave de acesso não expirou
- ✅ Suporta verificação de funções específicas (ex: "Administrador")
- ✅ Redireciona automaticamente para login se não autorizado
- ✅ Mostra loading durante verificação

### 2. Middleware do Next.js

Proteção adicional no nível do servidor:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Verifica autenticação para rotas da API protegidas
  // Bloqueia acesso não autorizado antes mesmo de chegar ao React
}
```

**Funcionalidades:**
- ✅ Intercepta todas as requisições
- ✅ Protege rotas da API
- ✅ Verifica headers de autenticação
- ✅ Verifica cookies de sessão

### 3. Configuração Centralizada

Arquivo `lib/route-protection.ts` centraliza todas as configurações:

```typescript
export const PROTECTED_ROUTES: RouteProtectionConfig[] = [
  {
    path: '/alunos',
    requiresAuth: true,
  },
  {
    path: '/cadastrar-usuario',
    requiresAuth: true,
    requiredRole: 'Administrador',
    redirectTo: '/dashboard',
  },
]
```

## 🛡️ Rotas Protegidas

### Rotas Públicas (Sem Autenticação)
- `/` - Página de login
- `/finishSignIn` - Finalização de login Firebase
- `/alterar-senha` - Alterar senha (via links específicos)
- `/api/verificar-certificado` - Verificação pública de certificados

### Rotas Protegidas (Com Autenticação)
- `/dashboard` - Dashboard principal
- `/alunos` - Gerenciamento de alunos
- `/alunos/[id]` - Perfil do aluno
- `/alunos/editar` - Edição de alunos
- `/relatorios` - Relatórios do sistema
- `/assinaturas` - Gerenciamento de assinaturas
- `/cadastrar-usuario` - Cadastro de usuários (apenas Administradores)

## 🔐 Como Funciona

### 1. Acesso à Página Protegida
```
Usuário acessa /alunos
    ↓
Middleware verifica se é rota protegida
    ↓
ProtectedRoute verifica autenticação
    ↓
Se autenticado: Renderiza conteúdo
Se não autenticado: Redireciona para login
```

### 2. Verificação de Autenticação
```typescript
// 1. Firebase Auth
if (firebaseAuth.currentUser) {
  // Usuário logado no Firebase
}

// 2. Sessão Local
if (sessionStorage.getItem('usuario')) {
  // Usuário logado via sistema customizado
}

// 3. Validação de Chave de Acesso
if (chaveAcesso < dataAtual) {
  // Chave expirada - logout automático
}
```

### 3. Verificação de Função
```typescript
// Para rotas que precisam de função específica
if (requiredRole && usuario.funcao !== requiredRole) {
  // Redireciona para dashboard se não tiver permissão
  router.push('/dashboard')
}
```

## 🚀 Implementação nas Páginas

### Exemplo: Página de Alunos
```tsx
export default function ListaAlunos() {
  // ... lógica da página

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        {/* Conteúdo protegido */}
      </div>
    </ProtectedRoute>
  )
}
```

### Exemplo: Página com Função Específica
```tsx
export default function CadastrarUsuario() {
  return (
    <ProtectedRoute requiredRole="Administrador">
      <div className="min-h-screen">
        {/* Apenas administradores podem acessar */}
      </div>
    </ProtectedRoute>
  )
}
```

## 🔒 Benefícios da Implementação

### 1. Segurança
- ✅ **Acesso Bloqueado:** Usuários não autenticados não conseguem acessar conteúdo protegido
- ✅ **Verificação Dupla:** Proteção no cliente (React) e servidor (middleware)
- ✅ **Expiração de Sessão:** Logout automático quando chave de acesso expira

### 2. Experiência do Usuário
- ✅ **Redirecionamento Automático:** Usuários são levados para login quando necessário
- ✅ **Feedback Visual:** Loading durante verificação de autenticação
- ✅ **Controle de Acesso:** Diferentes níveis de permissão por função

### 3. Manutenibilidade
- ✅ **Configuração Centralizada:** Todas as rotas protegidas em um lugar
- ✅ **Reutilização:** Componente ProtectedRoute usado em todas as páginas
- ✅ **Flexibilidade:** Fácil adicionar novas rotas protegidas

## 🧪 Testando a Segurança

### 1. Teste de Acesso Direto
```
1. Faça logout da aplicação
2. Tente acessar diretamente: /alunos
3. Deve ser redirecionado para: /
```

### 2. Teste de Função
```
1. Faça login com usuário não-administrador
2. Tente acessar: /cadastrar-usuario
3. Deve ser redirecionado para: /dashboard
```

### 3. Teste de API
```
1. Sem autenticação, tente acessar: /api/certificados/download/123
2. Deve receber: 401 Unauthorized
```

## 📝 Manutenção

### Adicionar Nova Rota Protegida
```typescript
// 1. Adicionar no arquivo de configuração
export const PROTECTED_ROUTES: RouteProtectionConfig[] = [
  // ... rotas existentes
  {
    path: '/nova-pagina',
    requiresAuth: true,
    requiredRole: 'Administrador', // opcional
  },
]

// 2. Aplicar na página
import ProtectedRoute from "@/components/protected-route"

export default function NovaPagina() {
  return (
    <ProtectedRoute>
      <div>Conteúdo protegido</div>
    </ProtectedRoute>
  )
}
```

### Modificar Proteção de Rota Existente
```typescript
// No arquivo de configuração
{
  path: '/alunos',
  requiresAuth: true,
  requiredRole: 'Instrutor', // Adicionar restrição de função
  redirectTo: '/dashboard', // Personalizar redirecionamento
}
```

## 🚨 Considerações de Segurança

### 1. Frontend vs Backend
- ✅ **Frontend:** ProtectedRoute bloqueia acesso visual
- ✅ **Backend:** Middleware protege APIs
- ⚠️ **Importante:** Sempre implementar validação no backend também

### 2. Tokens e Sessões
- ✅ **Firebase Auth:** Tokens JWT seguros
- ✅ **Sessão Local:** Dados criptografados
- ✅ **Expiração:** Logout automático por segurança

### 3. Rotas Públicas
- ✅ **Login:** Sempre acessível
- ✅ **Verificação:** Certificados podem ser verificados publicamente
- ✅ **Recuperação:** Links de alterar senha funcionam sem login

## 🔮 Próximos Passos

### 1. Melhorias Futuras
- [ ] Implementar refresh tokens
- [ ] Adicionar rate limiting
- [ ] Logs de auditoria de acesso
- [ ] Notificações de login suspeito

### 2. Monitoramento
- [ ] Dashboard de segurança
- [ ] Alertas de tentativas de acesso não autorizado
- [ ] Métricas de uso das rotas protegidas

---

**Status:** ✅ **IMPLEMENTADO E FUNCIONANDO**

**Última Atualização:** Dezembro 2024

**Responsável:** Equipe de Desenvolvimento
