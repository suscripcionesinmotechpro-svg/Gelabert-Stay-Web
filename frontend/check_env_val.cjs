const { execSync } = require('child_process');

try {
  const url = execSync('npx netlify env:get VITE_SUPABASE_URL', { encoding: 'utf8' }).trim();
  const key = execSync('npx netlify env:get VITE_SUPABASE_ANON_KEY', { encoding: 'utf8' }).trim();
  
  console.log('VITE_SUPABASE_URL:');
  console.log('  Length:', url.length);
  console.log('  Contains stars:', url.includes('*'));
  console.log('  Prefix:', url.slice(0, 10));
  console.log('  Suffix:', url.slice(-10));
  console.log('  Is empty:', url === '');
  
  console.log('VITE_SUPABASE_ANON_KEY:');
  console.log('  Length:', key.length);
  console.log('  Contains stars:', key.includes('*'));
  console.log('  Prefix:', key.slice(0, 10));
  console.log('  Suffix:', key.slice(-10));
  console.log('  Is empty:', key === '');

} catch (err) {
  console.error('Error fetching env:', err.message);
}
