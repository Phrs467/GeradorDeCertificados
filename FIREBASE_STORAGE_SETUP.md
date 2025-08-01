# Configuração do Firebase Storage para Imagens

## Visão Geral

O Firebase Storage é usado para armazenar imagens de assinaturas no sistema. As imagens são salvas no Storage e as URLs são armazenadas no Firestore junto com os metadados.

## Configuração Necessária

### 1. Firebase Storage Rules

Configure as regras do Firebase Storage para permitir upload e download de imagens:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir acesso público para leitura de imagens
    match /assinaturas/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Regras padrão - negar tudo
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 2. Estrutura de Dados no Firestore

A coleção `assinaturas` no Firestore armazena:

```javascript
{
  nome: "Nome Completo da Pessoa",
  urlImagem: "https://firebasestorage.googleapis.com/...",
  dataCriacao: Timestamp
}
```

### 3. Estrutura no Firebase Storage

As imagens são organizadas em:
```
assinaturas/
  ├── 1703123456789_assinatura1.png
  ├── 1703123456790_assinatura2.png
  └── ...
```

## Como Funciona no Código

### Upload de Imagem

1. **Validação**: Verifica se é uma imagem e se tem menos de 5MB
2. **Upload**: Envia para Firebase Storage com nome único baseado em timestamp
3. **URL**: Obtém URL de download da imagem
4. **Firestore**: Salva metadados + URL no Firestore

```javascript
// Upload para Storage
const nomeArquivo = `assinaturas/${Date.now()}_${arquivoImagem.name}`
const storageRef = ref(storage, nomeArquivo)
await uploadBytes(storageRef, arquivoImagem)

// Obter URL
const downloadURL = await getDownloadURL(storageRef)

// Salvar no Firestore
await addDoc(collection(db, "assinaturas"), {
  nome: nomeAssinatura,
  urlImagem: downloadURL,
  dataCriacao: new Date()
})
```

### Busca de Assinatura

Para usar em certificados, busque por nome:

```javascript
// API: /api/assinaturas/buscar?nome=Nome%20Completo
const response = await fetch(`/api/assinaturas/buscar?nome=${encodeURIComponent(nome)}`)
const data = await response.json()

if (data.success) {
  const urlAssinatura = data.assinatura.urlImagem
  // Usar urlAssinatura no certificado
}
```

## Vantagens desta Abordagem

1. **Performance**: Imagens servidas via CDN do Firebase
2. **Escalabilidade**: Storage automático e redundante
3. **Segurança**: Controle de acesso via regras
4. **Organização**: Estrutura hierárquica clara
5. **Backup**: Backup automático do Firebase

## Limitações e Considerações

1. **Tamanho**: Limite de 5MB por imagem
2. **Formato**: Aceita qualquer formato de imagem
3. **Custo**: Storage tem custo por GB armazenado
4. **Latência**: Primeira requisição pode ser mais lenta

## Monitoramento

- Use o console do Firebase para monitorar uso do Storage
- Configure alertas para limites de uso
- Monitore regras de segurança regularmente

## Backup e Recuperação

- Firebase faz backup automático
- Para backup manual, exporte dados do Firestore
- Imagens ficam no Storage mesmo se dados do Firestore forem perdidos

## Segurança

- URLs são públicas mas protegidas por regras
- Validação de tipo e tamanho no frontend
- Sanitização de nomes de arquivo
- Controle de acesso via autenticação 