-- Verificar os dados existentes na tabela usuarios
SELECT id, nome, email, senha, chave_de_acesso 
FROM usuarios;

-- Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'usuarios';
