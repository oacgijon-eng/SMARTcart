
const API_KEY = 'AIzaSyCJjp4ORlkjlHP-Qx9GoqJCrjP9i1oQ5F8';
// Try gemini-1.5-flash as it is more stable for free tier
const MODEL = "gemini-flash-latest";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

async function testCorrection() {
    console.log(`Testing URL: ${URL}`);
    const textToCorrect = "gasas esteriles";
    console.log(`Input: "${textToCorrect}"`);

    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Corrige SOLO la ortografía, pon tildes y asegura que la primera letra sea mayúscula para este nombre de material médico. No cambies el significado. Devuelve solo el texto corregido: "${textToCorrect}"`
                    }]
                }]
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("API Error Status:", response.status);
            console.error("API Error Body:", err);
        } else {
            console.log("Success! Status:", response.status);
            const data = await response.json();
            // console.log("Response:", JSON.stringify(data, null, 2));
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                console.log("Corrected Output:", data.candidates[0].content.parts[0].text);
            } else {
                console.log("No text in response");
            }
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testCorrection();
