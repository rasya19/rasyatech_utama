import { createClient } from '@supabase/supabase-js';

async function diagnose() {
  const url = 'https://mqvxretzntpkwxspbvap.supabase.co';
  const anon = process.env.VITE_SUPABASE_ANON_KEY_SIPUT || '';

  const client = createClient(url, anon);

  console.log('Fetching one row from registrations to see all columns...');
  const { data, error } = await client
    .from('registrations')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Fetch registrations failed! Error:', error);
  } else {
    console.log('Fetch registrations succeeded! Keys:', data && data[0] ? Object.keys(data[0]) : 'No data in table');
    console.log('Row content:', data);
  }
}

diagnose();
