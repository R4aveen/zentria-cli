import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import ptp from 'pdf-to-printer';
import { exec } from 'child_process';
import { useTheme } from '../../contexts/ThemeContext.js';
import { OfflineService } from '../../services/offline.service.js';
import { OfflineItem } from '../../types/offline.types.js';
import { OfflinePrintService } from '../../services/offline-print.service.js';
import { SelectedGradient } from '../../components/common/SelectedGradient.js';

// --- Componentes Atómicos Zentria ---

interface BadgeProps {
	children: React.ReactNode;
	type?: 'primary' | 'success' | 'error' | 'info';
}

const Kbd: React.FC<BadgeProps> = ({ children, type = 'primary' }) => {
	const { theme } = useTheme();
	const colors: Record<string, string> = {
		primary: theme.primary,
		success: theme.success,
		error: theme.error,
		info: theme.accent 
	};
	const color = colors[type] || theme.primary;

	return (
		<Box marginRight={1}>
			<Text color="black" backgroundColor={color} bold>
				{` ${children} `}
			</Text>
		</Box>
	);
};

const StepLine = ({ currentStep, columns }: { currentStep: string; columns: number }) => {
	const { theme } = useTheme();
	const isUltraCompact = columns < 70;
	const steps = [
		{ id: 'mode', label: isUltraCompact ? '1' : '1. FLUJO' },
		{ id: 'printer', label: isUltraCompact ? '2' : '2. SALIDA' },
		{ id: 'excel', label: isUltraCompact ? '3' : '3. DATOS' },
		{ id: 'scan', label: isUltraCompact ? '4' : '4. LISTO' }
	];
	const getIdx = (s: string) => ['mode', 'printer', 'excel', 'loading', 'preview', 'scan'].indexOf(s);
	const currentIdx = getIdx(currentStep);

	return (
		<Box marginBottom={1} borderStyle="single" borderColor={theme.border} paddingX={1} justifyContent="center" width="100%">
			{steps.map((s, i) => {
				const isPast = i < (currentIdx === 3 || currentIdx === 4 ? 2 : currentIdx === 5 ? 3 : currentIdx);
				const isCurrent = s.id === (currentStep === 'loading' || currentStep === 'preview' ? 'excel' : currentStep);
				
				return (
					<Box key={s.id} alignItems="center">
						<Text color={isCurrent ? theme.primary : isPast ? theme.success : theme.text} bold={isCurrent} dimColor={!isCurrent && !isPast}>
							{isPast ? '●' : isCurrent ? '◎' : '○'} {s.label}
						</Text>
						{i < steps.length - 1 && <Text color={theme.border} dimColor={true}>  ──  </Text>}
					</Box>
				);
			})}
		</Box>
	);
};

const LoadingMock: React.FC<{ message: string }> = ({ message }) => {
	const { theme } = useTheme();
	const [frame, setFrame] = useState(0);
	const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
	useEffect(() => {
		const t = setInterval(() => setFrame(f => (f + 1) % frames.length), 80);
		return () => clearInterval(t);
	}, []);
	return (
		<Box paddingY={1} alignItems="center">
			<Text color={theme.primary} bold>{frames[frame]}</Text>
			<Text color={theme.text}> {message}</Text>
		</Box>
	);
};

const openFileDialog = (): Promise<string | null> => {
	return new Promise((resolve) => {
		const psScript = `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = 'Excel Files (*.xlsx)|*.xlsx'; $f.Title = 'Seleccione el archivo de inventario'; $f.ShowHelp = $false; if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $f.FileName; }`;
		exec(`powershell -Sta -NoProfile -Command "${psScript}"`, (error, stdout) => {
			if (error) { resolve(null); return; }
			resolve(stdout.trim() || null);
		});
	});
};

interface OfflineTicketModuleProps {
	isActive?: boolean;
}

