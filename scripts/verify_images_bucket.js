
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use SERVICE KEY for testing to bypass RLS if strictly testing bucket existence, 
// BUT we want to test anon/authenticated access usually. 
// Ideally we test with ANON key to simulate frontend, but anon can only upload if RLS allows.
// The policy allows 'authenticated' to upload.
// For this script, we can't easily sign in as a user without credentials.
// So we will use the SERVICE KEY to verify the BUCKET works first.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyImagesBucket() {
    console.log('Verifying "images" bucket...');

    // 1. List buckets to check existence
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
        console.error('Error listing buckets:', listError);
        return;
    }

    const imagesBucket = buckets.find(b => b.name === 'images');
    if (!imagesBucket) {
        console.error('CRITICAL: "images" bucket NOT found in bucket list.');
        console.log('Available buckets:', buckets.map(b => b.name));
        return;
    }
    console.log('Bucket "images" found.');

    // 2. Upload Test
    const fileName = `verification_${Date.now()}.txt`;
    const { data, error: uploadError } = await supabase
        .storage
        .from('images')
        .upload(fileName, 'Verification Content', { contentType: 'text/plain' });

    if (uploadError) {
        console.error('Upload failed:', uploadError);
    } else {
        console.log('Upload successful.');

        // 3. Get Public URL
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
        console.log('Public URL:', urlData.publicUrl);
    }
}

verifyImagesBucket();
