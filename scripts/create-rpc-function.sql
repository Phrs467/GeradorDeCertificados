-- Criar função RPC para update de token (caso seja necessário)
CREATE OR REPLACE FUNCTION update_reset_token(
  user_email TEXT,
  new_token TEXT,
  expires_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE usuarios 
  SET 
    reset_token = new_token,
    reset_token_expires = expires_at
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$;

-- Dar permissão para usar a função
GRANT EXECUTE ON FUNCTION update_reset_token TO anon, authenticated;
