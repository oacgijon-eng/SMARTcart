
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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupImagesBucket() {
    console.log('Creating "images" bucket...');

    // 1. Create Bucket
    const { data, error } = await supabase
        .storage
        .createBucket('images', {
            public: true,
            fileSizeLimit: 5242880, // 5MB limit for images
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
        });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log('Bucket "images" already exists.');
        } else {
            console.error('Error creating bucket:', error);
            // Don't exit, might be permissions, but we can try to proceed if it exists
        }
    } else {
        console.log('Bucket "images" created successfully:', data);
    }

    // 2. Update Public Access (just in case)
    const { data: updateData, error: updateError } = await supabase
        .storage
        .updateBucket('images', {
            public: true
        });

    if (updateError) {
        console.error('Error updating bucket public access:', updateError);
    } else {
        console.log('Bucket public access verified.');
    }

    console.log('Setup complete.');
}

setupImagesBucket();