export const OfflineTicketModule: React.FC<OfflineTicketModuleProps> = ({ isActive = true }) => {
	const { theme } = useTheme();
	const { stdout } = useStdout();
	const columns = stdout?.columns || 100;
	const rows = stdout?.rows || 24;
	
	const isCompact = columns < 100;
	const isTall = rows >= 20;
	const paddingX = columns < 80 ? 1 : 2;

	const [step, setStep] = useState<'mode' | 'printer' | 'excel' | 'loading' | 'preview' | 'scan'>('mode');
	const [printMode, setPrintMode] = useState<'manual' | 'auto'>('auto');
	const [printers, setPrinters] = useState<ptp.Printer[]>([]);
	const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);
	const [items, setItems] = useState<OfflineItem[]>([]);
	const [excelError, setExcelError] = useState('');
	const [loadingMsg, setLoadingMsg] = useState('');
	
	const [scanBuffer, setScanBuffer] = useState('');
	const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | 'loading' } | null>(null);
	const [history, setHistory] = useState<{msg: string, type: string}[]>([]);
	
	const [printerSelectedIndex, setPrinterSelectedIndex] = useState(0);
	const isProcessing = useRef(false);
	const lastProcessedSerial = useRef('');

	const printerOptions = useMemo(() => [
		{ label: '★ Impresora Predeterminada', value: 'default' },
		...printers.map(p => ({ label: p.name, value: p.name }))
	], [printers]);

	const visiblePrinters = useMemo(() => {
		const limit = isTall ? 6 : 4;
		const start = Math.floor(printerSelectedIndex / limit) * limit;
		return printerOptions.slice(start, start + limit);
	}, [printerOptions, printerSelectedIndex, isTall]);

	useEffect(() => {
		if (!scanMessage || scanMessage.type === 'loading') return;
		setHistory(prev => [{ msg: scanMessage.text, type: scanMessage.type }, ...prev].slice(0, 10));
		const t = setTimeout(() => setScanMessage(null), 4000);
		return () => { clearTimeout(t); };
	}, [scanMessage]);

	useEffect(() => {
		if (step === 'scan' && scanBuffer.length >= 4) {
			const value = scanBuffer.trim().toUpperCase();
			const found = items.find(i => i.serial === value);
			if (found && !isProcessing.current) {
				handleExecutePrint(found);
			}
		}
	}, [scanBuffer, step, items]);

	useEffect(() => {
		if (step === 'printer' && printers.length === 0) {
			ptp.getPrinters().then(setPrinters).catch(() => {});
		}
	}, [step, printers.length]);

	const handleExecutePrint = (found: OfflineItem) => {
		if (isProcessing.current || (lastProcessedSerial.current === found.serial && scanBuffer === '')) return;
		isProcessing.current = true;
		lastProcessedSerial.current = found.serial;
		
		setScanMessage({ text: `Enviando ${found.serial}...`, type: 'loading' });
		setScanBuffer(''); 

		const task = printMode === 'auto' 
			? OfflinePrintService.printAuto(found, selectedPrinter) 
			: OfflinePrintService.printManual(found);
			
		task.then(() => setScanMessage({ text: `IMP: ${found.serial} OK`, type: 'success' }))
			.catch((err) => setScanMessage({ text: `ERR: ${err.message}`, type: 'error' }))
			.finally(() => {
				isProcessing.current = false;
				setTimeout(() => { lastProcessedSerial.current = ''; }, 1000);
			});
	};

	useInput((input, key) => {
		if (!isActive) return;
		if (key.escape) {
			if (step === 'printer') setStep('mode');
			else if (step === 'excel') setStep('printer');
			else if (step === 'preview') setStep('excel');
			else if (step === 'scan') setStep('preview');
			return;
		}

		if (step === 'mode') {
			if (key.upArrow || key.downArrow) {
				setPrintMode(prev => prev === 'auto' ? 'manual' : 'auto');
			} else if (key.return) {
				setStep('printer');
			}
		} else if (step === 'printer') {
			if (key.upArrow) setPrinterSelectedIndex(p => (p <= 0 ? printerOptions.length - 1 : p - 1));
			else if (key.downArrow) setPrinterSelectedIndex(p => (p >= printerOptions.length - 1 ? 0 : p + 1));
			else if (key.return) {
				const s = printerOptions[printerSelectedIndex];
				if (s) { setSelectedPrinter(s.value === 'default' ? null : s.value); setStep('excel'); }
			}
		} else if (step === 'excel' && key.return) {
			handlePickFile();
		} else if (step === 'preview' && key.return) {
			setStep('scan');
		} else if (step === 'scan') {
			if (key.return) {
				const v = scanBuffer.trim().toLowerCase();
				if (!v) return;
				if (v === ':r') { setScanBuffer(''); setStep('excel'); return; }
				if (v === ':p') { setScanBuffer(''); setStep('printer'); return; }
				const f = items.find(i => i.serial === v.toUpperCase());
				if (!f) { setScanMessage({ text: `No existe la serie: ${v.toUpperCase()}`, type: 'error' }); setScanBuffer(''); }
				else handleExecutePrint(f);
			} else if (key.backspace) {
				setScanBuffer(p => p.slice(0, -1));
			} else if (input) {
				setScanBuffer(p => p + input);
			}
		}
	});

	const handlePickFile = async () => {
		setExcelError(''); setLoadingMsg('Abriendo explorador...'); setStep('loading');
		const p = await openFileDialog();
		if (!p) { setExcelError('Selección cancelada.'); setStep('excel'); return; }
		setLoadingMsg('Analizando Excel...');
		setTimeout(() => {
			try {
				const parsed = OfflineService.parseExcel(p);
				setItems(parsed); setStep('preview');
			} catch (e: any) { setExcelError(e.message); setStep('excel'); }
			finally { setLoadingMsg(''); }
		}, 800);
	};

	return (
		<Box flexDirection="column" paddingX={paddingX} paddingY={isTall ? 1 : 0} flexGrow={1}>
			{/* TITULO */}
			<Box justifyContent="space-between" marginBottom={1} borderStyle="single" borderColor={theme.border} paddingX={2}>
				<Box>
					<Kbd type="primary">OFFLINE</Kbd>
					<Text color={theme.text} bold wrap="truncate-end">  ZENTRIA TICKET SYSTEM  </Text>
				</Box>
				{columns > 80 && <Text color={theme.text} bold dimColor={true}>v1.2.0 (ESTABLE)</Text>}
			</Box>

			<StepLine currentStep={step} columns={columns} />

			<Box flexDirection={isCompact ? "column" : "row"} flexGrow={1}>
				{/* MAIN PANEL */}
				<Box flexDirection="column" width={isCompact ? "100%" : "65%"} borderStyle="round" borderColor={theme.borderActive} padding={1} minHeight={isTall ? 10 : 8}>
					
					{step === 'mode' && (
						<Box flexDirection="column" justifyContent="center" flexGrow={1}>
							<Box marginBottom={1}>
								<Text bold color={theme.primary}>➜ Flujo de trabajo:</Text>
							</Box>
							<Box flexDirection="column" paddingLeft={2}>
								<Box borderStyle="double" borderColor={printMode === 'auto' ? theme.primary : theme.border} paddingX={1} marginBottom={1} width="100%">
									<SelectedGradient 
										text=" [AUTO] IMPRESIÓN DIRECTA " 
										isActive={printMode === 'auto'} 
										flexGrow={1}
									/>
								</Box>
								<Box borderStyle="single" borderColor={printMode === 'manual' ? theme.primary : theme.border} paddingX={1} width="100%">
									<SelectedGradient 
										text=" [MANUAL] ABRIR WORD / PDF " 
										isActive={printMode === 'manual'} 
										flexGrow={1}
									/>
								</Box>
							</Box>
						</Box>
					)}

					{step === 'printer' && (
						<Box flexDirection="column" paddingX={1} flexGrow={1}>
							<Box marginBottom={1}>
								<Text bold color={theme.primary} wrap="truncate-end">Salida (Pag {Math.floor(printerSelectedIndex/visiblePrinters.length) + 1}):</Text>
							</Box>
							<Box flexDirection="column" marginY={1}>
								{visiblePrinters.map((p) => {
									const isS = printerOptions[printerSelectedIndex]?.value === p.value;
									const label = `${isS ? '➤ ' : '  '} ${p.label}`.padEnd(30);
									return (
										<Box key={p.value} paddingX={1} borderStyle={isS ? "double" : undefined} borderColor={isS ? theme.primary : theme.border}>
											<SelectedGradient text={label} isActive={isS} flexGrow={1} />
										</Box>
									);
								})}
							</Box>
						</Box>
					)}

					{(step === 'excel' || step === 'loading') && (
						<Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
							{step === 'loading' ? <LoadingMock message={loadingMsg} /> : (
								<>
									<Box marginBottom={1}><Text color={theme.text} wrap="truncate-end">Base de datos <Text bold color={theme.primary}>(.xlsx)</Text></Text></Box>
									<Box marginTop={1} alignItems="center">
										<Kbd>ENTER</Kbd>
										<Text color={theme.text} bold> para explorar</Text>
									</Box>
									{excelError && <Box marginTop={1}><Text color={theme.error} bold wrap="truncate-end">⚠ {excelError}</Text></Box>}
								</>
							)}
						</Box>
					)}

					{step === 'preview' && (
						<Box flexDirection="column" flexGrow={1} justifyContent="space-between">
							<Box flexDirection="column">
								<Text color={theme.success} bold>✓ Datos cargados ({items.length} registros)</Text>
								<Box flexDirection="column" marginY={1} paddingX={1} borderStyle="single" borderColor={theme.border}>
									{items.slice(0, isTall ? 6 : 4).map((item, i) => (
										<Box key={i}>
											<Text color={theme.text} dimColor={true} wrap="truncate-end">
												• <Text color={theme.text} bold>{item.serial}</Text> | {item.data["Marca"] || '??'}
											</Text>
										</Box>
									))}
								</Box>
							</Box>
							<Box alignSelf="center" paddingX={1}>
								<Box borderStyle="bold" borderColor={theme.success} paddingX={2}>
									<Text color={theme.success} bold>ENTER: COMENZAR ESCANEO</Text>
								</Box>
							</Box>
						</Box>
					)}

					{step === 'scan' && (
						<Box flexDirection="column" flexGrow={1} justifyContent="center">
							<Box borderStyle="double" borderColor={theme.primary} paddingX={2} marginBottom={1} justifyContent="space-between" width="100%">
								<Text color={theme.primary} bold>LECTURA: </Text>
								<Text color={theme.text} bold italic wrap="truncate-end">{scanBuffer || 'Esperando...'}</Text>
							</Box>
							{scanMessage && (
								<Box padding={1} borderStyle="single" borderColor={scanMessage.type === 'error' ? theme.error : scanMessage.type === 'success' ? theme.success : theme.primary}>
									<Text color={theme.text} bold wrap="truncate-end">{scanMessage.text}</Text>
								</Box>
							)}
						</Box>
					)}
				</Box>

				{/* SIDEBAR - Dinámico */}
				<Box flexDirection={isCompact ? "row" : "column"} width={isCompact ? "100%" : "35%"} marginLeft={isCompact ? 0 : 2} marginTop={isCompact ? 1 : 0}>
					<Box flexDirection="column" borderStyle="round" borderColor={theme.border} paddingX={1} flexGrow={1} marginBottom={isCompact ? 0 : 1} marginRight={isCompact ? 1 : 0}>
						<Box paddingX={1}><Text color="black" backgroundColor={theme.border} bold> STATUS </Text></Box>
						<Box flexDirection="column" marginTop={1}>
							<Text color={theme.text} dimColor={true}>Modo: <Text color={theme.primary} bold dimColor={false}>{printMode.toUpperCase()}</Text></Text>
							<Text color={theme.text} dimColor={true} wrap="truncate-end">Out: <Text color={theme.secondary} bold dimColor={false}>{selectedPrinter || 'Predet.'}</Text></Text>
							<Text color={theme.text} dimColor={true}>Regs: <Text color={theme.success} bold dimColor={false}>{items.length}</Text></Text>
						</Box>
					</Box>

					<Box flexDirection="column" flexGrow={2} borderStyle="round" borderColor={theme.border} paddingX={1} height={isCompact ? (isTall ? 10 : 6) : undefined}>
						<Box paddingX={1}><Text color="black" backgroundColor={theme.border} bold> LOG </Text></Box>
						<Box flexDirection="column" marginTop={1}>
							{history.length === 0 ? <Text color={theme.text} dimColor={true} italic>Listo.</Text> : (
								history.slice(0, isTall ? 8 : 4).map((h, i) => (
									<Box key={i}>
										<Text color={h.type === 'error' ? theme.error : h.type === 'success' ? theme.success : theme.text} wrap="truncate-end" dimColor={i > 0}>
											{i === 0 ? '» ' : '  '}{h.msg}
										</Text>
									</Box>
								))
							)}
						</Box>
					</Box>
				</Box>
			</Box>

			{/* FOOTER */}
			<Box marginTop={1} justifyContent="center" borderStyle="single" borderColor={theme.border} paddingX={1} width="100%">
				<Box marginRight={isCompact ? 1 : 2} alignItems="center"><Kbd>ESC</Kbd><Text color={theme.text} bold dimColor={true} wrap="truncate-end"> Volver</Text></Box>
				{columns > 85 && (
					<Box marginRight={2} alignItems="center"><Kbd>:R</Kbd><Text color={theme.text} bold dimColor={true}> Recargar</Text></Box>
				)}
				<Box alignItems="center"><Kbd>CTRL+C</Kbd><Text color={theme.text} bold dimColor={true} wrap="truncate-end"> Salir</Text></Box>
			</Box>
		</Box>
	);
};