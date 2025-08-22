const { readFileSync } = require('fs')
const { join } = require('path')

// Função para converter imagem para base64
function converterImagemParaBase64(caminhoImagem) {
  try {
    const imagemBuffer = readFileSync(caminhoImagem)
    const base64 = imagemBuffer.toString('base64')
    const extensao = caminhoImagem.split('.').pop()?.toLowerCase()
    return `data:image/${extensao};base64,${base64}`
  } catch (error) {
    console.error('Erro ao converter imagem para base64:', error)
    return ''
  }
}

// Testa a conversão das imagens
console.log('🧪 Testando conversão de imagens para base64...')

const caminhoImagem1 = join(process.cwd(), 'imgs', 'ri_1.jpeg')
const caminhoImagem2 = join(process.cwd(), 'imgs', 'ri_2.png')

console.log('📁 Caminho da imagem 1:', caminhoImagem1)
console.log('📁 Caminho da imagem 2:', caminhoImagem2)

const imagem1Base64 = converterImagemParaBase64(caminhoImagem1)
const imagem2Base64 = converterImagemParaBase64(caminhoImagem2)

console.log('✅ Imagem 1 convertida:', imagem1Base64 ? 'SUCESSO' : 'FALHA')
console.log('✅ Imagem 2 convertida:', imagem2Base64 ? 'SUCESSO' : 'FALHA')

if (imagem1Base64) {
  console.log('📏 Tamanho da imagem 1 (base64):', imagem1Base64.length, 'caracteres')
}
if (imagem2Base64) {
  console.log('📏 Tamanho da imagem 2 (base64):', imagem2Base64.length, 'caracteres')
}

// Testa a substituição no template
const templateFrente = readFileSync(join(process.cwd(), 'public', 'template-frente.html'), 'utf-8')

const templateComImagens = templateFrente
  .replace(
    "background: url('../imgs/ri_1.jpeg') no-repeat center center;",
    `background: url('${imagem1Base64}') no-repeat center center;`
  )
  .replace(
    'src="../imgs/ri_2.png"',
    `src="${imagem2Base64}"`
  )

console.log('✅ Template processado com sucesso')
console.log('🔍 Template contém imagem 1 (base64):', templateComImagens.includes(imagem1Base64.substring(0, 50)))
console.log('🔍 Template contém imagem 2 (base64):', templateComImagens.includes(imagem2Base64.substring(0, 50)))

console.log('🎉 Teste concluído!')
