
const API_KEY = 'AIzaSyCJjp4ORlkjlHP-Qx9GoqJCrjP9i1oQ5F8';
const MODEL = "gemini-1.5-flash";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

async function testFlash() {
    console.log(`Testing URL: ${URL}`);
    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello" }] }]
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("API Error Status:", response.status);
            console.error("API Error Body:", err);
        } else {
            console.log("Success! Status:", response.status);
            const data = await response.json();
            console.log("Response:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testFlash();
