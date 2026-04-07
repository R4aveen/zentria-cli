import React, { useState, useEffect } from 'react';
import { Text } from 'ink';

export const Clock: React.FC<{
    color?: string;
    dimColor?: boolean;
    format?: 'full' | 'short';
}> = ({ color, dimColor, format = 'full' }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Actualizar cada segundo para tiempo completo, o cada 60s para formato corto
        const interval = format === 'full' ? 1000 : 60000;
        const t = setInterval(() => setCurrentTime(new Date()), interval);
        return () => clearInterval(t);
    }, [format]);

    const display = format === 'full' 
        ? currentTime.toLocaleTimeString()
        : currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return <Text color={color} dimColor={dimColor}>{display}</Text>;
};
