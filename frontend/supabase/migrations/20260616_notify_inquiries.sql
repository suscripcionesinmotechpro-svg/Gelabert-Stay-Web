-- Migration: Add email notifications trigger for inquiries table
-- Date: 2026-06-16

-- 1. Create the notify_new_inquiry database function
CREATE OR REPLACE FUNCTION public.notify_new_inquiry()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  perform net.http_post(
    url := 'https://aumqjpqngmhpbwytpets.supabase.co/functions/v1/notify-inquiry',
    headers := '{"Content-Type": "application/json"}',
    body := row_to_json(NEW)::jsonb
  );
  RETURN NEW;
END;
$function$;

-- 2. Create the trigger on the inquiries table
DROP TRIGGER IF EXISTS trigger_notify_new_inquiry ON public.inquiries;
CREATE TRIGGER trigger_notify_new_inquiry
  AFTER INSERT ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_inquiry();
