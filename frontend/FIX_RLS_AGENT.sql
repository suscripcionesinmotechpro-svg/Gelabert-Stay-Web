-- =========================================================================
-- PARCHE DE SEGURIDAD SUPABASE - GELABERT HOMES
-- RESOLUCIÓN DE ERROR RLS AL PUBLICAR PROPIEDADES POR AGENTES
-- =========================================================================
-- Este parche actualiza la función del trigger 'set_reference' para:
-- 1. Asignar automáticamente el agent_id al usuario autenticado actual en INSERT si viene vacío.
-- 2. Proteger el agent_id en UPDATE para evitar modificaciones accidentales o maliciosas.
--
-- Ejecuta este script en el editor SQL de tu panel de Supabase si necesitas reinstalarlo.

CREATE OR REPLACE FUNCTION public.set_reference()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Auto-generar la referencia si es nula o vacía
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := 'GH-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
  END IF;

  -- 2. Auto-asignar el agent_id en INSERT si viene nulo (ej. desde el cliente)
  IF TG_OP = 'INSERT' AND NEW.agent_id IS NULL THEN
    NEW.agent_id := auth.uid();
  END IF;

  -- 3. Proteger el agent_id en UPDATE (evita que un agente cambie el propietario o lo ponga a NULL)
  IF TG_OP = 'UPDATE' THEN
    IF public.get_user_role() = 'agent' THEN
      NEW.agent_id := OLD.agent_id; -- Forza a mantener el agente original
    ELSIF NEW.agent_id IS NULL THEN
      NEW.agent_id := OLD.agent_id; -- Para administradores, conserva el anterior si se envía NULL
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
