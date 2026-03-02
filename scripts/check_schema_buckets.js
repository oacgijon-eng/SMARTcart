
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
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('Checking techniques columns...');
    const { data, error } = await supabase
        .from('techniques')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Technique sample keys:', Object.keys(data[0]));
        } else {
            console.log('No techniques found to sample, trying rpc if available or just inferring from migration... wait, I can just check empty return structure if typed? No, runtime.');
            // Since we wiped data, we might get empty array.
            // Let's rely on my previous migration knowledge or try to insert a dummy to see keys returned? No too risky.
            // I'll try to check storage buckets while I'm at it.
        }
    }

    console.log('Checking storage buckets...');
    const { data: buckets, error: bucketError } = await supabase
        .storage
        .listBuckets();

    if (bucketError) {
        console.error('Bucket Error:', bucketError);
    } else {
        console.log('Buckets:', buckets);
    }
}

checkColumns();
