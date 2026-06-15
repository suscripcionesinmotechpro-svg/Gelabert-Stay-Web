-- Migration: Add community_features and room air_conditioning
-- Date: 2026-06-16

-- 1. Add community_features column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS community_features jsonb DEFAULT '{}'::jsonb;

-- 2. Update update_property_commercial_status_from_contracts function to include room air_conditioning
CREATE OR REPLACE FUNCTION public.update_property_commercial_status_from_contracts()
RETURNS TRIGGER AS $$
DECLARE
    v_property_id uuid;
    v_active_count int;
    v_future_count int;
    v_is_room_rental boolean;
    v_updated_rooms jsonb;
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
            -- Get the end_date of the latest ending active contract
            DECLARE
                v_end_date date;
            BEGIN
                SELECT MAX(end_date) INTO v_end_date
                FROM public.contracts
                WHERE property_id = v_property_id
                  AND status = 'active'
                  AND start_date <= CURRENT_DATE
                  AND end_date >= CURRENT_DATE;

                UPDATE public.properties 
                SET commercial_status = 'alquilado',
                    availability = v_end_date::text
                WHERE id = v_property_id;
            END;
        ELSIF v_future_count > 0 THEN
            UPDATE public.properties 
            SET commercial_status = 'reservado',
                availability = NULL
            WHERE id = v_property_id;
        ELSE
            UPDATE public.properties 
            SET commercial_status = 'disponible',
                availability = NULL
            WHERE id = v_property_id;
        END IF;
    ELSE
        -- Room rental logic: Update rooms array with active contract availability
        -- Rebuild rooms array checking for active contracts
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', r.id,
            'name', r.name,
            'images', r.images,
            'video', r.video,
            'price', r.price,
            'private_bathroom', r.private_bathroom,
            'private_terrace', r.private_terrace,
            'is_exterior', r.is_exterior,
            'air_conditioning', r.air_conditioning,
            'status', CASE 
              WHEN r.active_contract_id IS NOT NULL THEN 'alquilado'
              ELSE COALESCE(r.manual_status, 'disponible')
            END,
            'availability', CASE
              WHEN r.active_contract_id IS NOT NULL THEN r.contract_end_date::text
              ELSE r.manual_availability
            END
          )
        ), '[]'::jsonb) INTO v_updated_rooms
        FROM (
          SELECT 
            x.id,
            x.name,
            x.images,
            x.video,
            x.price,
            x.private_bathroom,
            x.private_terrace,
            x.is_exterior,
            COALESCE(x.air_conditioning, false) as air_conditioning,
            x.status as manual_status,
            x.availability as manual_availability,
            c.id as active_contract_id,
            c.end_date as contract_end_date
          FROM jsonb_to_recordset(
            COALESCE((SELECT rooms FROM public.properties WHERE id = v_property_id), '[]'::jsonb)
          ) as x(
            id text, 
            name text, 
            images jsonb, 
            video jsonb, 
            price numeric, 
            private_bathroom boolean, 
            private_terrace boolean, 
            is_exterior boolean, 
            air_conditioning boolean,
            status text,
            availability text
          )
          LEFT JOIN public.contracts c 
            ON c.property_id = v_property_id 
            AND c.room_id = x.id 
            AND c.status = 'active'
            AND c.start_date <= CURRENT_DATE 
            AND c.end_date >= CURRENT_DATE
        ) r;

        UPDATE public.properties SET rooms = v_updated_rooms WHERE id = v_property_id;

        -- Update global property status based on new rooms state
        DECLARE
            v_total_rooms int;
            v_occupied_rooms int;
            v_min_availability date;
        BEGIN
            -- Get total rooms from JSONB array length
            SELECT jsonb_array_length(rooms) INTO v_total_rooms 
            FROM public.properties 
            WHERE id = v_property_id;

            -- Count unique rooms occupied by active/future contract OR manual status
            SELECT count(DISTINCT r_id) INTO v_occupied_rooms
            FROM (
                -- Rooms occupied via contracts
                SELECT room_id as r_id
                FROM public.contracts
                WHERE property_id = v_property_id
                  AND status = 'active'
                  AND end_date >= CURRENT_DATE
                UNION
                -- Rooms occupied manually
                SELECT x.id as r_id
                FROM jsonb_to_recordset(v_updated_rooms) as x(id text, status text)
                WHERE x.status = 'reservado' OR x.status = 'alquilado'
            ) occupied;

            IF v_total_rooms > 0 AND v_occupied_rooms >= v_total_rooms THEN
                -- Find minimum room availability
                SELECT MIN(r.availability::date) INTO v_min_availability
                FROM jsonb_to_recordset(v_updated_rooms) as r(status text, availability text)
                WHERE r.status IN ('alquilado', 'reservado')
                  AND r.availability ~ '^\d{4}-\d{2}-\d{2}$';

                UPDATE public.properties 
                SET commercial_status = 'alquilado',
                    availability = COALESCE(v_min_availability::text, NULL)
                WHERE id = v_property_id;
            ELSE
                UPDATE public.properties 
                SET commercial_status = 'disponible',
                    availability = NULL
                WHERE id = v_property_id;
            END IF;
        END;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Update refresh_all_property_commercial_statuses function to include room air_conditioning
