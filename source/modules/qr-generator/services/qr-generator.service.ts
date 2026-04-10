import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import { Jimp } from 'jimp';
import QRCode from 'qrcode';
import { GenerateQrRequest, GenerateQrResult } from '../types.js';

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

const addLogoToQr = async (qrPath: string, logoPath: string) => {
  const qrImage = await Jimp.read(qrPath);
  const logo = await Jimp.read(logoPath);

  const logoSize = Math.max(72, Math.round(qrImage.bitmap.width * 0.22));
  const logoPadding = Math.max(8, Math.round(logoSize * 0.12));
  const badgeSize = logoSize + logoPadding * 2;

  logo.contain({ w: logoSize, h: logoSize });

  const badge = new Jimp({
    width: badgeSize,
    height: badgeSize,
    color: 0xffffffff,
  });

  const badgeX = Math.round((qrImage.bitmap.width - badgeSize) / 2);
  const badgeY = Math.round((qrImage.bitmap.height - badgeSize) / 2);

  badge.composite(logo, logoPadding, logoPadding);
  qrImage.composite(badge, badgeX, badgeY);
  await qrImage.write(qrPath as `${string}.${string}`);
};

export const generateQrImage = async (
  request: GenerateQrRequest,
): Promise<GenerateQrResult> => {
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
    width: 900,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });

  if (request.logoPath) {
    await addLogoToQr(homeOutputPath, request.logoPath);
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
    `Contenido: ${request.content}`,
    `Logo: ${request.logoPath ? basename(request.logoPath) : 'Sin logo'}`,
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
