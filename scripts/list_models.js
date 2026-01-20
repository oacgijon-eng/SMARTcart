
const API_KEY = 'AIzaSyCJjp4ORlkjlHP-Qx9GoqJCrjP9i1oQ5F8';
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
    console.log(`Listing models...`);
    try {
        const response = await fetch(URL);
        const data = await response.json();
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.name.includes("imagen") || m.supportedGenerationMethods.includes("predict") || m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}: ${m.supportedGenerationMethods}`);
                }
            });
        } else {
            console.log("No models found:", data);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

listModels();
