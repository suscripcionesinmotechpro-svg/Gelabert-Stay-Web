import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumqjpqngmhpbwytpets.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Creando usuario admin...");
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@gmail.com',
    password: 'GelabertStay2024!',
    options: {
      data: {
        role: 'admin',
        full_name: 'Admin Gelabert'
      }
    }
  });

  if (error) {
    console.error("Error creating user:", error);
  } else {
    console.log("Admin user created successfully:", data.user?.id);
  }
}

main();
