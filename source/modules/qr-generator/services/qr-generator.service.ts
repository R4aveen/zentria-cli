import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import { Jimp } from 'jimp';
import QRCode from 'qrcode';
import {
  DEFAULT_QR_OPTIONS,
  GenerateQrRequest,
  GenerateQrResult,
  QrCustomizationOptions,
} from '../types.js';

const sanitizeFileName = (input: string) =>
  input
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9-_\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60) || 'qr_zentria';

const getDateParts = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = String(now.getFullYear());

  return {
    dd,
    mm,
    yyyy,
    formatted: `${dd}/${mm}/${yyyy}`,
    fileSafe: `${dd}-${mm}-${yyyy}`,
  };
};

const detectDesktopPath = () => {
  const home = homedir();
  const candidates = [
    join(home, 'Desktop'),
    join(home, 'OneDrive', 'Desktop'),
    join(home, 'Escritorio'),
  ];

  return candidates.find(path => existsSync(path));
};

const ensureDirectory = (path: string) => {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const sanitizeHexColor = (color: string, fallback: string) => {
  const normalized = color.trim();
  const sixDigit = /^#[0-9a-fA-F]{6}$/;
  const threeDigit = /^#[0-9a-fA-F]{3}$/;

  if (sixDigit.test(normalized)) {
    return normalized.toUpperCase();
  }

  if (threeDigit.test(normalized)) {
    const c = normalized.slice(1).toUpperCase();
    return `#${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`;
  }

  return fallback;
};

const normalizeOptions = (
  options?: QrCustomizationOptions,
): QrCustomizationOptions => {
  const merged: QrCustomizationOptions = {
    ...DEFAULT_QR_OPTIONS,
    ...options,
  };

  return {
    size: clamp(Math.round(merged.size), 256, 2000),
    margin: clamp(Math.round(merged.margin), 0, 8),
    darkColor: sanitizeHexColor(merged.darkColor, DEFAULT_QR_OPTIONS.darkColor),
    lightColor: sanitizeHexColor(merged.lightColor, DEFAULT_QR_OPTIONS.lightColor),
    errorCorrectionLevel: merged.errorCorrectionLevel,
    logoScale: clamp(merged.logoScale, 0.1, 0.4),
    logoBackgroundColor: sanitizeHexColor(
      merged.logoBackgroundColor,
      DEFAULT_QR_OPTIONS.logoBackgroundColor,
    ),
    logoBackgroundTransparent: Boolean(merged.logoBackgroundTransparent),
  };
};

const addLogoToQr = async (
  qrPath: string,
  logoPath: string,
  options: QrCustomizationOptions,
) => {
  const qrImage = await Jimp.read(qrPath);
  const logo = await Jimp.read(logoPath);

  const logoSize = clamp(
    Math.round(qrImage.bitmap.width * options.logoScale),
    48,
    Math.round(qrImage.bitmap.width * 0.4),
  );
  const logoPadding = Math.max(8, Math.round(logoSize * 0.12));
  const badgeSize = logoSize + logoPadding * 2;
  const centerX = Math.round((qrImage.bitmap.width - logoSize) / 2);
  const centerY = Math.round((qrImage.bitmap.height - logoSize) / 2);

  logo.contain({ w: logoSize, h: logoSize });

  if (options.logoBackgroundTransparent) {
    qrImage.composite(logo, centerX, centerY);
  } else {
    const badge = new Jimp({
      width: badgeSize,
      height: badgeSize,
      color: options.logoBackgroundColor,
    });

    const badgeX = Math.round((qrImage.bitmap.width - badgeSize) / 2);
    const badgeY = Math.round((qrImage.bitmap.height - badgeSize) / 2);
    badge.composite(logo, logoPadding, logoPadding);
    qrImage.composite(badge, badgeX, badgeY);
  }

  await qrImage.write(qrPath as `${string}.${string}`);
};

export const generateQrImage = async (
  request: GenerateQrRequest,
): Promise<GenerateQrResult> => {
  const options = normalizeOptions(request.options);
  const date = getDateParts();
  const safeName = sanitizeFileName(request.fileName);
  const fileName = `${safeName}_${date.fileSafe}.png`;
  const homeOutputDir = join(homedir(), 'Zentria', 'GeneraTuQR');
  const desktopBase = detectDesktopPath();
  const desktopOutputDir = desktopBase ? join(desktopBase, 'GeneraTuQR') : undefined;

  ensureDirectory(homeOutputDir);
  if (desktopOutputDir) {
    ensureDirectory(desktopOutputDir);
  }

  const homeOutputPath = join(homeOutputDir, fileName);

  await QRCode.toFile(homeOutputPath, request.content, {
    width: options.size,
    margin: options.margin,
    color: {
      dark: options.darkColor,
      light: options.lightColor,
    },
    errorCorrectionLevel: options.errorCorrectionLevel,
  });

  if (request.logoPath) {
    await addLogoToQr(homeOutputPath, request.logoPath, options);
  }

  let desktopOutputPath: string | undefined;
  if (desktopOutputDir) {
    desktopOutputPath = join(desktopOutputDir, fileName);
    copyFileSync(homeOutputPath, desktopOutputPath);
  }

  const metadataPath = join(homeOutputDir, `${safeName}_${date.fileSafe}.txt`);
  const metadata = [
    `Nombre: ${fileName}`,
    `Fecha: ${date.formatted}`,
    `Tipo QR: ${request.qrType || 'text'}`,
    `Contenido: ${request.content}`,
    `Logo: ${request.logoPath ? basename(request.logoPath) : 'Sin logo'}`,
    `Dimensión: ${options.size}px`,
    `Margen: ${options.margin}`,
    `Color oscuro: ${options.darkColor}`,
    `Color claro: ${options.lightColor}`,
    `Corrección de error: ${options.errorCorrectionLevel}`,
    `Escala logo: ${Math.round(options.logoScale * 100)}%`,
    `Fondo logo: ${options.logoBackgroundTransparent ? 'Transparente' : options.logoBackgroundColor}`,
    `Guardado en usuario: ${homeOutputPath}`,
    desktopOutputPath ? `Guardado en escritorio: ${desktopOutputPath}` : 'Guardado en escritorio: No detectado',
  ].join('\n');

  writeFileSync(metadataPath, metadata, 'utf8');

  return {
    formattedDate: date.formatted,
    homeOutputPath,
    desktopOutputPath,
    metadataPath,
  };
};
