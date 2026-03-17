import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumqjpqngmhpbwytpets.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email = 'admin@gelaberthomes.es';
  const password = 'GelabertHomes2024!'; // Updated branding password

  console.log(`Attempting to sign up: ${email}`);
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
    if (error.message.includes('already registered')) {
        console.log('User already exists, proceeding to confirmation bypass.');
    }
  } else {
    console.log(`SignUp initiated for: ${data.user.email}`);
    console.log('Now run the SQL script to confirm this user.');
  }
}

run();
