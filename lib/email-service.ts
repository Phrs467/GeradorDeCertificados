// Serviço de templates de email
export function generatePasswordResetEmail(nome: string, resetLink: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Alterar Senha - Owl Tech</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6; 
          color: #333; 
          background-color: #f4f4f4; 
          padding: 20px;
        }
        
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: white; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
        }
        
        .header { 
          background: linear-gradient(135deg, #06459a 0%, #0856b3 100%);
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        
        .header h1 { 
          font-size: 28px; 
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .header p {
          font-size: 16px;
          opacity: 0.9;
        }
        
        .content { 
          padding: 40px 30px; 
        }
        
        .content h2 { 
          color: #06459a; 
          font-size: 24px;
          margin-bottom: 20px;
          font-weight: 600;
        }
        
        .content p {
          margin-bottom: 16px;
          font-size: 16px;
          line-height: 1.6;
        }
        
        .button-container {
          text-align: center;
          margin: 35px 0;
        }
        
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #06459a 0%, #0856b3 100%);
          color: white !important; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s ease;
        }
        
        .button:hover {
          transform: translateY(-2px);
        }
        
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          color: #856404;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }
        
        .warning strong {
          display: block;
          margin-bottom: 8px;
        }
        
        .link-backup {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
          word-break: break-all;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          line-height: 1.4;
        }
        
        .footer { 
          text-align: center; 
          padding: 30px; 
          background-color: #f8f9fa; 
          font-size: 14px; 
          color: #6c757d; 
          border-top: 1px solid #e9ecef;
        }
        
        .footer p {
          margin-bottom: 8px;
        }
        
        .security-info {
          background-color: #e7f3ff;
          border-left: 4px solid #06459a;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }
        
        .notice {
          background-color: #f0f9ff;
          border: 1px solid #0ea5e9;
          color: #0c4a6e;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          font-size: 14px;
        }
        
        @media (max-width: 600px) {
          .email-container {
            margin: 10px;
            border-radius: 8px;
          }
          
          .header {
            padding: 30px 20px;
          }
          
          .content {
            padding: 30px 20px;
          }
          
          .header h1 {
            font-size: 24px;
          }
          
          .button {
            padding: 14px 28px;
            font-size: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🔐 Owl Tech</h1>
          <p>Sistema de Certificados</p>
        </div>
        
        <div class="content">
          <h2>Olá, ${nome}!</h2>
          
          <p>Você precisa alterar sua senha para continuar usando o sistema.</p>
          
          <p>Este é seu <strong>primeiro acesso</strong>, por isso é necessário definir uma senha personalizada e segura.</p>
          
          <div class="button-container">
            <a href="${resetLink}" class="button">🔑 Alterar Minha Senha</a>
          </div>
          
          <div class="warning">
            <strong>⏰ Importante:</strong>
            Este link expira em 24 horas por motivos de segurança. Não compartilhe este link com ninguém.
          </div>
          
          <div class="security-info">
            <strong>🛡️ Dicas de Segurança:</strong>
            <ul style="margin-top: 10px; padding-left: 20px;">
              <li>Use uma senha forte com pelo menos 8 caracteres</li>
              <li>Inclua letras maiúsculas, minúsculas, números e símbolos</li>
              <li>Não reutilize senhas de outros sistemas</li>
            </ul>
          </div>
          
          <p><strong>Caso o botão não funcione, copie e cole o link abaixo no seu navegador:</strong></p>
          <div class="link-backup">
            ${resetLink}
          </div>
          
          <div class="notice">
            <strong>📧 Nota:</strong> Este email foi enviado através do serviço Owl Tech. Se você não solicitou esta alteração ou tem dúvidas, entre em contato com o suporte técnico.
          </div>
        </div>
        
        <div class="footer">
          <p><strong>© 2023 Owl Tech</strong></p>
          <p>Todos os direitos reservados</p>
          <p>Este é um email automático, não responda a esta mensagem</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Template para email de confirmação de alteração de senha
export function generatePasswordChangedEmail(nome: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Senha Alterada - Ownl Tech</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6; 
          color: #333; 
          background-color: #f4f4f4; 
          padding: 20px;
        }
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: white; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
        }
        .header { 
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .content { 
          padding: 40px 30px; 
        }
        .content h2 {
          color: #28a745;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .content p {
          margin-bottom: 16px;
          font-size: 16px;
        }
        .success-info {
          background-color: #d4edda;
          border-left: 4px solid #28a745;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .footer { 
          text-align: center; 
          padding: 30px; 
          background-color: #f8f9fa; 
          font-size: 14px; 
          color: #6c757d; 
          border-top: 1px solid #e9ecef;
        }
        .footer p {
          margin-bottom: 8px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>✅ Senha Alterada</h1>
          <p>Ownl Tech - Sistema de Certificados</p>
        </div>
        <div class="content">
          <h2>Olá, ${nome}!</h2>
          <p>Sua senha foi alterada com sucesso em <strong>${new Date().toLocaleString("pt-BR")}</strong>.</p>
          
          <div class="success-info">
            <strong>🔐 Alteração Confirmada</strong>
            <p style="margin-top: 10px; margin-bottom: 0;">Sua conta agora está protegida com a nova senha que você definiu.</p>
          </div>
          
          <p>Se você não fez esta alteração, entre em contato com o suporte imediatamente.</p>
          
          <p><strong>Próximos passos:</strong></p>
          <ul style="padding-left: 20px; margin-bottom: 20px;">
            <li>Faça login com sua nova senha</li>
            <li>Mantenha sua senha segura e confidencial</li>
            <li>Não compartilhe suas credenciais com terceiros</li>
          </ul>
        </div>
        <div class="footer">
          <p><strong>© 2024 Ownl Tech</strong></p>
          <p>Todos os direitos reservados</p>
          <p>Este é um email automático, não responda a esta mensagem</p>
        </div>
      </div>
    </body>
    </html>
  `
}
