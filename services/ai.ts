
/**
 * Corrects spelling and capitalization using OpenRouter (Gemini 2.0 Flash).
 * @param text The text to refine.
 * @returns Corrected text.
 */
export async function correctText(text: string): Promise<string> {
    const OR_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!OR_KEY) {
        console.warn("Falta VITE_OPENROUTER_API_KEY para corrección de texto");
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
    if (!text || !text.trim()) return text;

    const MODEL = "google/gemini-2.0-flash-001";
    const URL = "https://openrouter.ai/api/v1/chat/completions";

    // Diagnostic log (SAFE: only first 4 chars)
    // console.log(`AI Text Correction triggered for "${text.slice(0, 15)}...". Key: ${OR_KEY ? OR_KEY.slice(0, 7) : 'MISSING'}`);

    // 10 Second Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OR_KEY}`,
                "HTTP-Referer": window.location.origin, // Required by OpenRouter for usage stats
                "X-Title": "SMARTcart",
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: "system",
                        content: `Eres un asistente experto en suministros y técnicas médicas en ESPAÑOL. Tu misión es corregir ortografía y gramática. 
REGLAS:
1. SIEMPRE capitaliza la primera letra (ej: "ecografia" -> "Ecografía").
2. Corrige errores de escritura (ej: "ecografiaaa" -> "Ecografía").
3. Añade tildes (ej: "basico" -> "Básico").
4. Devuelve SOLO el texto corregido, sin comillas ni explicaciones.`
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0.1,
                max_tokens: 500,
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn("OpenRouter API Error:", response.status);
            return text.charAt(0).toUpperCase() + text.slice(1);
        }

        const data = await response.json();
        // console.log("AI Raw Response:", data); 

        if (data.choices && data.choices[0]?.message?.content) {
            let corrected = data.choices[0].message.content.trim();
            corrected = corrected.replace(/^["']|["']$/g, '');
            corrected = corrected.replace(/```/g, '');
            if (!corrected) return text.charAt(0).toUpperCase() + text.slice(1);
            return corrected.charAt(0).toUpperCase() + corrected.slice(1);
        }

        return text.charAt(0).toUpperCase() + text.slice(1);
    } catch (error: any) {
        console.error("Error correcting text:", error);
        return text.charAt(0).toUpperCase() + text.slice(1);
    } finally {
        clearTimeout(timeoutId);
    }
}
