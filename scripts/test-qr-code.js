const QRCode = require('qrcode')

// Simula a geração de QR code como no dashboard
async function testarQRCode() {
  console.log('🧪 Testando geração de QR Code...')
  
  // Simula diferentes IDs
  const ids = ['55d3d576', 'teste123', 'abc123']
  
  for (const id of ids) {
    try {
      const urlVerificacao = `http://localhost:3000/id/${id}`
      console.log(`🔗 URL de verificação para ID "${id}":`, urlVerificacao)
      
      const qrCodeDataURL = await QRCode.toDataURL(urlVerificacao)
      console.log(`✅ QR Code gerado com sucesso para ID "${id}"`)
      console.log(`📏 Tamanho do QR Code: ${qrCodeDataURL.length} caracteres`)
      console.log(`🔗 URL no QR Code: ${urlVerificacao}`)
      console.log('---')
    } catch (error) {
      console.error(`❌ Erro ao gerar QR Code para ID "${id}":`, error)
    }
  }
  
  console.log('🎉 Teste concluído!')
}

testarQRCode()



