# Funcionalidade de Assinaturas

## Visão Geral

A funcionalidade de assinaturas permite cadastrar e gerenciar assinaturas digitais que serão automaticamente inseridas nos certificados gerados pelo sistema.

## Funcionalidades Implementadas

### 1. Cadastro de Assinaturas
- **Página**: `/assinaturas`
- **Campos**: Nome completo + Upload de imagem PNG
- **Validações**: 
  - Apenas arquivos de imagem
  - Tamanho máximo de 5MB
  - Preview da imagem antes do cadastro

### 2. Gerenciamento de Assinaturas
- **Listagem**: Todas as assinaturas cadastradas
- **Busca**: Filtro por nome
- **Exclusão**: Remove assinatura e imagem do storage
- **Preview**: Visualização das assinaturas cadastradas

### 3. Integração com Certificados
- **Busca automática**: Por nome do instrutor
- **Assinatura padrão**: "Coordenador" para assinatura institucional
- **Fallback**: Certificados são gerados mesmo sem assinaturas

## Estrutura de Dados

### Firebase Firestore
```javascript
// Coleção: assinaturas
{
  nome: "Nome Completo da Pessoa",
  urlImagem: "https://firebasestorage.googleapis.com/...",
  dataCriacao: Timestamp
}
```

### Firebase Storage
```
assinaturas/
  ├── 1703123456789_assinatura1.png
  ├── 1703123456790_assinatura2.png
  └── ...
```

## APIs Criadas

### 1. Listar Todas as Assinaturas
```
GET /api/assinaturas
```
**Resposta:**
```json
{
  "success": true,
  "assinaturas": [
    {
      "id": "doc_id",
      "nome": "João Silva",
      "urlImagem": "https://...",
      "dataCriacao": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. Buscar Assinatura por Nome
```
GET /api/assinaturas/buscar?nome=João%20Silva
```
**Resposta:**
```json
{
  "success": true,
  "assinatura": {
    "id": "doc_id",
    "nome": "João Silva",
    "urlImagem": "https://...",
    "dataCriacao": "2024-01-01T00:00:00.000Z"
  }
}
```

## Utilitários JavaScript

### Funções Principais

#### `buscarAssinatura(nome: string)`
Busca uma assinatura específica por nome.

#### `buscarTodasAssinaturas()`
Retorna todas as assinaturas cadastradas.

#### `gerarHTMLAssinatura(nome: string, posicaoCSS?: string)`
Gera HTML para inserir uma assinatura em um certificado.

#### `gerarHTMLMultiplasAssinaturas(assinaturas: Array)`
Gera HTML para múltiplas assinaturas (instrutor + coordenador).

## Integração nos Certificados

### 1. Template Atualizado
O template `template-frente.html` foi atualizado para incluir:
```html
<!-- Container para assinaturas -->
<div id="assinaturas-container" style="margin-top: 20px; min-height: 100px;">
  <!-- As assinaturas serão inseridas aqui via JavaScript -->
</div>
```

### 2. Gerador de Certificados Atualizado
A função `gerarHTMLCertificado` foi modificada para:
- Buscar assinatura do instrutor automaticamente
- Buscar assinatura do coordenador (nome fixo: "Coordenador")
- Gerar HTML das assinaturas encontradas
- Inserir no template via JavaScript

## Como Usar

### 1. Cadastrar Assinaturas
1. Acesse `/assinaturas`
2. Preencha o nome completo
3. Faça upload da imagem PNG da assinatura
4. Clique em "Cadastrar Assinatura"

### 2. Gerar Certificados com Assinaturas
1. Importe planilha com dados dos alunos
2. Certifique-se de que os instrutores têm assinaturas cadastradas
3. Gere os certificados normalmente
4. As assinaturas serão inseridas automaticamente

### 3. Assinatura do Coordenador
Para ter uma assinatura institucional:
1. Cadastre uma assinatura com nome "Coordenador"
2. Esta assinatura será usada em todos os certificados

## Configuração do Firebase

### 1. Storage Rules
Configure as regras do Firebase Storage:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /assinaturas/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 2. Estrutura de Pastas
O Firebase Storage deve ter a pasta `assinaturas/` criada automaticamente.

## Exemplos de Uso

### Exemplo 1: Buscar Assinatura
```javascript
import { buscarAssinatura } from '@/lib/assinatura-utils'

const assinatura = await buscarAssinatura('João Silva')
if (assinatura) {
  console.log('Assinatura encontrada:', assinatura.urlImagem)
}
```

### Exemplo 2: Gerar HTML de Assinatura
```javascript
import { gerarHTMLAssinatura } from '@/lib/assinatura-utils'

const html = await gerarHTMLAssinatura('Maria Santos', 'assinatura-instrutor')
// Insere o HTML no template
```

### Exemplo 3: Múltiplas Assinaturas
```javascript
import { gerarHTMLMultiplasAssinaturas } from '@/lib/assinatura-utils'

const assinaturas = [
  { nome: 'João Silva', posicao: 'assinatura-instrutor', titulo: 'Instrutor' },
  { nome: 'Coordenador', posicao: 'assinatura-coordenador', titulo: 'Coordenador' }
]

const html = await gerarHTMLMultiplasAssinaturas(assinaturas)
```

## Vantagens da Implementação

1. **Automatização**: Assinaturas são inseridas automaticamente
2. **Flexibilidade**: Suporte a múltiplas assinaturas por certificado
3. **Fallback**: Certificados funcionam mesmo sem assinaturas
4. **Performance**: Imagens servidas via CDN do Firebase
5. **Segurança**: Controle de acesso via regras do Firebase
6. **Escalabilidade**: Storage automático e redundante

## Limitações e Considerações

1. **Tamanho**: Limite de 5MB por imagem
2. **Formato**: Aceita qualquer formato de imagem
3. **Nome**: Busca exata por nome completo
4. **Coordenador**: Nome fixo "Coordenador" para assinatura institucional
5. **Fallback**: Se assinatura não encontrada, certificado é gerado sem ela

## Monitoramento e Manutenção

### 1. Verificar Assinaturas
- Acesse `/assinaturas` para ver todas as assinaturas cadastradas
- Use a busca para encontrar assinaturas específicas

### 2. Limpeza
- Assinaturas excluídas removem tanto dados quanto imagens
- Backup automático do Firebase

### 3. Performance
- Imagens são cacheadas pelo Firebase CDN
- Primeira requisição pode ser mais lenta

## Troubleshooting

### Problema: Assinatura não aparece no certificado
**Solução:**
1. Verifique se o nome está cadastrado exatamente igual
2. Confirme se a imagem foi uploadada corretamente
3. Verifique os logs do console para erros

### Problema: Erro ao carregar imagem
**Solução:**
1. Verifique as regras do Firebase Storage
2. Confirme se a URL da imagem está acessível
3. Verifique se a imagem não foi excluída

### Problema: Certificado sem assinaturas
**Solução:**
1. Cadastre assinaturas para os instrutores
2. Cadastre uma assinatura com nome "Coordenador"
3. Verifique se os nomes estão corretos na planilha 