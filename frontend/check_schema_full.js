import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumqjpqngmhpbwytpets.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getFullSchema() {
  console.log("Fetching detailed schema for public.properties...");
  
  // Querying information_schema via RPC or raw query isn't directly possible with Anon Key on 'properties'
  // But we can use the 'rpc' to get schema if there is a helper, or just use the PostgREST /rest/v1/ and check for /?select=
  
  // Since we can't directly query information_schema without a custom RPC, 
  // let's try to get one row and check its structure carefully.
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error querying properties:", error);
    return;
  }

  if (data && data.length > 0) {
      console.log("Sample Data found. Inspecting types...");
      const row = data[0];
      for (const [key, value] of Object.entries(row)) {
          console.log(`Column: ${key} | Type Guess: ${typeof value} | Value: ${value}`);
      }
  } else {
      console.log("No data found to inspect.");
  }

  // Let's also check if there are other tables
  console.log("\nChecking for other likely tables...");
  const tables = ['bookings', 'contacts', 'invoices', 'users', 'agents'];
  for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('*').limit(0);
      if (!tableError) console.log(`Table '${table}' exists and is accessible.`);
  }
}

getFullSchema();
