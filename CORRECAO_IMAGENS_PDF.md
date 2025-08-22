# Correção das Imagens no PDF, QR Code e Tamanho dos Templates

## Problemas Identificados

1. **Imagens não apareciam no PDF**: As imagens `ri_1.jpeg` e `ri_2.png` não apareciam no PDF gerado porque o Puppeteer estava usando `page.setContent()` que não consegue carregar recursos externos como imagens com caminhos relativos.

2. **QR Code com URL incorreta**: O QR code estava sendo gerado com o ID do documento do Firestore (aluno) em vez do ID do certificado específico, causando erro "Certificado Inválido" na verificação.

3. **Tamanho dos templates inadequado**: Os templates tinham tamanho fixo (1120x790px) com bordas pretas e não preenchiam toda a página do PDF.

## Soluções Implementadas

### 1. Conversão de Imagens para Base64

Criada função `converterImagemParaBase64()` que:
- Lê o arquivo de imagem do sistema de arquivos
- Converte para base64
- Retorna no formato `data:image/[extensão];base64,[dados]`

### 2. Correção do QR Code

- Modificada a geração do QR code para usar o ID do certificado específico (`pessoa.ID`) em vez do ID do documento do Firestore
- Adicionados logs de debug na API de verificação de certificado

### 3. Ajuste do Tamanho dos Templates

- **Removidas bordas pretas**: `border: 1px solid #000` → `border: none`
- **Tamanho responsivo**: `width: 1120px; height: 790px` → `width: 100%; height: 100vh`
- **Margens removidas**: `margin: 40px auto` → `margin: 0`
- **PDF em formato A4 paisagem**: Configurado para usar `format: 'A4', landscape: true`
- **Viewport otimizado**: Ajustado para `1600x1200` para modo paisagem
- **Content otimizado**: `max-width: 1200px` e `width: 85%` para melhor aproveitamento do espaço horizontal

### 4. Reposicionamento de Elementos

- **Content centralizado**: Usando `position: absolute` com `transform: translate(-50%, -50%)`
- **Assinatura**: Reposicionada para `bottom: 80px` com `transform: translateX(-50%)`
- **QR Code**: Reposicionado para `bottom: 80px; right: 80px`
- **Código do certificado**: Reposicionado para `bottom: 80px; left: 80px`
- **CNPJ**: Reposicionado para `top: 80px; right: 80px`

### 5. Arquivos Modificados

#### `lib/pdf-download.ts`
- Adicionada função `converterImagemParaBase64()`
- Modificada função `gerarPDFIndividual()` para converter e substituir as imagens
- Configuração de PDF alterada para formato A4 paisagem (`landscape: true`)
- Viewport otimizado para 1600x1200 (modo paisagem)

#### `app/api/gerar-pdf/route.ts`
- Adicionada função `converterImagemParaBase64()`
- Modificada função `POST()` para converter e substituir as imagens
- Configuração de PDF alterada para formato A4 paisagem (`landscape: true`)
- Viewport otimizado para 1600x1200 (modo paisagem)

#### `components/dashboard.tsx`
- Corrigida geração do QR code para usar `pessoa.ID` (ID do certificado) em vez de `result.id` (ID do documento Firestore)

#### `app/api/verificar-certificado/route.ts`
- Adicionados logs de debug para facilitar a identificação de problemas
- Melhorada a comparação de IDs usando `String()` para garantir compatibilidade

#### `public/template-frente.html`
- Tamanho alterado para `width: 100%; height: 100vh`
- Bordas pretas removidas
- Content otimizado para paisagem: `max-width: 1200px; width: 85%`
- Fontes aumentadas para melhor aproveitamento do espaço horizontal
- Elementos reposicionados para melhor distribuição

#### `public/template-verso.html`
- Tamanho alterado para `width: 100%; height: 100vh`
- Bordas pretas removidas
- Content otimizado para paisagem: `max-width: 1200px; width: 85%`
- Fontes aumentadas para melhor aproveitamento do espaço horizontal
- Footer-signatures ajustado para modo paisagem
- Elementos reposicionados para melhor distribuição

### 6. Imagens Afetadas

- **ri_1.jpeg**: Usada como background do certificado
- **ri_2.png**: Logo acima do título do certificado

### 7. Testes

Criados scripts de teste:
- `scripts/test-imagens-pdf.js` - Para verificar a conversão de imagens
- `scripts/test-qr-code.js` - Para verificar a geração do QR code
- `scripts/test-template-size.js` - Para verificar o tamanho dos templates

## Como Testar

1. Execute os scripts de teste:
   ```bash
   node scripts/test-imagens-pdf.js
   node scripts/test-qr-code.js
   node scripts/test-template-size.js
   ```

2. Gere um certificado e verifique se as imagens aparecem no PDF

3. Teste o QR code escaneando-o e verificando se a página de validação funciona

4. Verifique se o PDF preenche toda a página sem bordas pretas

## Resultado Esperado

- A imagem `ri_2.png` (logo) deve aparecer no canto superior esquerdo do certificado
- O background `ri_1.jpeg` deve aparecer como fundo do certificado
- O QR code deve gerar uma URL válida que leva à página de verificação correta
- A verificação do certificado deve funcionar corretamente usando o ID do certificado específico
- O PDF deve preencher toda a página A4 em modo paisagem sem bordas pretas
- Todos os elementos devem estar bem posicionados e centralizados
- O layout deve aproveitar melhor o espaço horizontal disponível
- As fontes devem estar em tamanho adequado para o modo paisagem
