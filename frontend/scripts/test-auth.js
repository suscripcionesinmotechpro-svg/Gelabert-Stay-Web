import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumqjpqngmhpbwytpets.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin(email, password) {
  console.log(`Testing login for: ${email} with password: ${password}`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(`Login failed: ${error.message}`);
  } else {
    console.log(`Login successful for: ${data.user.email}`);
  }
}

async function run() {
  // Test root control
  await testLogin('root@gelaberthomes.es', 'GelabertStay2024!');
  // Test admin2 variant
  await testLogin('admin2@gelaberthomes.es', 'GelabertStay2024!');
  // Test a completely random email to see if it still 500s
  await testLogin('random_test_123@gelaberthomes.es', 'any_password');
  // Test wrong password to see if it 500s or returns 'Invalid credentials'
  await testLogin('admin@gelaberthomes.es', 'WRONG_PASSWORD');
  // Test simple password
  await testLogin('admin@gelaberthomes.es', '12345678');
  // Test new final candidate
  await testLogin('admin_final@gelaberthomes.es', 'GelabertStay2024!');
  // Test both password variants
  await testLogin('admin@gelaberthomes.es', 'GelabertStay2024!');
  await testLogin('admin@gelaberthomes.es', 'GelabertStay2024');
  await testLogin('info@gelaberthomes.es', 'GelabertStay2024!');
  await testLogin('info@gelaberthomes.es', 'GelabertStay2024');
}

run();
