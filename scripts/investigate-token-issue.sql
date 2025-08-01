-- Verificar se existem tokens no banco
SELECT 
  id,
  nome,
  email,
  reset_token,
  LENGTH(reset_token) as token_length,
  reset_token_expires,
  primeiro_login
FROM usuarios 
WHERE reset_token IS NOT NULL;

-- Verificar se o token específico existe (substitua pelo token real)
SELECT 
  id,
  nome,
  email,
  reset_token,
  reset_token_expires,
  CASE 
    WHEN reset_token = 'e1285accd13758c37ec76477325b68b06fab0eee25d80d2a18f8d6ddf5890174' THEN 'MATCH'
    ELSE 'NO MATCH'
  END as token_match
FROM usuarios 
WHERE reset_token IS NOT NULL;

-- Verificar todos os usuários e seus tokens
SELECT 
  nome,
  email,
  COALESCE(reset_token, 'NULL') as reset_token,
  COALESCE(reset_token_expires::text, 'NULL') as expires,
  primeiro_login
FROM usuarios
ORDER BY created_at DESC;

-- Verificar se há problemas de encoding ou espaços
SELECT 
  nome,
  email,
  LENGTH(TRIM(reset_token)) as trimmed_length,
  LENGTH(reset_token) as original_length,
  reset_token = TRIM(reset_token) as no_spaces
FROM usuarios 
WHERE reset_token IS NOT NULL;
