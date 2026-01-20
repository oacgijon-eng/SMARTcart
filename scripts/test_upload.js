
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

async function testUpload() {
    console.log('Testing upload to "protocols"...');
    const fileName = `test_${Date.now()}.txt`;
    const { data, error } = await supabase
        .storage
        .from('protocols')
        .upload(fileName, 'Test content', {
            contentType: 'text/plain'
        });

    if (error) {
        console.error('Upload failed:', error);
    } else {
        console.log('Upload successful:', data);

        // Cleanup
        /*
        const { error: delError } = await supabase
            .storage
            .from('protocols')
            .remove([fileName]);
        if (delError) console.error('Cleanup failed:', delError);
        else console.log('Cleanup successful.');
        */
    }
}

testUpload();
