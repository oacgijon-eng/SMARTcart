
const API_KEY = 'AIzaSyCJjp4ORlkjlHP-Qx9GoqJCrjP9i1oQ5F8';
const MODEL = "gemini-2.0-flash";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

async function testGemini2() {
    console.log(`Testing URL: ${URL}`);
    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Generate a realistic image of a medical syringe." }] }]
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("API Error Status:", response.status);
            console.error("API Error Body:", err);
        } else {
            console.log("Success! Status:", response.status);
            const data = await response.json();
            console.log("Response Keys:", Object.keys(data));
            if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
                const parts = data.candidates[0].content.parts;
                console.log("Parts count:", parts.length);
                parts.forEach(p => {
                    if (p.text) console.log("Text part:", p.text.substring(0, 50) + "...");
                    if (p.inlineData) console.log("Image found! MimeType:", p.inlineData.mimeType);
                    if (p.executableCode) console.log("Executable code found");
                });
            } else {
                console.log("No standard candidates found.");
            }
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testGemini2();
