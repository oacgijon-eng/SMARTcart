
const API_KEY = 'AIzaSyCJjp4ORlkjlHP-Qx9GoqJCrjP9i1oQ5F8';
const MODEL = "imagen-3.0-generate-001";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predict?key=${API_KEY}`;

// Use native fetch (Node 18+)
async function testGen() {
    console.log(`Testing URL: ${URL}`);
    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                instances: [
                    {
                        prompt: "A medical syringe",
                    },
                ],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1",
                },
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("API Error Status:", response.status);
            console.error("API Error Body:", err);
        } else {
            console.log("Success! Status:", response.status);
            const data = await response.json();
            console.log("Keys in response:", Object.keys(data));
            if (data.predictions) {
                console.log("Predictions found:", data.predictions.length);
            } else {
                console.log("No predictions key found. Full response:", JSON.stringify(data, null, 2));
            }
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testGen();
