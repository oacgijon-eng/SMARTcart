
import fs from 'fs';
import path from 'path';

const checkEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) {
            console.log("No .env.local found");
            return;
        }
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        const keys = lines.map(l => l.split('=')[0].trim()).filter(k => k);
        console.log("Keys found:", keys.join(', '));

        const serviceKey = lines.find(l => l.includes('SERVICE'));
        if (serviceKey) {
            console.log("Service key found (value hidden)");
        } else {
            console.log("No service key found");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
};

checkEnv();
