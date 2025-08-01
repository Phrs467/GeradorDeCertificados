-- Limpar todos os tokens antigos primeiro
UPDATE usuarios 
SET reset_token = NULL, reset_token_expires = NULL 
WHERE reset_token IS NOT NULL;

-- Verificar se limpou
SELECT 
  nome,
  email,
  reset_token,
  reset_token_expires,
  primeiro_login
FROM usuarios;

-- Mostrar estrutura da tabela para verificar tipos de dados
SELECT 
  column_name, 
  data_type, 
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
  AND column_name IN ('reset_token', 'reset_token_expires')
ORDER BY ordinal_position;
