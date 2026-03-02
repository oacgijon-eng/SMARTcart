
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple parser for .env.local
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envFile.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                env[key.trim()] = value.trim();
            }
        });
        return env;
    } catch (e) {
        console.error("Could not load .env.local", e);
        return {};
    }
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
    console.log('Checking "equipment" table schema...');

    try {
        // Try to insert with a UUID-looking string to see if it accepts it, 
        // OR try to see if we can get error details about types.
        // Actually, let's just inspect a row if one exists.
        const { data: existing } = await supabase.from('equipment').select('id').limit(1);

        if (existing && existing.length > 0) {
            console.log('Sample Equipment ID:', existing[0].id);
            console.log('Type check: Is usually regex for UUID?');
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existing[0].id);
            console.log('Is valid UUID format?', isUUID);
        } else {
            // Try to insert a dummy with text ID
            const { error: textError } = await supabase.from('equipment').insert({
                id: 'not-a-uuid',
                name: 'Schema Check'
            });

            if (textError) {
                console.log('Insertion with TEXT ID failed:', textError.message);
                if (textError.message.includes('invalid input syntax for type uuid')) {
                    console.log('CONFIRMED: ID column is UUID');
                }
            }
        }
    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

checkSchema();
