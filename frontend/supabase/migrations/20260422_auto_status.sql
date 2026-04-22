-- Function to update property status based on active/future contracts
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

    -- Update property status for standard rentals
    -- For room rentals, the commercial_status 'disponible' or 'alquilado' usually applies to the whole property.
    -- If it's a room rental, we set it to 'alquilado' only if ALL rooms are occupied.
    -- But for simplicity and to follow user request of automation:
    
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
        -- Room rental logic: Update global status to 'alquilado' only if ALL rooms are taken
        DECLARE
            v_total_rooms int;
            v_occupied_rooms int;
        BEGIN
            -- Get total rooms from JSONB array length
            SELECT jsonb_array_length(rooms) INTO v_total_rooms 
            FROM public.properties 
            WHERE id = v_property_id;

            -- Count unique rooms with either active or future contracts
            SELECT count(DISTINCT room_id) INTO v_occupied_rooms
            FROM public.contracts
            WHERE property_id = v_property_id
              AND status = 'active'
              AND (
                  (start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE) -- Active
                  OR (start_date > CURRENT_DATE) -- Reserved
              );

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

-- Trigger
DROP TRIGGER IF EXISTS tr_update_property_status_on_contract ON public.contracts;
CREATE TRIGGER tr_update_property_status_on_contract
AFTER INSERT OR UPDATE OR DELETE ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.update_property_commercial_status_from_contracts();

-- Function to manually refresh all property statuses (useful to call from frontend or cron)
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
    FOR prop IN SELECT id, is_room_rental, operation, commercial_status FROM public.properties WHERE operation = 'alquiler' LOOP
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

                SELECT count(DISTINCT room_id) INTO v_occupied_rooms
                FROM public.contracts
                WHERE property_id = prop.id
                  AND status = 'active'
                  AND (
                      (start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE)
                      OR (start_date > CURRENT_DATE)
                  );

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

-- Schedule automatic refresh every day at 00:05 UTC
-- This ensures that "Future" contracts become "Active" automatically at midnight.
SELECT cron.schedule('refresh-property-statuses', '5 0 * * *', 'SELECT public.refresh_all_property_commercial_statuses()');
