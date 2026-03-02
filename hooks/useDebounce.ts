import { useState, useEffect } from 'react';

// Hook para retrasar la actualización de un valor (Debounce)
// Útil para buscadores de texto, evita que React se actualice por cada pulsación de tecla.
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Establece el valor debounced tras el retraso especificado
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cancela el timeout si el valor cambia o si el componente se desmonta.
        // Esto asegura que si el usuario sigue tecleando, reiniciamos el temporizador.
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
