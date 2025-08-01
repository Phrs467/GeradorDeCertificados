-- Testar com o token específico que está falhando
-- Substitua pelo token real que está aparecendo no debug

-- 1. Verificar se existe algum token no banco
SELECT 
  'Tokens existentes' as tipo,
  COUNT(*) as quantidade
FROM usuarios 
WHERE reset_token IS NOT NULL;

-- 2. Mostrar todos os tokens ativos
SELECT 
  'Todos os tokens' as info,
  nome,
  email,
  reset_token,
  LENGTH(reset_token) as tamanho,
  reset_token_expires
FROM usuarios 
WHERE reset_token IS NOT NULL;

-- 3. Testar busca pelo token específico (substitua pelo token real)
SELECT 
  'Busca específica' as info,
  nome,
  email,
  reset_token,
  CASE 
    WHEN reset_token = 'e11016bd91540906102c35a5554512da88ec9399bfc2d22931925a9630ee27f8' THEN 'ENCONTRADO'
    ELSE 'NÃO ENCONTRADO'
  END as resultado
FROM usuarios 
WHERE reset_token = 'e11016bd91540906102c35a5554512da88ec9399bfc2d22931925a9630ee27f8';

-- 4. Verificar se há diferenças de case ou espaços
SELECT 
  'Verificação de encoding' as info,
  nome,
  email,
  LOWER(reset_token) as token_lower,
  UPPER(reset_token) as token_upper,
  TRIM(reset_token) as token_trimmed,
  LENGTH(TRIM(reset_token)) as tamanho_trimmed
FROM usuarios 
WHERE reset_token IS NOT NULL;

-- 5. Inserir um token de teste manualmente para verificar se a busca funciona
INSERT INTO usuarios (nome, email, senha, chave_de_acesso, reset_token, reset_token_expires, primeiro_login)
VALUES (
  'Teste Token',
  'teste.token@test.com',
  '123456',
  '2024-12-31',
  'e11016bd91540906102c35a5554512da88ec9399bfc2d22931925a9630ee27f8',
  NOW() + INTERVAL '24 hours',
  true
)
ON CONFLICT (email) DO UPDATE SET
  reset_token = 'e11016bd91540906102c35a5554512da88ec9399bfc2d22931925a9630ee27f8',
  reset_token_expires = NOW() + INTERVAL '24 hours';

-- 6. Testar busca após inserção manual
SELECT 
  'Após inserção manual' as info,
  nome,
  email,
  reset_token,
  CASE 
    WHEN reset_token = 'e11016bd91540906102c35a5554512da88ec9399bfc2d22931925a9630ee27f8' THEN 'ENCONTRADO'
    ELSE 'NÃO ENCONTRADO'
  END as resultado
FROM usuarios 
WHERE reset_token = 'e11016bd91540906102c35a5554512da88ec9399bfc2d22931925a9630ee27f8';
