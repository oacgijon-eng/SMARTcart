
const API_KEY = 'AIzaSyCJjp4ORlkjlHP-Qx9GoqJCrjP9i1oQ5F8'; // From .env.local

async function testPrompt(prompt, testCases) {
    console.log(`\n--- Testing Prompt: "${prompt}" ---`);
    const MODEL = "gemini-flash-latest";
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    for (const text of testCases) {
        try {
            const response = await fetch(URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${prompt}: "${text}"`
                        }]
                    }]
                }),
            });

            const data = await response.json();
            const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            console.log(`Input: "${text}" => Output: "${result}"`);
        } catch (error) {
            console.error("Error:", error.message);
        }
    }
}

const testCases = [
    "jeringuillas 10cc",
    "Campo esteril fenestrado",
    "cateter 20g",
    "aposito 10x10"
];

const newPrompt = `Corrige SOLO la ortografía (tildes) y mayúsculas. NO cambies unidades de medida. NO uses formato matemático ni LaTeX (no uses signos de dólar). Devuelve solo el texto corregido`;

testPrompt(newPrompt, testCases);
