import QRCode from 'qrcode';
import ptp from 'pdf-to-printer';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  WidthType, ImageRun, TextRun, AlignmentType, BorderStyle,
  HeightRule, VerticalAlign, TableLayoutType,
} from 'docx';
import { TechnicalItem } from '../types/api.types.js';
import { AuthService } from './auth.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PrintService {
  private static extractValue(val: any): string {
    if (val == null) return '';
    if (typeof val === 'object') return String(val.label || val.value || val.name || '');
    return String(val);
  }

  private static getBatteryInfo(details: any) {
    if (details.battery_percentage) {
      return `${details.battery_percentage}%`;
    }
    if (details.battery_status) {
      return this.extractValue(details.battery_status);
    }
    return 'N/A';
  }

  private static getLogoDataUrl(): string {
    const logoPath = path.join(__dirname, '..', '..', 'public', 'logo_etiqueta.png');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      return `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
    return '';
  }

  static async generateHtml(item: TechnicalItem): Promise<string> {
    const qrCorporateUrl = 'https://www.ecopc.cl';
    const qr1DataUrl = await QRCode.toDataURL(qrCorporateUrl, { margin: 1 });
    const qr2DataUrl = await QRCode.toDataURL(item.serial_number || 'SIN-SERIE', { margin: 1 });

    const serialNumber = item.serial_number || 'SIN-SERIE';
    const details = item.details || {};
    const grade = this.extractValue(item.grade) || 'C';
    const clientName = item.customer_supplier?.name || 'SIN CLIENTE';

    const brand = this.extractValue(details.brand);
    const model = this.extractValue(details.model);
    const equipmentType = (this.extractValue(item.equipment_type) || 'notebook').toLowerCase();
    const observations = this.extractValue(details.observations) || 'SIN OBSERVACIÓN';

    const logoDataUrl = this.getLogoDataUrl();

    // Specs como texto inline (fluye como párrafo justificado, igual que el componente React)
    let specsFragments: string[] = [
      `<span style="font-weight:bold">OBSERVACIÓN: </span>${observations} `,
    ];

    switch (equipmentType) {
      case 'notebook':
        specsFragments.push(
          `<span style="font-weight:bold">PROCESADOR: </span>${this.extractValue(details.processor) || 'N/A'} `,
          `<span style="font-weight:bold">RAM: </span>${this.extractValue(details.ram_size)}GB ${details.ram_slots ? `(${details.ram_slots})` : ''} `,
          `<span style="font-weight:bold">DISCO: </span>${this.extractValue(details.storage_size)} ${this.extractValue(details.storage_technology)} `,
          `<span style="font-weight:bold">SO: </span>${this.extractValue(details.operating_system) || 'N/A'} `,
          `<span style="font-weight:bold">PANTALLA: </span>${this.extractValue(details.screen_inches)} `,
          `<span style="font-weight:bold">BATERÍA: </span>${this.getBatteryInfo(details)} `,
          `<span style="font-weight:bold">TECLADO: </span>${this.extractValue(details.keyboard_layout)} ${details.has_backlit_keyboard ? '(RETRO)' : ''} `,
        );
        break;
      case 'desktop':
        specsFragments.push(
          `<span style="font-weight:bold">PROCESADOR: </span>${this.extractValue(details.processor) || 'N/A'} `,
          `<span style="font-weight:bold">RAM: </span>${this.extractValue(details.ram_size)}GB ${details.ram_slots ? `(${details.ram_slots})` : ''} `,
          `<span style="font-weight:bold">DISCO: </span>${this.extractValue(details.storage_size)} ${this.extractValue(details.storage_technology)} `,
          `<span style="font-weight:bold">SO: </span>${this.extractValue(details.operating_system) || 'N/A'} `,
        );
        break;
      case 'aio':
        specsFragments.push(
          `<span style="font-weight:bold">PROCESADOR: </span>${this.extractValue(details.processor) || 'N/A'} `,
          `<span style="font-weight:bold">RAM: </span>${this.extractValue(details.ram_size)}GB ${details.ram_slots ? `(${details.ram_slots})` : ''} `,
          `<span style="font-weight:bold">DISCO: </span>${this.extractValue(details.storage_size)} ${this.extractValue(details.storage_technology)} `,
          `<span style="font-weight:bold">SO: </span>${this.extractValue(details.operating_system) || 'N/A'} `,
          `<span style="font-weight:bold">PANTALLA: </span>${this.extractValue(details.screen_inches)} `,
        );
        break;
      case 'monitor':
        specsFragments.push(
          `<span style="font-weight:bold">PANTALLA: </span>${this.extractValue(details.screen_inches)} `,
          `<span style="font-weight:bold">RESOLUCIÓN: </span>${this.extractValue(details.resolution) || 'N/A'} `,
        );
        break;
      case 'docking':
        specsFragments.push(
          `<span style="font-weight:bold">PUERTOS: </span>${this.extractValue(details.ports) || 'N/A'} `,
        );
        break;
      default:
        specsFragments.push(
          `<span style="font-weight:bold">PROCESADOR: </span>${this.extractValue(details.processor) || 'N/A'} `,
          `<span style="font-weight:bold">RAM: </span>${this.extractValue(details.ram_size)}GB ${details.ram_slots ? `(${details.ram_slots})` : ''} `,
          `<span style="font-weight:bold">DISCO: </span>${this.extractValue(details.storage_size)} ${this.extractValue(details.storage_technology)} `,
          `<span style="font-weight:bold">SO: </span>${this.extractValue(details.operating_system) || 'N/A'} `,
        );
        break;
    }

    // Cliente al final
    specsFragments.push(
      `<span style="font-weight:bold">CLIENTE: </span>${clientName}`,
    );

    const specsHtml = specsFragments.join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { 
            size: 80mm 60mm; 
            margin: 0 !important; 
          }
          
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm;
            height: 60mm;
            overflow: hidden;
            background: white;
            font-family: Arial, sans-serif;
            color: black;
          }

          .label-container {
            width: 80mm;
            height: 60mm;
            padding: 2mm;
            display: flex;
            flex-direction: column;
            position: relative;
            font-size: 9pt;
            overflow: hidden;
          }

          /* Fila 1: Logo (izq) + QR corporativo (der) */
          .row-logo {
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 16mm;
            margin-bottom: 1mm;
          }

          .logo-left {
            flex: 1;
            display: flex;
            align-items: center;
          }

          .logo-left img {
            max-height: 14mm;
            max-width: 100%;
            object-fit: contain;
          }

          .qr-corporate {
            width: 16mm;
            display: flex;
            justify-content: flex-end;
            align-items: center;
          }

          .qr-corporate img {
            width: 15mm;
            height: 15mm;
          }

          /* Fila 2: QR serie (izq) + detalles producto (der) */
          .row-details {
            display: flex;
            height: 18mm;
            margin-bottom: 1mm;
          }

          .qr-serial {
            width: 18mm;
            margin-right: 2mm;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .qr-serial img {
            width: 17mm;
            height: 17mm;
          }

          .product-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            line-height: 1.2;
          }

          .product-name {
            font-weight: bold;
            font-size: 10px;
            height: 2.4em;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .product-grade {
            font-size: 10px;
            font-weight: bold;
            margin-top: 1px;
          }

          .product-serial {
            font-size: 10px;
            font-weight: bold;
          }

          /* Fila 3: Especificaciones como texto justificado */
          .specs-text {
            font-size: 10px;
            line-height: 1.15;
            text-align: justify;
            overflow: hidden;
            flex: 1;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <!-- Fila 1: Logo + QR Corporativo -->
          <div class="row-logo">
            <div class="logo-left">
              ${logoDataUrl ? `<img src="${logoDataUrl}" alt="ECOPC" />` : '<span style="font-weight:bold;font-size:14px;">www.ecopc.cl</span>'}
            </div>
            <div class="qr-corporate">
              <img src="${qr1DataUrl}" />
            </div>
          </div>

          <!-- Fila 2: QR Serie + Detalles -->
          <div class="row-details">
            <div class="qr-serial">
              <img src="${qr2DataUrl}" />
            </div>
            <div class="product-info">
              <div class="product-name">${brand} ${model}</div>
              <div class="product-grade">Categoría ${grade}</div>
              <div class="product-serial">N° Serie: ${serialNumber}</div>
            </div>
          </div>

          <!-- Fila 3: Especificaciones -->
          <div class="specs-text">
            ${specsHtml}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static async print(item: TechnicalItem) {
    const html = await this.generateHtml(item);
    const tempPdf = path.join(os.tmpdir(), `zentria_label_${Date.now()}.pdf`);

    const browser = await puppeteer.launch({
      executablePath: AuthService.getChromePath(),
      headless: true
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 302, height: 227 }); 
    await page.setContent(html);
    await page.pdf({
      path: tempPdf,
      width: '80mm',
      height: '60mm',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      displayHeaderFooter: false,
      preferCSSPageSize: true
    });

    await browser.close();
    await ptp.print(tempPdf);
    fs.unlinkSync(tempPdf);
  }

  static async openLabelInWord(item: TechnicalItem) {
    const docxBuffer = await this.generateDocx(item);
    const tempDocx = path.join(os.tmpdir(), `zentria_label_${Date.now()}.docx`);
    fs.writeFileSync(tempDocx, docxBuffer);

    const command = `start winword "${tempDocx}"`;
    exec(command, (error) => {
      if (error) {
        const psFallback = `powershell -Command "Start-Process winword -ArgumentList '${tempDocx}'"`;
        exec(psFallback, (error2) => {
          if (error2) {
            exec(`start "" "${tempDocx}"`);
          }
        });
      }
    });
  }

  private static async generateDocx(item: TechnicalItem): Promise<Buffer> {
    // --- Datos ---
    const details = item.details || {};
    const brand = this.extractValue(details.brand);
    const model = this.extractValue(details.model);
    const grade = this.extractValue(item.grade) || 'C';
    const serialNumber = item.serial_number || 'SIN-SERIE';
    const clientName = item.customer_supplier?.name || 'SIN CLIENTE';
    const equipmentType = (this.extractValue(item.equipment_type) || 'notebook').toLowerCase();
    const observations = this.extractValue(details.observations) || 'SIN OBSERVACIÓN';

    // --- QR buffers ---
    const qrEcopcBuffer = await QRCode.toBuffer('https://www.ecopc.cl', { type: 'png', margin: 1, width: 150 });
    const qrSerialBuffer = await QRCode.toBuffer(serialNumber, { type: 'png', margin: 1, width: 150 });

    // --- Logo ---
    const logoPath = path.join(__dirname, '..', '..', 'public', 'logo_etiqueta.png');
    const logoBuffer = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : null;

    // --- Specs text (mismo formato que Python legacy) ---
    let specsText = `Observación: ${observations} `;
    switch (equipmentType) {
      case 'notebook':
        specsText += `Procesador: ${this.extractValue(details.processor) || 'N/A'} `;
        specsText += `RAM: ${this.extractValue(details.ram_size)}GB ${details.ram_slots ? `(${details.ram_slots})` : ''} `;
        specsText += `Disco: ${this.extractValue(details.storage_size)} ${this.extractValue(details.storage_technology)} `;
        specsText += `SO: ${this.extractValue(details.operating_system) || 'N/A'} `;
        specsText += `Pantalla: ${this.extractValue(details.screen_inches)} `;
        specsText += `Batería: ${this.getBatteryInfo(details)} `;
        specsText += `Teclado: ${this.extractValue(details.keyboard_layout)} ${details.has_backlit_keyboard ? '(RETRO)' : ''} `;
        break;
      case 'aio':
        specsText += `Procesador: ${this.extractValue(details.processor) || 'N/A'} `;
        specsText += `RAM: ${this.extractValue(details.ram_size)}GB ${details.ram_slots ? `(${details.ram_slots})` : ''} `;
        specsText += `Disco: ${this.extractValue(details.storage_size)} ${this.extractValue(details.storage_technology)} `;
        specsText += `SO: ${this.extractValue(details.operating_system) || 'N/A'} `;
        specsText += `Pantalla: ${this.extractValue(details.screen_inches)} `;
        break;
      case 'desktop':
        specsText += `Procesador: ${this.extractValue(details.processor) || 'N/A'} `;
        specsText += `RAM: ${this.extractValue(details.ram_size)}GB ${details.ram_slots ? `(${details.ram_slots})` : ''} `;
        specsText += `Disco: ${this.extractValue(details.storage_size)} ${this.extractValue(details.storage_technology)} `;
        specsText += `SO: ${this.extractValue(details.operating_system) || 'N/A'} `;
        break;
      default:
        specsText += `Tipo: ${equipmentType} `;
        break;
    }
    specsText += `Cliente: ${clientName}`;

    // --- Constantes de conversión ---
    // 1cm = 567 twips (DXA)
    // transformation usa PÍXELES (la librería docx convierte internamente a EMU × 9525)
    // 1cm ≈ 37.8px a 96 DPI
    const CM_TWIP = 567;
    const CM_PX = 37.8;

    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const noBorders = {
      top: noBorder, bottom: noBorder,
      left: noBorder, right: noBorder,
    };

    // Ancho usable = 8cm - 0.3cm - 0.3cm = 7.4cm
    const colWidth = Math.round(3.7 * CM_TWIP);

    // Estilo de párrafo compacto (sin espaciado, single)
    const tightSpacing = { before: 0, after: 0, line: 240 };

    // --- Filas de la tabla ---
    const rows: TableRow[] = [];

    // FILA 0: Logo (izq) + QR ecopc (der)
    const logoChildren: (ImageRun | TextRun)[] = [];
    if (logoBuffer) {
      logoChildren.push(new ImageRun({
        type: 'png',
        data: logoBuffer,
        transformation: { width: Math.round(3 * CM_PX), height: Math.round(1.2 * CM_PX) },
      }));
    } else {
      logoChildren.push(new TextRun({ text: 'www.ecopc.cl', bold: true, size: 20 }));
    }

    rows.push(new TableRow({
      children: [
        new TableCell({
          borders: noBorders,
          width: { size: colWidth, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: tightSpacing,
              children: logoChildren,
            }),
          ],
        }),
        new TableCell({
          borders: noBorders,
          width: { size: colWidth, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: tightSpacing,
              children: [
                new ImageRun({
                  type: 'png',
                  data: qrEcopcBuffer,
                  transformation: { width: Math.round(1.2 * CM_PX), height: Math.round(1.2 * CM_PX) },
                }),
              ],
            }),
          ],
        }),
      ],
    }));

    // FILA 1: Espacio de 10pt
    rows.push(new TableRow({
      height: { value: 200, rule: HeightRule.EXACT },
      children: [
        new TableCell({
          columnSpan: 2,
          borders: noBorders,
          children: [new Paragraph({ spacing: { before: 0, after: 0 } })],
        }),
      ],
    }));

    // FILA 2: QR serie (izq) + encabezado de 3 líneas (der)
    rows.push(new TableRow({
      children: [
        new TableCell({
          borders: noBorders,
          width: { size: colWidth, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: tightSpacing,
              children: [
                new ImageRun({
                  type: 'png',
                  data: qrSerialBuffer,
                  transformation: { width: Math.round(1.0 * CM_PX), height: Math.round(1.0 * CM_PX) },
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          borders: noBorders,
          width: { size: colWidth, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              spacing: tightSpacing,
              children: [new TextRun({ text: `${brand} ${model}`, bold: true, size: 14 })],
            }),
            new Paragraph({
              spacing: tightSpacing,
              children: [new TextRun({ text: `Categoría ${grade}`, bold: true, size: 14 })],
            }),
            new Paragraph({
              spacing: tightSpacing,
              children: [new TextRun({ text: `N° Serie: ${serialNumber}`, bold: true, size: 14 })],
            }),
          ],
        }),
      ],
    }));

    // FILA 3: Espacio de 3pt
    rows.push(new TableRow({
      height: { value: 60, rule: HeightRule.EXACT },
      children: [
        new TableCell({
          columnSpan: 2,
          borders: noBorders,
          children: [new Paragraph({ spacing: { before: 0, after: 0 } })],
        }),
      ],
    }));

    // FILA 4: Texto de especificaciones
    rows.push(new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          borders: noBorders,
          children: [
            new Paragraph({
              spacing: tightSpacing,
              children: [new TextRun({ text: specsText, bold: true, size: 14 })],
            }),
          ],
        }),
      ],
    }));

    // --- Tabla ---
    const table = new Table({
      rows,
      width: { size: Math.round(7.4 * CM_TWIP), type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      borders: {
        top: noBorder, bottom: noBorder,
        left: noBorder, right: noBorder,
        insideHorizontal: noBorder,
        insideVertical: noBorder,
      },
    });

    // --- Documento con página 8cm × 5cm ---
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              width: Math.round(8 * CM_TWIP),
              height: Math.round(5 * CM_TWIP),
            },
            margin: {
              top: Math.round(0.2 * CM_TWIP),
              bottom: Math.round(0.2 * CM_TWIP),
              left: Math.round(0.3 * CM_TWIP),
              right: Math.round(0.3 * CM_TWIP),
              header: 0,
              footer: 0,
            },
          },
        },
        children: [
          table,
          // Párrafo fantasma ultra-compacto para evitar página extra
          new Paragraph({
            spacing: { before: 0, after: 0, line: 20 },
            children: [new TextRun({ text: '\u200b', size: 2 })],
          }),
        ],
      }],
    });

    return Buffer.from(await Packer.toBuffer(doc));
  }
}
