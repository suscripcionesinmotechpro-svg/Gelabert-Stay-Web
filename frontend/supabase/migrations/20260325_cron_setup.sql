-- ═══════════════════════════════════════════════════════════════
--  GELABERT HOMES — Configurar PG_CRON para Alertas Diarias
--  Pega TODO esto en el SQL Editor de Supabase y pulsa Run
-- ═══════════════════════════════════════════════════════════════

-- Asegúrate de que pg_cron está habilitado en tu base de datos
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Elimina el cron job si ya existiera (para actualizarlo de cero)
SELECT cron.unschedule('daily_contract_alerts');

-- Programa la ejecución todos los días a las 08:00 AM UTC
SELECT cron.schedule(
  'daily_contract_alerts', -- nombre del job
  '0 8 * * *',           -- expresión cron (A las 08:00 cada día)
  $$
    select net.http_post(
      url:='https://dthqfswyvwuamcdprmze.supabase.co/functions/v1/check-expiring-contracts',
      headers:='{"Authorization": "Bearer MI_SECRETO_CRON_O_CLAVE_ANONIMA"}'::jsonb
    );
  $$
);

-- Nota: Reemplaza "dthqfswyvwuamcdprmze.supabase.co" con TU URL de proyecto (que está en Ajustes > API)
-- y "MI_SECRETO_CRON_O_CLAVE_ANONIMA" con tu ANON KEY para que funcione la petición.
