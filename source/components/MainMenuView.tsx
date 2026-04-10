import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useTheme } from '../contexts/ThemeContext.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { SelectedGradient } from './common/SelectedGradient.js';
import { AppMode } from '../services/auth.service.js';
import { Clock } from './common/Clock.js';

interface MainMenuViewProps {
	mode?: AppMode;
	setView: (
		view:
			| 'menu'
			| 'scanner'
			| 'global-scanner'
			| 'info'
			| 'theme'
			| 'settings'
			| 'qr-generator',
	) => void;
	onLogout: () => void;
	onExit: () => void;
	isActive?: boolean;
}

interface GridItem {
	label: string;
	value: string;
	desc: string;
}

const operationItems: GridItem[] = [
	{
		label: '✧ IMPRESIÓN DE REVISIONES',
		value: 'print',
		desc: 'Escaneo y despacho de etiquetas térmicas',
	},
	{
		label: '◈ GENERA TU QR',
		value: 'qr-generator',
		desc: 'Crear QR con texto y logo personalizado',
	},
];

const Dashboard: React.FC<{ mode?: string; theme: any; isWide: boolean }> = ({
	mode,
	theme,
	isWide,
}) => (
	<Box
		flexDirection="column"
		borderStyle="round"
		borderColor={theme.border}
		paddingX={1}
		width={isWide ? 28 : '100%'}
		marginBottom={isWide ? 0 : 1}
	>
		<Box paddingX={1}>
			<Text color="black" backgroundColor={theme.border} bold>
				{' '}
				SYSTEM INFO{' '}
			</Text>
		</Box>
		<Box flexDirection="column" marginTop={1}>
			<Text color={theme.text} dimColor>
				USUARIO:{' '}
				<Text color={theme.primary} bold dimColor={false}>
					ZENTRIA-OP
				</Text>
			</Text>
			<Text color={theme.text} dimColor>
				SUCURSAL:{' '}
				<Text color={theme.secondary} bold dimColor={false}>
					BODEGA-主
				</Text>
			</Text>
			<Text color={theme.text} dimColor>
				MODO:{' '}
				<Text color={theme.success} bold dimColor={false}>
					{mode?.toUpperCase()}
				</Text>
			</Text>
			<Text color={theme.text} dimColor>
				HORA: <Clock color={theme.text} dimColor={false} format="full" />
			</Text>
		</Box>
	</Box>
);

export const MainMenuView: React.FC<MainMenuViewProps> = ({
	mode,
	setView,
	onLogout,
	onExit,
	isActive = true,
}) => {
	const { theme } = useTheme();
	const { columns, rows } = useTerminalSize();

	const isWide = columns >= 95;
	const isTall = rows >= 18;

	const [focusedIndex, setFocusedIndex] = useState(0);

	useInput((_input, key) => {
		if (!isActive) return;

		if (_input.toLowerCase() === 'q') {
			onExit();
			return;
		}

		if (_input.toLowerCase() === 'l') {
			onLogout();
			return;
		}

		if (_input.toLowerCase() === 'c') {
			setView('settings');
			return;
		}

		if (key.upArrow)
			setFocusedIndex(p => (p <= 0 ? operationItems.length - 1 : p - 1));
		if (key.downArrow)
			setFocusedIndex(p => (p >= operationItems.length - 1 ? 0 : p + 1));

		if (key.return) {
			const current = operationItems[focusedIndex]!;
			switch (current.value) {
				case 'print':
					if (mode === 'offline') setView('scanner');
					else setView('global-scanner');
					break;
				case 'qr-generator':
					setView('qr-generator');
					break;
			}
		}
	});

	const menuWidth = isWide ? Math.min(60, columns - 32) : '100%';


	return (
        <Box
            flexDirection="column"
            width="100%"
            height="100%"
            flexGrow={1}
            paddingX={isWide ? 2 : 1}
            justifyContent="space-between"
        >
            {/* Header: Salir / Cerrar Sesión */}
            <Box width="100%" justifyContent="space-between">
                <Box borderStyle="single" borderColor={theme.border} paddingX={1}>
                    <Text color={theme.text} dimColor>
                        [Q] ← SALIR
                    </Text>
                </Box>
                <Box borderStyle="single" borderColor={theme.border} paddingX={1}>
                    <Text color={theme.text} dimColor>
                        [L] ☾ CERRAR SESIÓN
                    </Text>
                </Box>
            </Box>

            {/* CONTENEDOR CENTRAL: Aquí es donde ocurre el centrado */}
            <Box
                flexDirection={isWide ? 'row' : 'column'}
                width="100%"
                alignItems="center" // Centra verticalmente los elementos entre sí (Dashboard vs Menu)
                justifyContent="center" // Centra el grupo entero horizontalmente
                flexGrow={1}
            >
                <Dashboard mode={mode} theme={theme} isWide={isWide} />

                <Box
                    flexDirection="column"
                    width={menuWidth}
                    marginLeft={isWide ? 4 : 0} // Un poco más de espacio si es ancho
                    alignItems={isWide ? 'flex-start' : 'center'}
                >
                    {isTall && (
                        <Box marginBottom={1}>
                            <Text color={theme.text} dimColor bold>
                                SELECCIONE UNA OPERACIÓN:
                            </Text>
                        </Box>
                    )}

                    {operationItems.map((item, idx) => {
                        const isSelected = idx === focusedIndex;
                        // Ajustamos el padding dinámico para que no rompa el centrado
                        const paddedLabel = `  ${item.label}  `.padEnd(
                            isWide ? 40 : Math.min(columns - 10, 40),
                        );

                        return (
                            <Box
                                key={item.value}
                                marginBottom={isSelected && isTall ? 1 : 0}
                                flexDirection="column"
                                width="100%"
                            >
                                <Box
                                    borderStyle={isSelected ? 'bold' : 'single'}
                                    borderColor={isSelected ? theme.primary : theme.border}
                                    width="100%"
                                >
                                    <SelectedGradient
                                        text={paddedLabel}
                                        isActive={isSelected}
                                    />
                                </Box>
                                {isSelected && isTall && (
                                    <Box paddingLeft={2} marginTop={-1}>
                                        <Text color={theme.accent} bold>
                                            ╰┈➤ {item.desc}
                                        </Text>
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            {/* Footer: Configuración */}
            <Box width="100%" justifyContent="flex-end">
                <Box borderStyle="single" borderColor={theme.border} paddingX={1}>
                    <Text color={theme.text} dimColor>
                        [C] ⚙ CONFIGURACIÓN
                    </Text>
                </Box>
            </Box>
        </Box>
    );
};