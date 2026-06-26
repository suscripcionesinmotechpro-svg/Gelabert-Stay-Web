-- =============================================================================
-- Migration: Auto-sync commercial_status for room rental properties
-- Date: 2026-06-26
-- Logic:
--   - Only applies to is_room_rental = true AND is_manual_commercial_status != true
--   - If any room is 'disponible' → 'disponible'
--   - If all rooms are 'alquilado' or 'reservado':
--       - alquiladas >= reservadas → 'alquilado'
--       - reservadas > alquiladas  → 'reservado'
-- =============================================================================

-- 1. Function
CREATE OR REPLACE FUNCTION sync_room_rental_commercial_status()
RETURNS TRIGGER AS $$
DECLARE
  total_rooms   INT;
  alquiladas    INT;
  reservadas    INT;
  disponibles   INT;
  new_status    TEXT;
BEGIN
  -- Solo aplica a pisos gestionados por habitaciones con estado no manual
  IF NEW.is_room_rental = TRUE AND (NEW.is_manual_commercial_status IS DISTINCT FROM TRUE) THEN

    -- Contar habitaciones por estado desde el array JSONB
    SELECT
      COUNT(*) FILTER (WHERE (room->>'status') = 'alquilado'),
      COUNT(*) FILTER (WHERE (room->>'status') = 'reservado'),
      COUNT(*) FILTER (WHERE (room->>'status') NOT IN ('alquilado', 'reservado'))
    INTO alquiladas, reservadas, disponibles
    FROM jsonb_array_elements(COALESCE(NEW.rooms, '[]'::jsonb)) AS room;

    total_rooms := alquiladas + reservadas + disponibles;

    -- Si no hay habitaciones definidas, no tocamos el estado
    IF total_rooms = 0 THEN
      RETURN NEW;
    END IF;

    -- Lógica de estado
    IF disponibles > 0 THEN
      new_status := 'disponible';
    ELSIF alquiladas >= reservadas THEN
      new_status := 'alquilado';
    ELSE
      new_status := 'reservado';
    END IF;

    NEW.commercial_status := new_status;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger (fires on INSERT or UPDATE of relevant columns)
DROP TRIGGER IF EXISTS trg_sync_room_rental_status ON properties;

CREATE TRIGGER trg_sync_room_rental_status
  BEFORE INSERT OR UPDATE OF rooms, is_room_rental, is_manual_commercial_status
  ON properties
  FOR EACH ROW
  EXECUTE FUNCTION sync_room_rental_commercial_status();

-- 3. Backfill existing records
UPDATE properties AS p
SET commercial_status = CASE
  WHEN disponibles > 0 THEN 'disponible'
  WHEN alquiladas >= reservadas THEN 'alquilado'
  ELSE 'reservado'
END
FROM (
  SELECT
    id,
    COUNT(*) FILTER (WHERE (room->>'status') = 'alquilado') AS alquiladas,
    COUNT(*) FILTER (WHERE (room->>'status') = 'reservado') AS reservadas,
    COUNT(*) FILTER (WHERE (room->>'status') NOT IN ('alquilado', 'reservado')) AS disponibles
  FROM properties,
    jsonb_array_elements(COALESCE(rooms, '[]'::jsonb)) AS room
  WHERE is_room_rental = true
    AND (is_manual_commercial_status IS DISTINCT FROM TRUE)
  GROUP BY id
) AS conteos
WHERE p.id = conteos.id
  AND conteos.alquiladas + conteos.reservadas + conteos.disponibles > 0;
