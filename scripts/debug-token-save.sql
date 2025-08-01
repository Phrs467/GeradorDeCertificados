-- Verificar estrutura da tabela usuarios
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- Verificar se há constraints ou triggers que podem estar interferindo
SELECT 
  constraint_name,
  constraint_type,
  table_name,
  column_name
FROM information_schema.constraint_column_usage 
WHERE table_name = 'usuarios';

-- Limpar todos os dados de reset
UPDATE usuarios 
SET reset_token = NULL, reset_token_expires = NULL;

-- Teste manual de inserção de token
UPDATE usuarios 
SET reset_token = 'teste123456789', reset_token_expires = NOW() + INTERVAL '1 hour'
WHERE email = 'admin@ownltech.com';

-- Verificar se o teste manual funcionou
SELECT 
  nome,
  email,
  reset_token,
  reset_token_expires,
  LENGTH(reset_token) as token_length
FROM usuarios 
WHERE email = 'admin@ownltech.com';
