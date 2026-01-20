
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
    console.log('Checking "techniques" table schema...');

    // We can't easily query information_schema via supabase-js client unless we have a specific function exposed.
    // Instead, we will try to insert a row WITHOUT an ID.
    // If it succeeds, the default is set. If it fails, it's not.

    try {
        const { data, error } = await supabase
            .from('techniques')
            .insert({
                name: 'Schema Check ' + Date.now(),
                description: 'Checking default ID'
            })
            .select()
            .single();

        if (error) {
            console.error('INSERT FAILED:', error.message);
            if (error.message.includes('null value in column "id"')) {
                console.log('DIAGNOSIS: The "id" column is MISSING a default value generator.');
            }
        } else {
            console.log('INSERT SUCCESS:', data);
            console.log('DIAGNOSIS: The "id" column HAS a default value generator.');

            // Clean up
            await supabase.from('techniques').delete().eq('id', data.id);
        }
    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

checkSchema();
