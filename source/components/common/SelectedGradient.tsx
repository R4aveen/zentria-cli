import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../../contexts/ThemeContext.js';

interface SelectedGradientProps {
	text: string;
	isActive?: boolean;
	flexGrow?: number;
	paddingX?: number;
}

/**
 * Componente Global Zentria-Premium para textos seleccionados con degradado.
 * Optimizado para rendimiento: Agrupa caracteres por color para evitar el parpadeo en la terminal.
 */
export const SelectedGradient: React.FC<SelectedGradientProps> = ({ 
	text, 
	isActive = true, 
	flexGrow,
	paddingX = 1 
}) => {
	const { theme } = useTheme();
	
	const chunks = useMemo(() => {
		if (!isActive) return null;

		const gradient = theme.gradient || [theme.primary || '#ffffff'];
		const result: { text: string; color: string }[] = [];
		
		for (let i = 0; i < text.length; i++) {
			const colorIdx = Math.floor((i / text.length) * gradient.length);
			const bgColor = String(gradient[colorIdx] ?? theme.primary ?? '#ffffff');
			const char = text[i] || '';
			
			const lastIndex = result.length - 1;
			if (lastIndex >= 0 && result[lastIndex]?.color === bgColor) {
				result[lastIndex]!.text += char;
			} else {
				result.push({ text: char, color: bgColor });
			}
		}
		return result;
	}, [text, isActive, theme]);

	if (!isActive) {
		return (
			<Box paddingX={paddingX} flexGrow={flexGrow}>
				<Text color={theme.text} dimColor>{text}</Text>
			</Box>
		);
	}

	return (
		<Box flexGrow={flexGrow} paddingX={0}>
			{chunks?.map((chunk, i) => (
				<Text key={i} backgroundColor={chunk.color} color="black" bold>
					{chunk.text}
				</Text>
			))}
		</Box>
	);
};
