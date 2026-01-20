
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tdmetvfksdyrqsakjfnh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sbp_49c6ec8d60ca3b53b3e9feac77b32dd45332d048';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('Checking Locations...');
    const { data: locations, error: locError } = await supabase.from('locations').select('*');
    if (locError) console.error('Error fetching locations:', locError);
    else console.log('Locations:', locations);

    console.log('\nChecking Techniques...');
    const { data: techniques, error: techError } = await supabase.from('techniques').select('*');
    if (techError) console.error('Error fetching techniques:', techError);
    else console.log('Techniques:', techniques);

    console.log('\nChecking Technique Items...');
    const { data: techItems, error: tiError } = await supabase.from('technique_items').select('*');
    if (tiError) console.error('Error fetching technique_items:', tiError);
    else console.log('Technique Items:', techItems);
}

checkData();
