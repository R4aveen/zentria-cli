import React, { useState, useEffect } from 'react';
import { Text } from 'ink';

export const Clock: React.FC<{
    color?: string;
    dimColor?: boolean;
    format?: 'full' | 'short';
}> = ({ color, dimColor, format = 'full' }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Mantener el reloj alineado al siguiente segundo para evitar saltos visuales.
        const interval = format === 'full' ? 1000 : 60000;
        const t = setInterval(() => setCurrentTime(new Date()), interval);
        return () => clearInterval(t);
    }, [format]);

    const display = format === 'full'
        ? currentTime.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        })
        : currentTime.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });

    const width = format === 'full' ? 14 : 8;

    return (
        <Text color={color} dimColor={dimColor}>
            {display.padEnd(width, ' ')}
        </Text>
    );
};
