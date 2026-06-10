-- ================================================================
--  Captaciones CRM Upgrade — Gelabert Homes
--  Run this in Supabase SQL Editor
-- ================================================================

-- 1. Nuevos campos en la tabla captaciones
ALTER TABLE captaciones 
  ADD COLUMN IF NOT EXISTS follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS operation TEXT DEFAULT 'alquiler',
  ADD COLUMN IF NOT EXISTS estimated_price NUMERIC;

-- Validaciones de los nuevos campos
ALTER TABLE captaciones 
  DROP CONSTRAINT IF EXISTS captaciones_priority_check,
  DROP CONSTRAINT IF EXISTS captaciones_operation_check;
  
ALTER TABLE captaciones 
  ADD CONSTRAINT captaciones_priority_check CHECK (priority IN ('alta', 'media', 'baja')),
  ADD CONSTRAINT captaciones_operation_check CHECK (operation IN ('venta', 'alquiler', 'traspaso'));

-- 2. Nuevo estado: contrato_en_proceso
-- (Primero drop el constraint viejo si existe, luego lo recreamos)
ALTER TABLE captaciones DROP CONSTRAINT IF EXISTS captaciones_status_check;
ALTER TABLE captaciones ADD CONSTRAINT captaciones_status_check 
  CHECK (status IN (
    'pendiente_contacto',
    'seguimiento',
    'visita_planificada',
    'captado',
    'contrato_en_proceso',
    'rechazado'
  ));

-- 3. Tabla para registrar las alertas de email ya enviadas (evitar duplicados)
CREATE TABLE IF NOT EXISTS captaciones_alerts_sent (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  captacion_id UUID REFERENCES captaciones(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  -- alert_type examples: 'follow_up_3d', 'follow_up_1d', 'follow_up_today',
  --                      'visit_3d', 'visit_1d', 'visit_today'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(captacion_id, alert_type)
);

-- 4. Tabla de historial de actividad por captación
CREATE TABLE IF NOT EXISTS captaciones_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  captacion_id UUID REFERENCES captaciones(id) ON DELETE CASCADE,
  agent_name TEXT,
  action TEXT NOT NULL,
  -- actions: 'created', 'status_changed', 'note_added', 'follow_up_set',
  --           'visit_scheduled', 'agent_assigned', 'field_updated'
  old_value TEXT,
  new_value TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Habilitar Realtime en la tabla de historial
ALTER PUBLICATION supabase_realtime ADD TABLE captaciones_history;

-- 6. RLS para captaciones_history (solo users autenticados)
ALTER TABLE captaciones_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Authenticated can read history"
  ON captaciones_history FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated can insert history"
  ON captaciones_history FOR INSERT TO authenticated WITH CHECK (true);

-- 7. RLS para captaciones_alerts_sent (solo service role lo escribe, autenticados leen)
ALTER TABLE captaciones_alerts_sent ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Authenticated can read alerts sent"
  ON captaciones_alerts_sent FOR SELECT TO authenticated USING (true);

-- Done!
SELECT 'Captaciones upgrade migration applied successfully.' AS result;
