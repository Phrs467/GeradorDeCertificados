-- Verificar se RLS (Row Level Security) está bloqueando updates
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'usuarios';

-- Verificar políticas RLS que podem estar bloqueando
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'usuarios';

-- Desabilitar RLS temporariamente para teste
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- Teste direto de update
UPDATE usuarios 
SET reset_token = 'teste_manual_123', reset_token_expires = NOW() + INTERVAL '1 hour'
WHERE email = 'admin@ownltech.com';

-- Verificar se funcionou
SELECT nome, email, reset_token, reset_token_expires 
FROM usuarios 
WHERE email = 'admin@ownltech.com';

-- Reabilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Criar política mais permissiva para updates se necessário
DROP POLICY IF EXISTS "Permitir update de reset_token" ON usuarios;
CREATE POLICY "Permitir update de reset_token" ON usuarios
FOR UPDATE USING (true)
WITH CHECK (true);
