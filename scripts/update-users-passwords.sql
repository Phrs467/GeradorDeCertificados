-- Atualizar as senhas dos usuários com valores em texto simples para teste
-- Em produção, você deve usar bcrypt adequadamente

UPDATE usuarios SET senha = '123456' WHERE email = 'admin@ownltech.com';
UPDATE usuarios SET senha = '123456' WHERE email = 'joao@empresa.com';
UPDATE usuarios SET senha = '123456' WHERE email = 'maria@empresa.com';
UPDATE usuarios SET senha = '123456' WHERE email = 'pedro@empresa.com';

-- Verificar se as senhas foram atualizadas
SELECT nome, email, senha, chave_de_acesso FROM usuarios;
