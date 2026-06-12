import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env file manually
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];

console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const propertyId = '5405d27f-19d9-449f-9f78-2fa1deda8fb7'; // Ciudad Jardín property from screenshot
  
  // 1. Fetch property rooms JSON
  const { data: prop, error: propErr } = await supabase
    .from('properties')
    .select('id, title, rooms, is_room_rental, property_type')
    .eq('id', propertyId)
    .single();
    
  if (propErr) {
    console.error('Error fetching property:', propErr);
    return;
  }
  
  console.log('\n--- PROPERTY FROM DATABASE ---');
  console.log('Title:', prop.title);
  console.log('is_room_rental:', prop.is_room_rental);
  console.log('property_type:', prop.property_type);
  console.log('Rooms in JSON:');
  console.log(JSON.stringify(prop.rooms, null, 2));
  
  // 2. Fetch RPC statuses
  const { data: rpcData, error: rpcErr } = await supabase
    .rpc('get_property_room_statuses', { p_property_id: propertyId });
    
  if (rpcErr) {
    console.error('Error executing RPC:', rpcErr);
    return;
  }
  
  console.log('\n--- RPC get_property_room_statuses ---');
  console.log(JSON.stringify(rpcData, null, 2));
  
  // 3. Simulate client-side logic
  console.log('\n--- CLIENT LOGIC SIMULATION ---');
  const statusMap = {};
  const availabilityMap = {};
  rpcData.forEach(item => {
    statusMap[item.room_id] = item.status;
    availabilityMap[item.room_id] = item.availability;
  });
  
  prop.rooms.forEach((room, idx) => {
    const roomStatusRaw = (room.status && room.status !== 'disponible')
      ? room.status
      : (statusMap[room.id] || room._calculated_status || 'disponible');

    const roomStatus = roomStatusRaw.toLowerCase().startsWith('reser')
      ? 'reservado'
      : roomStatusRaw.toLowerCase().startsWith('alqui')
        ? 'alquilado'
        : 'disponible';
        
    const roomAvailability = availabilityMap[room.id] || room.availability;
    
    console.log(`Room #${idx + 1} (${room.name || 'unnamed'}):`);
    console.log(`  room.id: ${room.id}`);
    console.log(`  roomStatusRaw: ${roomStatusRaw}`);
    console.log(`  roomStatus (processed): ${roomStatus}`);
    console.log(`  roomAvailability: ${roomAvailability}`);
    
    const shouldRender = roomStatus !== 'disponible' && roomAvailability;
    console.log(`  Should render availability date? ${shouldRender ? 'YES' : 'NO'}`);
    if (shouldRender) {
      const d = new Date(roomAvailability);
      const isInvalid = isNaN(d.getTime());
      console.log(`    Date raw value: ${roomAvailability}`);
      console.log(`    Date parses successfully? ${!isInvalid}`);
      if (!isInvalid) {
        console.log(`    Formatted date: ${d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`);
      } else {
        console.log(`    Fallback raw value (invalid date): ${roomAvailability}`);
      }
    }
  });
}

run();
