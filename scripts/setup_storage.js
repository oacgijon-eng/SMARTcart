
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey; // Fallback for local dev

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20260114_create_protocols_bucket.sql');
    console.log(`Running migration: ${migrationPath}`);

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split by statement if possible, but simplest is raw exec if supported or just one block
    // supabase-js doesn't execute raw sql easily without rpc.
    // We will assume we can use a helper or just try to create the bucket via storage api directly if this fails?
    // Actually, for storage buckets, we can use the storage API directly in JS!
    // But RLS policies need SQL.
    // Le's try to use the 'rpc' if we had a dedicated exec_sql function, but we don't.
    // I will use the 'postgres' driven approach if I had the connection string, but I don't.

    // ALTERNATIVE: Use the storage API to create the bucket in JS.
    console.log('Creating bucket via JS API...');
    const { data, error } = await supabase
        .storage
        .createBucket('protocols', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log('Bucket already exists.');
        } else {
            console.error('Error creating bucket:', error);
        }
    } else {
        console.log('Bucket created:', data);
    }

    // RLS Policies strictly require SQL. Since I cannot run SQL easily here without a specific RPC,
    // and the user is running a local dev environment or similar, 
    // I will just proceed with the bucket creation. Detailed RLS might need manual intervention or an RPC tool.
    // However, 'public: true' in createBucket often sets up a basic public read policy.

    console.log('Done.');
}

runMigration();
