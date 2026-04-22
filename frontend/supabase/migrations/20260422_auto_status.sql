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
        IF v_active_count > 0 THEN
            UPDATE public.properties SET commercial_status = 'alquilado' WHERE id = v_property_id;
        ELSIF v_future_count > 0 THEN
            UPDATE public.properties SET commercial_status = 'reservado' WHERE id = v_property_id;
        ELSE
            UPDATE public.properties SET commercial_status = 'disponible' WHERE id = v_property_id;
        END IF;
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
RETURNS void AS $$
DECLARE
    prop RECORD;
    v_active_count int;
    v_future_count int;
BEGIN
    FOR prop IN SELECT id, is_room_rental, operation FROM public.properties WHERE operation = 'alquiler' LOOP
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

        IF NOT prop.is_room_rental THEN
            IF v_active_count > 0 THEN
                UPDATE public.properties SET commercial_status = 'alquilado' WHERE id = prop.id;
            ELSIF v_future_count > 0 THEN
                UPDATE public.properties SET commercial_status = 'reservado' WHERE id = prop.id;
            ELSE
                UPDATE public.properties SET commercial_status = 'disponible' WHERE id = prop.id;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
