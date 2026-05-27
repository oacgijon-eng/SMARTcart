/**
 * AI Service for SMARTcart
 * Supports both OpenRouter (Gemini 2.0 Flash) and direct native Google Gemini API (AI Studio).
 */

const getApiKey = () => {
    // 1. Try OpenRouter Key
    const orKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (orKey && orKey.trim() !== '') {
        return { type: 'openrouter', key: orKey };
    }

    // 2. Try Gemini Direct Key safely (replaced by Vite define at compile time)
    let processGeminiKey = '';
    try {
        processGeminiKey = process.env.GEMINI_API_KEY || '';
    } catch (e) {
        // Safe fallback if process is not defined in browser
    }

    if (processGeminiKey && processGeminiKey.trim() !== '') {
        return { type: 'gemini-native', key: processGeminiKey };
    }

    // 3. Try Gemini Direct Key from import.meta.env
    const viteGeminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (viteGeminiKey && viteGeminiKey.trim() !== '') {
        return { type: 'gemini-native', key: viteGeminiKey };
    }

    return null;
};

/**
 * Corrects spelling and capitalization in medical context.
 * @param text The text to refine.
 * @returns Corrected text.
 */
export async function correctText(text: string): Promise<string> {
    if (!text || !text.trim()) return text;

    const apiConfig = getApiKey();
    if (!apiConfig) {
        console.warn("Falta API KEY (OpenRouter o Gemini) para corrección de texto");
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    const systemPrompt = `Eres un asistente experto en suministros y técnicas médicas en ESPAÑOL. Tu misión es corregir ortografía y gramática. 
REGLAS:
1. SIEMPRE capitaliza la primera letra (ej: "ecografia" -> "Ecografía").
2. Corrige errores de escritura (ej: "ecografiaaa" -> "Ecografía").
3. Añade tildes (ej: "basico" -> "Básico").
4. Devuelve SOLO el texto corregido, sin comillas ni explicaciones.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        let response;
        if (apiConfig.type === 'openrouter') {
            const MODEL = "google/gemini-2.0-flash-001";
            const URL = "https://openrouter.ai/api/v1/chat/completions";

            response = await fetch(URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiConfig.key}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "SMARTcart",
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: text }
                    ],
                    temperature: 0.1,
                    max_tokens: 500,
                }),
                signal: controller.signal
            });

            if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);
            const data = await response.json();
            if (data.choices && data.choices[0]?.message?.content) {
                let corrected = data.choices[0].message.content.trim();
                corrected = corrected.replace(/^["']|["']$/g, '').replace(/```/g, '');
                return corrected.charAt(0).toUpperCase() + corrected.slice(1);
            }
        } else {
            // Direct Native Gemini API
            const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiConfig.key}`;
            response = await fetch(URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        { role: "user", parts: [{ text: text }] }
                    ],
                    systemInstruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 500
                    }
                }),
                signal: controller.signal
            });

            if (!response.ok) throw new Error(`Native Gemini error: ${response.status}`);
            const data = await response.json();
            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                let corrected = data.candidates[0].content.parts[0].text.trim();
                corrected = corrected.replace(/^["']|["']$/g, '').replace(/```/g, '');
                return corrected.charAt(0).toUpperCase() + corrected.slice(1);
            }
        }

        return text.charAt(0).toUpperCase() + text.slice(1);
    } catch (error) {
        console.error("Error correcting text:", error);
        return text.charAt(0).toUpperCase() + text.slice(1);
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Interface representing a chat message for the chatbot
 */
export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

/**
 * Queries the AI clinical chatbot assistant with the context of all techniques, items and locations.
 */
export async function askClinicalAssistant(
    message: string,
    history: ChatMessage[],
    data: {
        items: any[];
        techniques: any[];
        locations: any[];
        cartContents: any[];
    }
): Promise<string> {
    const apiConfig = getApiKey();
    if (!apiConfig) {
        return "Lo siento, el asistente clínico inteligente no está configurado (falta añadir la clave de API en las variables de entorno). Por favor, avisa a tu supervisor para configurar `GEMINI_API_KEY`.";
    }

    // Resolve location helper to explain drawer and cart hierarchies
    const resolveLocationString = (locationId: string): string => {
        const loc = data.locations.find(l => l.id === locationId);
        if (!loc) return "Ubicación desconocida";
        if (loc.parent_id) {
            const parent = data.locations.find(p => p.id === loc.parent_id);
            return parent ? `${parent.name} - ${loc.name}` : loc.name;
        }
        return loc.name;
    };

    // 1. Build Inventory Context
    const inventoryContext = data.items.map(item => {
        // Find which locations have this item in cartContents
        const matches = data.cartContents.filter(cc => cc.itemId === item.id);
        const locStrings = matches.map(m => {
            const locName = resolveLocationString(m.locationId);
            return `${locName} (Stock Ideal: ${m.stockIdeal})`;
        });
        const locationsList = locStrings.length > 0 ? locStrings.join(", ") : "Sin asignar en carros/almacenes";
        const petitorio = item.referencia_petitorio ? ` [REF: ${item.referencia_petitorio}]` : "";
        return `- **${item.name}**${petitorio} | Categoría: ${item.category} | Ubicaciones: ${locationsList}`;
    }).join("\n");

    // 2. Build Techniques Context
    const techniquesContext = data.techniques.map(tech => {
        const requiredCarts = (tech.cartIds || []).map((cid: string) => {
            const cart = data.locations.find(l => l.id === cid);
            return cart ? cart.name : "Carro Desconocido";
        }).join(", ");

        const itemsList = (tech.items || []).map((ti: any) => {
            return `${ti.item?.name || 'Material'} (Cantidad: ${ti.quantity})`;
        }).join(", ");

        const eqList = (tech.equipment || []).map((te: any) => {
            return `${te.equipment?.name || 'Equipo'} (Cantidad: ${te.quantity})`;
        }).join(", ");

        return `* **Técnica: ${tech.name}**
  - Descripción: ${tech.description || 'Sin descripción'}
  - Carros requeridos: ${requiredCarts || 'Ninguno asignado'}
  - Materiales: ${itemsList || 'Ninguno'}
  - Aparataje: ${eqList || 'Ninguno'}`;
    }).join("\n\n");

    // 3. System Prompt acting as the Local Clinical Knowledge Base
    const systemPrompt = `Eres "SMARTcart AI", un Asistente Clínico Inteligente experto en suministros, aparataje y técnicas médicas en ESPAÑOL.
Tu trabajo es ayudar al personal de enfermería a localizar materiales rápidamente y repasar los protocolos de preparación de técnicas clínicas en su unidad hospitalaria.

Tienes acceso en tiempo real a la BASE DE DATOS DE LA UNIDAD:

---
CATÁLOGO DE MATERIALES Y SUS UBICACIONES EXACTAS:
${inventoryContext}
---

TÉCNICAS MÉDICAS Y SUS REQUERIMIENTOS:
${techniquesContext}
---

REGLAS DE RESPUESTA:
1. Sé extremadamente servicial, amable, profesional y conciso. El personal trabaja en un entorno de alta presión; valora su tiempo.
2. Si te preguntan por un material, busca en el catálogo anterior e indícales EXACTAMENTE en qué carro y cajón o estantería del almacén se encuentra y su stock ideal.
3. Si te preguntan qué se necesita para una técnica, describe de forma estructurada con viñetas:
   - Los carros que deben preparar.
   - El aparataje médico requerido.
   - El listado de materiales y la cantidad exacta que deben verificar.
4. Responde con un formato markdown limpio, usando negrita y listas ordenadas/desordenadas para que sea muy legible.
5. Si un material o técnica no figura en la base de datos de la unidad, dilo con amabilidad y sugiere que contacten con su supervisor para añadirlo a través del panel de control de SMARTcart.
6. Mantén tus respuestas en un rango de 100 a 300 palabras como máximo, a menos que requieran una descripción de técnica compleja.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const firstUserIdx = history.findIndex(msg => msg.role === 'user');
        const filteredHistory = firstUserIdx !== -1 ? history.slice(firstUserIdx) : [];

        let response;
        if (apiConfig.type === 'openrouter') {
            const MODEL = "google/gemini-2.0-flash-001";
            const URL = "https://openrouter.ai/api/v1/chat/completions";

            // Format history for OpenRouter (standard chat completion)
            const chatMessages = [
                { role: "system", content: systemPrompt },
                ...filteredHistory.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                })),
                { role: "user", content: message }
            ];

            response = await fetch(URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiConfig.key}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "SMARTcart",
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: chatMessages,
                    temperature: 0.2,
                    max_tokens: 1200,
                }),
                signal: controller.signal
            });

            if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);
            const data = await response.json();
            if (data.choices && data.choices[0]?.message?.content) {
                return data.choices[0].message.content.trim();
            }
        } else {
            // Native Direct Gemini API
            const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiConfig.key}`;
            
            // Format history for Google API
            const contents = [
                ...filteredHistory.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                })),
                { role: "user", parts: [{ text: message }] }
            ];

            response = await fetch(URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: contents,
                    systemInstruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 1200
                    }
                }),
                signal: controller.signal
            });

            if (!response.ok) throw new Error(`Native Gemini API error: ${response.status}`);
            const data = await response.json();
            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                return data.candidates[0].content.parts[0].text.trim();
            }
        }

        return "Lo siento, hubo un problema al procesar tu consulta con la Inteligencia Artificial. Por favor, vuelve a intentarlo en unos instantes.";
    } catch (error) {
        console.error("Chatbot assistant error:", error);
        return "Lo siento, ha ocurrido un error al conectar con el Asistente Clínico Inteligente. Verifica tu conexión a internet o intenta de nuevo.";
    } finally {
        clearTimeout(timeoutId);
    }
}
