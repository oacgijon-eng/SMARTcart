import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, AlertCircle, RefreshCw, ChevronDown, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { askClinicalAssistant, ChatMessage } from '../services/ai';
import { Button } from './UI';

interface ClinicalChatbotProps {
    items: any[];
    techniques: any[];
    locations: any[];
    cartContents: any[];
}

export const ClinicalChatbot: React.FC<ClinicalChatbotProps> = ({
    items,
    techniques,
    locations,
    cartContents
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'model',
            content: '¡Hola! Soy **SMARTcart AI**, tu asistente clínico inteligente. ¿En qué puedo ayudarte hoy?\n\n- Puedo indicarte la **ubicación exacta** de cualquier material en los carros o el almacén.\n- Puedo repasar los **materiales y aparataje** necesarios para preparar cualquier técnica médica.\n- O resolver dudas sobre los flujos de trabajo de la unidad.'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isTtsEnabled, setIsTtsEnabled] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const handleSendMessageRef = useRef<any>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    // Focus input when opening
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    // Keep handleSendMessage ref fresh to prevent stale closures in Speech Recognition
    useEffect(() => {
        handleSendMessageRef.current = handleSendMessage;
    }, [messages, items, techniques, locations, cartContents, isLoading, isTtsEnabled]);

    // Speech synthesis effects to stop audio when toggled off or closed
    useEffect(() => {
        if (!isTtsEnabled && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }, [isTtsEnabled]);

    useEffect(() => {
        if (!isOpen && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }, [isOpen]);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.lang = 'es-ES';
            rec.interimResults = false;
            rec.maxAlternatives = 1;

            rec.onstart = () => {
                setIsListening(true);
            };

            rec.onend = () => {
                setIsListening(false);
            };

            rec.onerror = (event: any) => {
                console.error("Speech recognition error:", event);
                setIsListening(false);
            };

            rec.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                if (transcript && transcript.trim()) {
                    setInput(transcript);
                    if (handleSendMessageRef.current) {
                        handleSendMessageRef.current(transcript);
                    }
                }
            };

            recognitionRef.current = rec;
        }
    }, []);

    const speakText = (text: string) => {
        if (!window.speechSynthesis) return;

        window.speechSynthesis.cancel();

        // Clean markdown tags for natural speech readout
        const cleanText = text
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/[-*]\s+/g, '')
            .replace(/\[REF:.*?\]/g, '')
            .replace(/\[.*?\]\(.*?\)/g, '$1')
            .replace(/#/g, '')
            .replace(/\|/g, ',')
            .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-ES';

        const voices = window.speechSynthesis.getVoices();
        const esVoice = voices.find(v => v.lang.startsWith('es-'));
        if (esVoice) {
            utterance.voice = esVoice;
        }

        window.speechSynthesis.speak(utterance);
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("La entrada de voz no está soportada en este navegador o requiere permisos de micrófono. Te recomendamos usar Google Chrome o Microsoft Edge.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Speech recognition start failed:", e);
            }
        }
    };

    const handleSendMessage = async (textToSend: string) => {
        const text = textToSend.trim();
        if (!text || isLoading) return;

        setInput('');
        const userMsg: ChatMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            // Keep history short to avoid hitting context token limit
            const history = messages.slice(-8); 
            const reply = await askClinicalAssistant(text, history, {
                items,
                techniques,
                locations,
                cartContents
            });

            setMessages(prev => [...prev, { role: 'model', content: reply }]);
            
            // Speak the reply if Text-To-Speech is enabled
            if (isTtsEnabled) {
                speakText(reply);
            }
        } catch (error) {
            console.error("Chat error:", error);
            const errorMsg = 'Lo siento, ha ocurrido un error de red o de configuración al conectar con mi cerebro de IA. Por favor, asegúrate de que internet funciona y reintenta.';
            setMessages(prev => [
                ...prev,
                {
                    role: 'model',
                    content: errorMsg
                }
            ]);
            
            if (isTtsEnabled) {
                speakText(errorMsg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickQuestion = (question: string) => {
        handleSendMessage(question);
    };

    const renderMessageContent = (text: string) => {
        return text.split('\n').map((line, idx) => {
            let content = line.trim();
            if (!content) return <div key={idx} className="h-2" />;

            // Check if bullet point
            const isBullet = content.startsWith('- ') || content.startsWith('* ');
            if (isBullet) {
                content = content.substring(2);
            }

            // Bold formatting **text** -> <strong>text</strong>
            const boldRegex = /\*\*(.*?)\*\*/g;
            const parts = [];
            let lastIndex = 0;
            let match;

            while ((match = boldRegex.exec(content)) !== null) {
                if (match.index > lastIndex) {
                    parts.push(content.substring(lastIndex, match.index));
                }
                parts.push(
                    <strong key={match.index} className="font-bold text-slate-900 dark:text-white">
                        {match[1]}
                    </strong>
                );
                lastIndex = boldRegex.lastIndex;
            }

            if (lastIndex < content.length) {
                parts.push(content.substring(lastIndex));
            }

            const elementContent = parts.length > 0 ? parts : content;

            if (isBullet) {
                return (
                    <li key={idx} className="ml-4 list-disc mb-1 text-sm text-slate-700 dark:text-slate-300">
                        {elementContent}
                    </li>
                );
            }

            return (
                <p key={idx} className="mb-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {elementContent}
                </p>
            );
        });
    };

    const quickSuggestions = [
        "¿Dónde están las gasas?",
        "¿Qué necesito para una vía central?",
        "¿Dónde está el ecógrafo?",
        "¿Qué material lleva el carro de parada?"
    ];

    return (
        <>
            {/* Floating Bubble Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 rounded-full bg-gradient-to-tr from-clinical-600 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-clinical-200 dark:shadow-none hover:shadow-2xl transition-all duration-300 active:scale-95 group relative ${isOpen ? 'rotate-90' : ''}`}
                    aria-label="Abrir asistente de IA"
                >
                    {isOpen ? (
                        <X size={26} />
                    ) : (
                        <>
                            <Sparkles size={24} className="group-hover:scale-110 transition-transform" />
                            {/* Simple pulse notification border */}
                            <span className="absolute inset-0 rounded-full border-4 border-clinical-300 dark:border-clinical-600 animate-ping opacity-20 pointer-events-none"></span>
                        </>
                    )}
                </button>
            </div>

            {/* Chatbot expanded window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[550px] max-h-[calc(100vh-12rem)] bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/80 shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
                    
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-tr from-clinical-600 to-teal-500 text-white flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                                <Sparkles size={18} className="text-white animate-pulse" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm tracking-wide">Asistente SMARTcart AI</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span className="text-[10px] opacity-90 font-medium">Asistencia Clínica Online</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* TTS Speaker Toggle Button */}
                            <button 
                                onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                                className={`p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors relative group`}
                                title={isTtsEnabled ? "Desactivar lectura en voz alta" : "Activar lectura en voz alta (Voz clínica)"}
                                type="button"
                            >
                                {isTtsEnabled ? (
                                    <Volume2 size={18} className="text-emerald-300 animate-pulse" />
                                ) : (
                                    <VolumeX size={18} className="opacity-70 hover:opacity-100" />
                                )}
                            </button>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                            >
                                <ChevronDown size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20 no-scrollbar">
                        {messages.map((msg, index) => {
                            const isUser = msg.role === 'user';
                            return (
                                <div 
                                    key={index}
                                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in zoom-in-95 duration-200`}
                                >
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm border ${
                                        isUser 
                                            ? 'bg-clinical-600 text-white border-clinical-600 rounded-tr-none' 
                                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700/80 rounded-tl-none'
                                    }`}>
                                        {!isUser && (
                                            <div className="flex items-center gap-1.5 mb-1.5 text-xs text-clinical-600 dark:text-clinical-400 font-bold uppercase tracking-wider">
                                                <Bot size={12} />
                                                <span>SMARTcart AI</span>
                                            </div>
                                        )}
                                        <div className="break-words">
                                            {isUser ? (
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            ) : (
                                                renderMessageContent(msg.content)
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Typing Loader */}
                        {isLoading && (
                            <div className="flex justify-start animate-pulse">
                                <div className="max-w-[80%] bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5 text-xs text-clinical-600 dark:text-clinical-400 font-bold uppercase tracking-wider">
                                        <RefreshCw size={12} className="animate-spin" />
                                        <span>Pensando...</span>
                                    </div>
                                    <div className="flex gap-1 py-1">
                                        <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce duration-300" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce duration-300" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce duration-300" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Listening Loader Visualizer */}
                        {isListening && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] bg-clinical-50/50 dark:bg-clinical-950/20 rounded-2xl rounded-tl-none px-4 py-3 border border-clinical-100 dark:border-clinical-900/50 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-xs text-clinical-600 dark:text-clinical-400 font-bold uppercase tracking-wider">
                                        <Mic size={14} className="animate-bounce text-red-500" />
                                        <span>Te escucho... habla ahora</span>
                                    </div>
                                    <div className="flex items-end gap-1 h-5 px-1 py-0.5">
                                        <span className="w-1.5 rounded-full bg-clinical-500 animate-pulse" style={{ height: '60%', animationDuration: '0.6s' }} />
                                        <span className="w-1.5 rounded-full bg-clinical-400 animate-pulse" style={{ height: '100%', animationDuration: '0.4s' }} />
                                        <span className="w-1.5 rounded-full bg-clinical-500 animate-pulse" style={{ height: '40%', animationDuration: '0.8s' }} />
                                        <span className="w-1.5 rounded-full bg-clinical-400 animate-pulse" style={{ height: '80%', animationDuration: '0.5s' }} />
                                        <span className="w-1.5 rounded-full bg-clinical-500 animate-pulse" style={{ height: '50%', animationDuration: '0.7s' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Suggestions Chips */}
                    {messages.length === 1 && !isLoading && (
                        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">Preguntas frecuentes</p>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                                {quickSuggestions.map((q, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleQuickQuestion(q)}
                                        className="text-xs bg-slate-50 hover:bg-clinical-50 text-slate-700 hover:text-clinical-700 dark:bg-slate-800 dark:hover:bg-clinical-950/40 dark:text-slate-300 dark:hover:text-clinical-400 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-1.5 text-left font-medium transition-all active:scale-[0.98]"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Bar */}
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage(input);
                        }}
                        className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 items-center"
                    >
                        {/* Microphone Button (Speech-to-Text) */}
                        <button
                            type="button"
                            onClick={toggleListening}
                            className={`h-10 w-10 p-0 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 ${
                                isListening
                                    ? 'bg-red-500 border-red-500 text-white animate-pulse shadow-md shadow-red-200 dark:shadow-none'
                                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                            title={isListening ? "Escuchando... haz clic para detener" : "Preguntar por voz (Manos libres)"}
                            disabled={isLoading}
                        >
                            {isListening ? <Mic size={18} /> : <MicOff size={18} />}
                        </button>

                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading || isListening}
                            placeholder={isListening ? "Escuchando... habla ahora" : "Escribe tu duda..."}
                            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 text-sm focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500 disabled:opacity-50"
                        />
                        <Button 
                            type="submit"
                            disabled={isLoading || isListening || !input.trim()}
                            className="h-10 w-10 p-0 rounded-xl flex items-center justify-center shrink-0"
                            aria-label="Enviar"
                        >
                            <Send size={16} />
                        </Button>
                    </form>
                </div>
            )}
        </>
    );
};
