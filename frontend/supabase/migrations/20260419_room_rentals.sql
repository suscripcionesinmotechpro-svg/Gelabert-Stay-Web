-- ══════════════════════════════════════════════════════════════════════════════
-- Migración: Gestión de Alquiler por Habitaciones
-- Descripción:
--   1. Añade la columna "room_id" a los contratos
--   2. Crea la función RPC "get_property_room_statuses"
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Añadir columna room_id a la tabla de contratos
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS room_id text;

-- 2. Crear función para consultar los estados de las habitaciones de una propiedad
--    Usa SECURITY DEFINER para que cualquier usuario (incluso anónimos) pueda consultarlo
CREATE OR REPLACE FUNCTION get_property_room_statuses(p_property_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  WITH contract_statuses AS (
    SELECT
      room_id,
      CASE
        WHEN start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE AND status = 'active' THEN 2 -- Alquilada
        WHEN start_date > CURRENT_DATE AND status = 'active' THEN 1 -- Reservada
        ELSE 0 -- Disponible (o contrato caducado)
      END as status_priority
    FROM contracts
    WHERE property_id = p_property_id AND room_id IS NOT NULL AND status != 'cancelled'
  ),
  room_status_max AS (
    SELECT room_id, MAX(status_priority) as highest_priority
    FROM contract_statuses
    GROUP BY room_id
  )
  SELECT COALESCE(json_agg(
    json_build_object(
      'room_id', room_id,
      'status', CASE highest_priority WHEN 2 THEN 'alquilada' WHEN 1 THEN 'reservada' ELSE 'disponible' END
    )
  ), '[]'::json) INTO result
  FROM room_status_max;

  RETURN COALESCE(result, '[]'::json);
END;
$$;
