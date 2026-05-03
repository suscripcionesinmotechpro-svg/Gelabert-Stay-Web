import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://aumqjpqngmhpbwytpets.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU'
);

async function check() {
  // Try to find the tenant
  const { data: tenants, error: tenantErr } = await supabase
    .from('tenants')
    .select('id, first_name, last_name')
    .ilike('first_name', '%Victor%');

  console.log('Tenants:', tenants);

  if (tenants && tenants.length > 0) {
    for (const t of tenants) {
      const { data: contracts, error: contractErr } = await supabase
        .from('contracts')
        .select('*')
        .eq('tenant_id', t.id);
        
      console.log('Contracts for tenant', t.first_name, contracts);
    }
  } else {
    // If we can't find by tenant name, let's just get all active contracts and look for anything expiring soon
    const { data: activeContracts } = await supabase
      .from('contracts')
      .select('id, start_date, end_date, status, landlord_name')
      .eq('status', 'active');
      
    console.log('Active Contracts:', activeContracts);
  }
}

check();
