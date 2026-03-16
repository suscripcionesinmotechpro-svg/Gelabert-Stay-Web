import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumqjpqngmhpbwytpets.supabase.co';
// Usamos la Service Role Key si la tenemos para saltar RLS, o la Anon key si el bucket permite creación.
// Como no tenemos la service_role, usaremos la Anon key. Wait, la Anon key NO puede crear buckets por defecto.
// Bueno, probaremos.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Creando bucket 'property-images'...");
  const { data, error } = await supabase.storage.createBucket('property-images', {
    public: true,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/heic']
  });

  if (error) {
    if (error.message.includes('already exists')) {
       console.log("El bucket ya existía. Actualizando configuraciones...");
       const { error: updateError } = await supabase.storage.updateBucket('property-images', {
         public: true,
         fileSizeLimit: 52428800,
         allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/heic']
       });
       if (updateError) console.error("Error actualizando bucket:", updateError);
       else console.log("Bucket actualizado.");
    } else {
       console.error("Error creando bucket:", error);
    }
  } else {
    console.log("Bucket creado exitosamente:", data);
  }
}

main();
