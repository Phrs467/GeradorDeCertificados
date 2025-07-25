-- Script para verificar tokens no banco de dados
SELECT 
  id,
  nome,
  email,
  reset_token,
  reset_token_expires,
  primeiro_login,
  created_at
FROM usuarios 
WHERE reset_token IS NOT NULL
ORDER BY created_at DESC;

-- Verificar se há tokens expirados
SELECT 
  nome,
  email,
  reset_token_expires,
  CASE 
    WHEN reset_token_expires < NOW() THEN 'EXPIRADO'
    ELSE 'VÁLIDO'
  END as status
FROM usuarios 
WHERE reset_token IS NOT NULL;

-- Limpar tokens expirados (opcional)
-- UPDATE usuarios 
-- SET reset_token = NULL, reset_token_expires = NULL 
-- WHERE reset_token_expires < NOW();
