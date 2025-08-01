-- Criar tabela de usuários
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  chave_de_acesso DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir usuário de exemplo (senha: 123456)
INSERT INTO usuarios (nome, email, senha, chave_de_acesso) VALUES 
('Admin', 'admin@ownltech.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', '2024-12-31'),
('João Silva', 'joao@empresa.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', '2024-06-30');

-- Habilitar RLS (Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura dos usuários
CREATE POLICY "Permitir leitura de usuários" ON usuarios
FOR SELECT USING (true);
