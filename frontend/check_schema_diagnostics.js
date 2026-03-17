import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumqjpqngmhpbwytpets.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("Checking properties table...");
  const { data, error, count } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: false });

  if (error) {
    console.error("Error querying properties:", error);
    if (error.code === 'PGRST116') {
        console.log("Table might not exist or columns are missing.");
    }
  } else {
    console.log(`Success! Found ${data.length} rows.`);
    if (data.length > 0) {
        console.log("Columns available:", Object.keys(data[0]).join(", "));
    }
  }

  console.log("\nChecking storage buckets...");
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error("Error listing buckets:", bucketError);
  } else {
    console.log("Buckets found:", buckets.map(b => b.name).join(", "));
  }
}

checkSchema();
