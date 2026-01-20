
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize with the API Key
// IMPORTANT: The user must add VITE_GOOGLE_AI_KEY to .env.local
const API_KEY = import.meta.env.VITE_GOOGLE_AI_KEY;

/**
 * Generates an image using the Nano Banana Pro (Gemini Image) model.
 * @param prompt The description of the image.
 * @returns Base64 image string or URL.
 */
export async function generateMaterialImage(prompt: string): Promise<string | null> {
    if (!API_KEY) {
        console.warn("Falta VITE_GOOGLE_AI_KEY en .env.local");
        alert("Para usar IA, añade VITE_GOOGLE_AI_KEY en .env.local");
        return null;
    }

    // "Nano Banana Pro" -> Likely referring to Imagen 3 models available in AI Studio
    const MODEL = "imagen-3.0-generate-001";
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predict?key=${API_KEY}`;

    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                instances: [
                    {
                        prompt: `Professional, clean, medical inventory photo of: ${prompt}. White background, photorealistic, high quality.`,
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
            throw new Error(`AI Api Error: ${err}`);
        }

        const data = await response.json();

        // Check response structure for Imagen on Vertex/Studio
        // Usually: predictions[0].bytesBase64Encoded or similar
        if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
            return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
        }

        // Simplify for fallback if structure varies
        console.log("AI Response:", data);
        return null;

    } catch (error) {
        console.error("Error generando imagen:", error);
        alert("Error generando imagen. Revisa la consola.");
        return null;
    }
}

/**
     * Corrects spelling and capitalization using Gemini.
     * @param text The text to refine.
     * @returns Corrected text.
     */
export async function correctText(text: string): Promise<string> {
    if (!API_KEY) {
        console.warn("Falta VITE_GOOGLE_AI_KEY para corrección de texto");
        return text;
    }
    if (!text || !text.trim()) return text;

    const MODEL = "gemini-flash-latest";
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    // 5 Second Timeout Controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Eres un asistente experto en suministros médicos. Tu misión es CORREGIR errores ortográficos y gramaticales.
Instrucciones:
1. Corrige typos y errores de escritura (ej: "guantees" -> "Guantes", "jeringuills" -> "Jeringuillas").
2. Añade todas las tildes necesarias (ej: "esteril" -> "Estéril", "via" -> "Vía").
3. Capitaliza la primera letra de cada palabra importante si es apropiado.
4. Devuelve SOLO el texto corregido.

Texto entrada: "${text}"`
                    }]
                }],
                generationConfig: {
                    temperature: 0.3, // Slightly higher for better correction flexibility
                    maxOutputTokens: 500,
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn("AI API Error:", response.status);
            return text;
        }

        const data = await response.json();
        console.log("AI Raw Response:", data); // Debug log for user report

        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            let corrected = data.candidates[0].content.parts[0].text.trim();
            // Remove any quotes if AI adds them
            corrected = corrected.replace(/^["']|["']$/g, '');
            // Ensure no markdown code blocks
            corrected = corrected.replace(/```/g, '');
            return corrected;
        }

        return text;
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.warn("AI Correction Timed Out (5s). Saving original text.");
        } else {
            console.error("Error correcting text:", error);
        }
        return text;
    } finally {
        clearTimeout(timeoutId);
    }
}
