-- Verificar o tamanho máximo do campo reset_token
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
  AND column_name = 'reset_token';

-- Se o campo for muito pequeno, vamos aumentá-lo
ALTER TABLE usuarios 
ALTER COLUMN reset_token TYPE VARCHAR(255);

-- Verificar novamente
SELECT 
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
  AND column_name = 'reset_token';

-- Limpar todos os tokens
UPDATE usuarios 
SET reset_token = NULL, reset_token_expires = NULL;

-- Verificar se limpou
SELECT nome, email, reset_token FROM usuarios;
