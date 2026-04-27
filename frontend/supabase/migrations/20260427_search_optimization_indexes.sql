-- SQL Migration: Search Optimization Indexes
-- Target: public.properties
-- Goal: Improve performance of filters on operation, property_type and commercial_status

-- Index for the most common public search query
CREATE INDEX IF NOT EXISTS idx_properties_public_search 
ON public.properties (operation, property_type, commercial_status) 
WHERE is_published = true AND status = 'publicada';

-- Index for price filtering within operation context
CREATE INDEX IF NOT EXISTS idx_properties_price_lookup
ON public.properties (operation, price);

-- Index for area/bedrooms/bathrooms filtering
CREATE INDEX IF NOT EXISTS idx_properties_features_lookup
ON public.properties (bedrooms, bathrooms, area_m2);

-- Index for location based searches
CREATE INDEX IF NOT EXISTS idx_properties_location_lookup
ON public.properties (city, zone);

-- Index for text-based lookups (slug and reference)
CREATE INDEX IF NOT EXISTS idx_properties_slug_lookup ON public.properties (slug);
CREATE INDEX IF NOT EXISTS idx_properties_reference_lookup ON public.properties (reference);

-- Index for creation date (sorting)
CREATE INDEX IF NOT EXISTS idx_properties_created_at_sort ON public.properties (created_at DESC);
