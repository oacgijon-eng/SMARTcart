
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const loadEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) return null;
        const content = fs.readFileSync(envPath, 'utf8');
        const env = {};
        content.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        });
        return env;
    } catch (e) {
        return null;
    }
};

const env = loadEnv();
if (!env || !env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function inspectItems() {
    // We can infer type by looking at a row
    const { data, error } = await supabase.from('items').select('id').limit(1);
    if (error) {
        console.error("Error fetching items:", error);
    } else if (data && data.length > 0) {
        console.log("Sample Item ID:", data[0].id);
        console.log("Type of ID:", typeof data[0].id);
    } else {
        console.log("No items found to verify type.");
    }
}

inspectItems();
