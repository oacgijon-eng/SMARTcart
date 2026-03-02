
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Simple env parser since we can't depend on dotenv being installed
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
        return env['VITE_GOOGLE_AI_KEY'];
    } catch (e) {
        return null;
    }
};

const apiKey = loadEnv();

if (!apiKey) {
    console.error("Error: Could not find VITE_GOOGLE_AI_KEY in .env.local");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("Fetching available models...");

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("API Error:", json.error);
            } else if (json.models) {
                // Filter for 'generateContent' supported models
                const contentModels = json.models.filter(m =>
                    m.supportedGenerationMethods &&
                    (m.supportedGenerationMethods.includes('generateContent') || m.supportedGenerationMethods.includes('generateMessage'))
                );

                console.log("\nAvailable Content Generation Models:");
                contentModels.forEach(m => {
                    console.log(`- ${m.name} (${m.displayName})`);
                });
            } else {
                console.log("Response:", json);
            }
        } catch (e) {
            console.error("Parse Error:", e);
            console.log("Raw Data:", data);
        }
    });

}).on("error", (err) => {
    console.error("Network Error:", err);
});
