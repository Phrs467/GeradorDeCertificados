-- Limpar TODOS os tokens para começar do zero
UPDATE usuarios 
SET reset_token = NULL, reset_token_expires = NULL 
WHERE reset_token IS NOT NULL;

-- Remover usuário de teste se existir
DELETE FROM usuarios WHERE email = 'teste.token@test.com';

-- Verificar se limpou tudo
SELECT 
  nome,
  email,
  reset_token,
  reset_token_expires
FROM usuarios;
