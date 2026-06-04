-- ══════════════════════════════════════════════════════════════════════════════
-- Migración: Soporte para estados manuales de habitaciones en el cálculo de disponibilidad
-- Descripción:
--   1. Actualiza update_property_commercial_status_from_contracts para contar habitaciones con estados manuales
--   2. Actualiza refresh_all_property_commercial_statuses para incluir el mismo cálculo de habitaciones manuales
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Actualizar la función trigger para contratos
CREATE OR REPLACE FUNCTION public.update_property_commercial_status_from_contracts()
RETURNS TRIGGER AS $$
DECLARE
    v_property_id uuid;
    v_active_count int;
    v_future_count int;
    v_is_room_rental boolean;
BEGIN
    -- Determine which property to update
    IF (TG_OP = 'DELETE') THEN
        v_property_id := OLD.property_id;
    ELSE
        v_property_id := NEW.property_id;
    END IF;

    IF v_property_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Check if it's room rental
    SELECT is_room_rental INTO v_is_room_rental FROM public.properties WHERE id = v_property_id;

    -- Count active contracts (today is between start and end)
    SELECT count(*) INTO v_active_count
    FROM public.contracts
    WHERE property_id = v_property_id
      AND status = 'active'
      AND start_date <= CURRENT_DATE
      AND end_date >= CURRENT_DATE;

    -- Count future contracts
    SELECT count(*) INTO v_future_count
    FROM public.contracts
    WHERE property_id = v_property_id
      AND status = 'active'
      AND start_date > CURRENT_DATE;

    -- Reset the manual override flag since a contract change occurred
    UPDATE public.properties SET is_manual_commercial_status = false WHERE id = v_property_id;

    IF NOT v_is_room_rental THEN
        -- Standard rental logic
        IF v_active_count > 0 THEN
            UPDATE public.properties SET commercial_status = 'alquilado' WHERE id = v_property_id;
        ELSIF v_future_count > 0 THEN
            UPDATE public.properties SET commercial_status = 'reservado' WHERE id = v_property_id;
        ELSE
            UPDATE public.properties SET commercial_status = 'disponible' WHERE id = v_property_id;
        END IF;
    ELSE
        -- Room rental logic: Update global status to 'alquilado' only if ALL rooms are taken (contract or manual status)
        DECLARE
            v_total_rooms int;
            v_occupied_rooms int;
        BEGIN
            -- Get total rooms from JSONB array length
            SELECT jsonb_array_length(rooms) INTO v_total_rooms 
            FROM public.properties 
            WHERE id = v_property_id;

            -- Count unique rooms with either active/future contracts OR manual status 'reservado' / 'alquilado'
            SELECT count(DISTINCT r_id) INTO v_occupied_rooms
            FROM (
                -- Rooms occupied via contracts
                SELECT room_id as r_id
                FROM public.contracts
                WHERE property_id = v_property_id
                  AND status = 'active'
                  AND (
                      (start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE) -- Active
                      OR (start_date > CURRENT_DATE) -- Reserved
                  )
                UNION
                -- Rooms occupied manually
                SELECT x.id as r_id
                FROM jsonb_to_recordset(
                    COALESCE((SELECT rooms FROM public.properties WHERE id = v_property_id), '[]'::jsonb)
                ) as x(id text, status text)
                WHERE x.status = 'reservado' OR x.status = 'alquilado'
            ) occupied;

            IF v_total_rooms > 0 AND v_occupied_rooms >= v_total_rooms THEN
                UPDATE public.properties SET commercial_status = 'alquilado' WHERE id = v_property_id;
            ELSE
                -- Still has availability
                UPDATE public.properties SET commercial_status = 'disponible' WHERE id = v_property_id;
            END IF;
        END;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Actualizar la función cron de sincronización de estados
CREATE OR REPLACE FUNCTION public.refresh_all_property_commercial_statuses()
RETURNS json AS $$
DECLARE
    prop RECORD;
    v_active_count int;
    v_future_count int;
    v_updated_count int := 0;
    v_old_status text;
    v_new_status text;
BEGIN
    FOR prop IN SELECT id, is_room_rental, operation, commercial_status FROM public.properties 
    WHERE operation = 'alquiler' AND is_manual_commercial_status = false LOOP
        v_old_status := prop.commercial_status;
        v_new_status := v_old_status;

        -- Logic for standard rentals
        IF NOT prop.is_room_rental THEN
            -- Count active contracts
            SELECT count(*) INTO v_active_count
            FROM public.contracts
            WHERE property_id = prop.id
              AND status = 'active'
              AND start_date <= CURRENT_DATE
              AND end_date >= CURRENT_DATE;

            -- Count future contracts
            SELECT count(*) INTO v_future_count
            FROM public.contracts
            WHERE property_id = prop.id
              AND status = 'active'
              AND start_date > CURRENT_DATE;

            IF v_active_count > 0 THEN
                v_new_status := 'alquilado';
            ELSIF v_future_count > 0 THEN
                v_new_status := 'reservado';
            ELSE
                v_new_status := 'disponible';
            END IF;
        ELSE
            -- Logic for room rentals
            DECLARE
                v_total_rooms int;
                v_occupied_rooms int;
            BEGIN
                SELECT jsonb_array_length(rooms) INTO v_total_rooms 
                FROM public.properties 
                WHERE id = prop.id;

                -- Count occupied rooms combining active/future contracts AND manual overrides
                SELECT count(DISTINCT r_id) INTO v_occupied_rooms
                FROM (
                    -- Rooms occupied via contracts
                    SELECT room_id as r_id
                    FROM public.contracts
                    WHERE property_id = prop.id
                      AND status = 'active'
                      AND (
                          (start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE)
                          OR (start_date > CURRENT_DATE)
                      )
                    UNION
                    -- Rooms occupied manually
                    SELECT x.id as r_id
                    FROM jsonb_to_recordset(
                        COALESCE((SELECT rooms FROM public.properties WHERE id = prop.id), '[]'::jsonb)
                    ) as x(id text, status text)
                    WHERE x.status = 'reservado' OR x.status = 'alquilado'
                ) occupied;

                IF v_total_rooms > 0 AND v_occupied_rooms >= v_total_rooms THEN
                    v_new_status := 'alquilado';
                ELSE
                    v_new_status := 'disponible';
                END IF;
            END;
        END IF;

        -- Update only if changed
        IF v_new_status IS DISTINCT FROM v_old_status THEN
            UPDATE public.properties SET commercial_status = v_new_status WHERE id = prop.id;
            v_updated_count := v_updated_count + 1;
        END IF;
    END LOOP;

    RETURN json_build_object('updated', v_updated_count);
END;
$$ LANGUAGE plpgsql;
