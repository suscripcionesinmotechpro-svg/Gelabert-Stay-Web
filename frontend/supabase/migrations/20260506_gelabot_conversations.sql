-- Tabla para almacenar el historial de conversaciones de GelaBot
CREATE TABLE IF NOT EXISTS gelabot_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT UNIQUE NOT NULL, -- Puede ser un ID anónimo o el email del usuario
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE gelabot_conversations ENABLE ROW LEVEL SECURITY;

-- Política para permitir que las Edge Functions (service role) gestionen todo
CREATE POLICY "Service role full access" ON gelabot_conversations
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gelabot_conversations_updated_at
    BEFORE UPDATE ON gelabot_conversations
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
