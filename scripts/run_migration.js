
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const projectRef = process.argv[2];
const token = process.argv[3];
const filePath = process.argv[4];

if (!projectRef || !token || !filePath) {
    console.error("Usage: node run_migration.js <projectRef> <token> <filePath>");
    process.exit(1);
}

const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log("Executing SQL from", filePath);

    const query = {
        query: sql
    };

    fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
    })
        .then(res => {
            if (!res.ok) {
                return res.text().then(text => { throw new Error(`HTTP ${res.status}: ${text}`) });
            }
            return res.json();
        })
        .then(data => {
            console.log("Migration successful. Response:", JSON.stringify(data, null, 2));
        })
        .catch(err => {
            console.error("Error executing migration:", err.message);
            process.exit(1);
        });

} catch (err) {
    console.error("Error reading file:", err.message);
    process.exit(1);
}
