import React, {useState, useMemo} from 'react';
import {Box, Text, useInput} from 'ink';
import {themes, themeNames} from '../constants/themes.js';
import {useTheme} from '../contexts/ThemeContext.js';
import {GradientText} from './common/GradientText.js';
import {tinyAsciiLogo} from '../constants/ascii-art.js';
import {useTerminalSize} from '../hooks/useTerminalSize.js';
import {SelectedGradient} from './common/SelectedGradient.js';

interface ThemeSelectorProps {
	onBack: () => void;
	isActive?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
	onBack,
	isActive = true,
}) => {
	const {theme: currentTheme, setTheme} = useTheme();
	const [selectedIndex, setSelectedIndex] = useState(
		themeNames.indexOf(currentTheme.name),
	);
	const {columns, rows} = useTerminalSize();

	// Responsive Thresholds
	const isWide = columns >= 90;
	const isTall = rows >= 22;
	const maxVisibleItems = isTall ? 6 : 4;

	const previewTheme = themes[themeNames[selectedIndex]!]!;

	// Sliding Window Pagination Logic
	const visibleRange = useMemo(() => {
		let start = Math.max(0, selectedIndex - Math.floor(maxVisibleItems / 2));
		let end = start + maxVisibleItems;

		if (end > themeNames.length) {
			end = themeNames.length;
			start = Math.max(0, end - maxVisibleItems);
		}
		return {start, end};
	}, [selectedIndex, maxVisibleItems]);

	const visibleThemeNames = themeNames.slice(
		visibleRange.start,
		visibleRange.end,
	);

	useInput((_input, key) => {
		if (!isActive) return;
		if (key.escape) {
			onBack();
			return;
		}
		if (key.upArrow) {
			setSelectedIndex(prev => (prev > 0 ? prev - 1 : themeNames.length - 1));
		}
		if (key.downArrow) {
			setSelectedIndex(prev => (prev < themeNames.length - 1 ? prev + 1 : 0));
		}
		if (key.return) {
			setTheme(themeNames[selectedIndex]!);
		}
	});

	return (
		<Box
			flexDirection="column"
			width="100%"
			alignItems="center"
			justifyContent="center"
		>
			{/* Title & Pagination Info */}
			<Box
				marginBottom={1}
				justifyContent="space-between"
				width={isWide ? 80 : '95%'}
			>
				<Text bold color={previewTheme.primary}>
					✴︎ SELECCIONAR TEMA
				</Text>
				<Text color={previewTheme.textDim} italic>
					[ {selectedIndex + 1} / {themeNames.length} ]
				</Text>
			</Box>

			<Box
				flexDirection={isWide ? 'row' : 'column'}
				width="100%"
				justifyContent="center"
				alignItems="center"
			>
				{/* LIST PANEL */}
				<Box
					flexDirection="column"
					width={isWide ? 42 : '95%'}
					borderStyle="single"
					borderColor={previewTheme.border}
					paddingX={1}
					flexShrink={0}
				>
					{visibleThemeNames.map((name, index) => {
						const absoluteIndex = visibleRange.start + index;
						const t = themes[name]!;
						const isSelected = absoluteIndex === selectedIndex;
						const isCurrent = name === currentTheme.name;

						// Fixed width label to handle emojis gracefully and avoid border "pushing"
						const labelText = ` ${t.label} ${isCurrent ? '(actual)' : ''} `;

						return (
							<Box key={name} flexDirection="column" width="100%" paddingY={0}>
								{isSelected ? (
									<Box
										borderStyle="single" // Cambiado de "bold" a "single"
										borderColor={previewTheme.primary}
										width="100%"
										flexShrink={0}
									>
										<SelectedGradient
											text={labelText.padEnd(isWide ? 36 : 30)}
											isActive={true}
											flexGrow={1}
										/>
									</Box>
								) : (
									// Alineación vertical para ítems no seleccionados
									<Box
										paddingX={2}
										paddingY={0}
										height={3}
										justifyContent="center"
										flexDirection="column"
									>
										<Text color={previewTheme.textDim} wrap="truncate-end">
											· {t.label} {isCurrent ? '(actual)' : ''}
										</Text>
									</Box>
								)}
							</Box>
						);
					})}
				</Box>

				{/* PREVIEW PANEL */}
				{isTall && (
					<Box
						flexDirection="column"
						width={isWide ? 42 : '95%'}
						marginLeft={isWide ? 2 : 0}
						marginTop={isWide ? 0 : 1}
						borderStyle="single" // Cambiado de "double" a "single"
						borderColor={previewTheme.accent}
						paddingX={1}
						flexShrink={0}
					>
						{/* Título limpio sin borde anidado para evitar bugs de renderizado */}
						<Box marginBottom={1} justifyContent="center" paddingBottom={1}>
							<Text bold color={previewTheme.primary}>
								₊˚ෆ VISTA PREVIA
							</Text>
						</Box>

						{/* Quitamos height={7} para que el logo no se deforme/corte */}
						<Box
							marginY={1}
							justifyContent="center"
							alignItems="center"
							flexShrink={0}
						>
							<GradientText
								text={tinyAsciiLogo}
								gradient={previewTheme.gradient}
							/>
						</Box>

						<Box flexDirection="column" paddingLeft={1} marginTop={1}>
							<Text color={previewTheme.primary}>
								╰┈➤ Primario: {previewTheme.primary}
							</Text>
							<Text color={previewTheme.secondary}>
								╰┈➤ Secundario: {previewTheme.secondary}
							</Text>
							<Text color={previewTheme.accent}>
								╰┈➤ Acento: {previewTheme.accent}
							</Text>
						</Box>
					</Box>
				)}
			</Box>

			{/* FOOTER HINTS */}
			<Box marginTop={1} width={isWide ? 80 : '95%'} justifyContent="center">
				<Text color={previewTheme.textDim} italic>
					╰┈➤ ↑↓ Navegar ⋆ ENTER Aplicar ⋆ ESC Volver
				</Text>
			</Box>
		</Box>
	);
};