CREATE OR REPLACE FUNCTION public.refresh_all_property_commercial_statuses()
RETURNS json AS $$
DECLARE
    prop RECORD;
    v_active_count int;
    v_future_count int;
    v_updated_count int := 0;
    v_old_status text;
    v_new_status text;
    v_updated_rooms jsonb;
    v_availability_expired boolean;
BEGIN
    FOR prop IN SELECT id, is_room_rental, operation, commercial_status, is_manual_commercial_status, availability FROM public.properties 
    WHERE operation = 'alquiler' LOOP
        v_old_status := prop.commercial_status;
        v_new_status := v_old_status;

        -- Caso A: La propiedad tiene estado establecido manualmente
        IF prop.is_manual_commercial_status THEN
            -- Comprobar si la fecha de disponibilidad manual ha expirado
            v_availability_expired := (
                prop.availability IS NOT NULL 
                AND prop.availability ~ '^\d{4}-\d{2}-\d{2}$' 
                AND prop.availability::date <= CURRENT_DATE
            );

            IF v_availability_expired THEN
                v_new_status := 'disponible';
                UPDATE public.properties 
                SET commercial_status = 'disponible',
                    availability = NULL,
                    is_manual_commercial_status = false
                WHERE id = prop.id;
                v_updated_count := v_updated_count + 1;
            END IF;
            
            -- Si es alquiler por habitaciones, refrescar la disponibilidad interna de las habitaciones
            IF prop.is_room_rental THEN
                SELECT COALESCE(jsonb_agg(
                  jsonb_build_object(
                    'id', r.id,
                    'name', r.name,
                    'images', r.images,
                    'video', r.video,
                    'price', r.price,
                    'private_bathroom', r.private_bathroom,
                    'private_terrace', r.private_terrace,
                    'is_exterior', r.is_exterior,
                    'air_conditioning', r.air_conditioning,
                    'status', CASE 
                      WHEN r.active_contract_id IS NOT NULL THEN 'alquilado'
                      WHEN r.manual_status IN ('alquilado', 'reservado') AND r.manual_availability IS NOT NULL AND r.is_availability_expired THEN 'disponible'
                      ELSE COALESCE(r.manual_status, 'disponible')
                    END,
                    'availability', CASE
                      WHEN r.active_contract_id IS NOT NULL THEN r.contract_end_date::text
                      WHEN r.manual_status IN ('alquilado', 'reservado') AND r.manual_availability IS NOT NULL AND r.is_availability_expired THEN NULL
                      ELSE r.manual_availability
                    END
                  )
                ), '[]'::jsonb) INTO v_updated_rooms
                FROM (
                  SELECT 
                    x.id,
                    x.name,
                    x.images,
                    x.video,
                    x.price,
                    x.private_bathroom,
                    x.private_terrace,
                    x.is_exterior,
                    COALESCE(x.air_conditioning, false) as air_conditioning,
                    x.status as manual_status,
                    x.availability as manual_availability,
                    c.id as active_contract_id,
                    c.end_date as contract_end_date,
                    (
                      x.availability IS NOT NULL 
                      AND x.availability ~ '^\d{4}-\d{2}-\d{2}$' 
                      AND x.availability::date <= CURRENT_DATE
                    ) as is_availability_expired
                  FROM jsonb_to_recordset(
                    COALESCE((SELECT rooms FROM public.properties WHERE id = prop.id), '[]'::jsonb)
                  ) as x(
                    id text, 
                    name text, 
                    images jsonb, 
                    video jsonb, 
                    price numeric, 
                    private_bathroom boolean, 
                    private_terrace boolean, 
                    is_exterior boolean, 
                    air_conditioning boolean,
                    status text,
                    availability text
                  )
                  LEFT JOIN public.contracts c 
                    ON c.property_id = prop.id 
                    AND c.room_id = x.id 
                    AND c.status = 'active'
                    AND c.start_date <= CURRENT_DATE 
                    AND c.end_date >= CURRENT_DATE
                ) r;
                
                UPDATE public.properties SET rooms = v_updated_rooms WHERE id = prop.id;
            END IF;

        -- Caso B: La propiedad se gestiona automáticamente por contratos
        ELSE
            -- Alquiler estándar
            IF NOT prop.is_room_rental THEN
                -- Contar contratos activos
                SELECT count(*) INTO v_active_count
                FROM public.contracts
                WHERE property_id = prop.id
                  AND status = 'active'
                  AND start_date <= CURRENT_DATE
                  AND end_date >= CURRENT_DATE;

                -- Contar contratos futuros
                SELECT count(*) INTO v_future_count
                FROM public.contracts
                WHERE property_id = prop.id
                  AND status = 'active'
                  AND start_date > CURRENT_DATE;

                IF v_active_count > 0 THEN
                    v_new_status := 'alquilado';
                    -- Actualizar fecha de disponibilidad desde el último contrato activo
                    DECLARE
                        v_end_date date;
                    BEGIN
                        SELECT MAX(end_date) INTO v_end_date
                        FROM public.contracts
                        WHERE property_id = prop.id
                          AND status = 'active'
                          AND start_date <= CURRENT_DATE
                          AND end_date >= CURRENT_DATE;
                        
                        UPDATE public.properties SET availability = v_end_date::text WHERE id = prop.id;
                    END;
                ELSIF v_future_count > 0 THEN
                    v_new_status := 'reservado';
                    UPDATE public.properties SET availability = NULL WHERE id = prop.id;
                ELSE
                    v_new_status := 'disponible';
                    UPDATE public.properties SET availability = NULL WHERE id = prop.id;
                END IF;
            
            -- Alquiler por habitaciones
            ELSE
                -- Reconstruir array de habitaciones combinando contratos y expiración manual
                SELECT COALESCE(jsonb_agg(
                  jsonb_build_object(
                    'id', r.id,
                    'name', r.name,
                    'images', r.images,
                    'video', r.video,
                    'price', r.price,
                    'private_bathroom', r.private_bathroom,
                    'private_terrace', r.private_terrace,
                    'is_exterior', r.is_exterior,
                    'air_conditioning', r.air_conditioning,
                    'status', CASE 
                      WHEN r.active_contract_id IS NOT NULL THEN 'alquilado'
                      WHEN r.manual_status IN ('alquilado', 'reservado') AND r.manual_availability IS NOT NULL AND r.is_availability_expired THEN 'disponible'
                      ELSE COALESCE(r.manual_status, 'disponible')
                    END,
                    'availability', CASE
                      WHEN r.active_contract_id IS NOT NULL THEN r.contract_end_date::text
                      WHEN r.manual_status IN ('alquilado', 'reservado') AND r.manual_availability IS NOT NULL AND r.is_availability_expired THEN NULL
                      ELSE r.manual_availability
                    END
                  )
                ), '[]'::jsonb) INTO v_updated_rooms
                FROM (
                  SELECT 
                    x.id,
                    x.name,
                    x.images,
                    x.video,
                    x.price,
                    x.private_bathroom,
                    x.private_terrace,
                    x.is_exterior,
                    COALESCE(x.air_conditioning, false) as air_conditioning,
                    x.status as manual_status,
                    x.availability as manual_availability,
                    c.id as active_contract_id,
                    c.end_date as contract_end_date,
                    (
                      x.availability IS NOT NULL 
                      AND x.availability ~ '^\d{4}-\d{2}-\d{2}$' 
                      AND x.availability::date <= CURRENT_DATE
                    ) as is_availability_expired
                  FROM jsonb_to_recordset(
                    COALESCE((SELECT rooms FROM public.properties WHERE id = prop.id), '[]'::jsonb)
                  ) as x(
                    id text, 
                    name text, 
                    images jsonb, 
                    video jsonb, 
                    price numeric, 
                    private_bathroom boolean, 
                    private_terrace boolean, 
                    is_exterior boolean, 
                    air_conditioning boolean,
                    status text,
                    availability text
                  )
                  LEFT JOIN public.contracts c 
                    ON c.property_id = prop.id 
                    AND c.room_id = x.id 
                    AND c.status = 'active'
                    AND c.start_date <= CURRENT_DATE 
                    AND c.end_date >= CURRENT_DATE
                ) r;

                UPDATE public.properties SET rooms = v_updated_rooms WHERE id = prop.id;

                -- Calcular estado global
                DECLARE
                    v_total_rooms int;
                    v_occupied_rooms int;
                    v_min_availability date;
                BEGIN
                    SELECT jsonb_array_length(rooms) INTO v_total_rooms 
                    FROM public.properties 
                    WHERE id = prop.id;

                    SELECT count(DISTINCT r_id) INTO v_occupied_rooms
                    FROM (
                        -- Habitaciones con contratos
                        SELECT room_id as r_id
                        FROM public.contracts
                        WHERE property_id = prop.id
                          AND status = 'active'
                          AND end_date >= CURRENT_DATE
                        UNION
                        -- Habitaciones ocupadas manualmente
                        SELECT x.id as r_id
                        FROM jsonb_to_recordset(v_updated_rooms) as x(id text, status text)
                        WHERE x.status = 'reservado' OR x.status = 'alquilado'
                    ) occupied;

                    IF v_total_rooms > 0 AND v_occupied_rooms >= v_total_rooms THEN
                        v_new_status := 'alquilado';
                        -- Calculate min availability
                        SELECT MIN(r.availability::date) INTO v_min_availability
                        FROM jsonb_to_recordset(v_updated_rooms) as r(status text, availability text)
                        WHERE r.status IN ('alquilado', 'reservado')
                          AND r.availability ~ '^\d{4}-\d{2}-\d{2}$';
                        
                        UPDATE public.properties 
                        SET availability = COALESCE(v_min_availability::text, NULL) 
                        WHERE id = prop.id;
                    ELSE
                        v_new_status := 'disponible';
                        UPDATE public.properties SET availability = NULL WHERE id = prop.id;
                    END IF;
                END;
            END IF;

            -- Actualizar sólo si cambió
            IF v_new_status IS DISTINCT FROM v_old_status THEN
                UPDATE public.properties SET commercial_status = v_new_status WHERE id = prop.id;
                v_updated_count := v_updated_count + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN json_build_object('updated', v_updated_count);
END;
$$ LANGUAGE plpgsql;
