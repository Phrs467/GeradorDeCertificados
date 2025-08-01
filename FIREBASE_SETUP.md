# Configuração do Firebase - Resolução de Erros

## Problema Identificado
O erro "Erro interno do servidor" está ocorrendo devido à falta de permissões no Firestore. O diagnóstico mostrou:
- ✅ Firebase inicializado corretamente
- ✅ bcrypt funcionando
- ✅ Dependências instaladas
- ❌ **Firestore: Missing or insufficient permissions**

## Solução: Configurar Regras de Segurança do Firestore

### 1. Acessar o Console do Firebase
1. Vá para [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Selecione o projeto: `exportador-certificados-14bd4`
3. No menu lateral, clique em **Firestore Database**
4. Clique na aba **Regras**

### 2. Configurar Regras de Segurança
Substitua as regras atuais pelas seguintes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acesso à coleção 'usuarios'
    match /usuarios/{document} {
      allow read, write: if true; // TEMPORÁRIO - para desenvolvimento
    }
    
    // Para produção, use regras mais restritivas:
    // match /usuarios/{document} {
    //   allow read: if request.auth != null;
    //   allow write: if request.auth != null && 
    //     (request.auth.token.email == resource.data.email || 
    //      resource.data.funcao == "Administrador");
    // }
  }
}
```

### 3. Publicar as Regras
1. Clique em **Publicar**
2. Aguarde a confirmação

## Teste Após Configuração

### 1. Testar Conexão
```bash
node scripts/diagnose-errors.js
```

### 2. Criar Usuário Administrador
```bash
node scripts/create-admin-user.js
```

### 3. Testar Aplicação
```bash
npm run dev
```

## Fluxo de Teste Completo

### 1. Login como Administrador
- Email: `admin@owltech.com`
- Senha: (será criada no primeiro acesso)

### 2. Cadastrar Novo Usuário
- Acesse o dashboard
- Clique em "Cadastrar Usuário"
- Preencha os dados

### 3. Primeiro Acesso do Novo Usuário
- Use o email do usuário criado
- Clique em "Primeiro Acesso"
- Defina a senha

### 4. Login Normal
- Teste o login com as credenciais criadas

## Regras de Segurança para Produção

Quando a aplicação estiver em produção, use estas regras mais seguras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{document} {
      // Permitir leitura para usuários autenticados
      allow read: if request.auth != null;
      
      // Permitir escrita apenas para:
      // 1. Administradores
      // 2. Usuários editando seus próprios dados
      allow write: if request.auth != null && (
        resource.data.funcao == "Administrador" ||
        request.auth.token.email == resource.data.email
      );
    }
  }
}
```

## Troubleshooting

### Erro: "Missing or insufficient permissions"
- **Solução**: Configure as regras de segurança do Firestore
- **Verificação**: Execute `node scripts/diagnose-errors.js`

### Erro: "Firebase not initialized"
- **Solução**: Verifique se o arquivo `lib/firebase.ts` está correto
- **Verificação**: Confirme as credenciais do Firebase

### Erro: "bcrypt not working"
- **Solução**: Reinstale as dependências
- **Comando**: `npm install bcryptjs`

### Erro: "Page not found"
- **Solução**: Verifique se todos os arquivos estão no lugar correto
- **Verificação**: Execute `npm run build` para ver erros de compilação

## Logs de Debug

Para ver logs detalhados, abra o console do navegador (F12) e procure por:
- `🔐 Iniciando login com senha...`
- `✅ Firebase inicializado com sucesso`
- `❌ Erro na autenticação Firebase Auth`

## Contato

Se os problemas persistirem após seguir este guia, verifique:
1. Configuração do Firebase no console
2. Regras de segurança do Firestore
3. Credenciais da aplicação
4. Logs de erro no console do navegador 