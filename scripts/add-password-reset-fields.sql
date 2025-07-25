-- Adicionar campos para controle de primeiro login e reset de senha
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS primeiro_login BOOLEAN DEFAULT true;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;

-- Atualizar usuários existentes para marcar como primeiro login
UPDATE usuarios SET primeiro_login = true WHERE primeiro_login IS NULL;

-- Verificar a estrutura atualizada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- Mostrar usuários com status de primeiro login
SELECT nome, email, primeiro_login, reset_token IS NOT NULL as tem_token_reset
FROM usuarios;
