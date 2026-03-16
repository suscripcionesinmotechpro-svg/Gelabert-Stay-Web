import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumqjpqngmhpbwytpets.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email = 'gelabert_master_@gelabertstay.es';
  const password = 'GelabertStay2024!';

  console.log(`Attempting SignUp for: ${email}`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Administrador'
      }
    }
  });

  if (error) {
    console.error(`SignUp failed: ${error.message}`);
  } else {
    console.log(`SignUp successful for: ${data.user.email}`);
    console.log(`User ID: ${data.user.id}`);
  }
}

run();
