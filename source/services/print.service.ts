import QRCode from 'qrcode';
import ptp from 'pdf-to-printer';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { TechnicalItem } from '../types/api.types.js';
import { AuthService } from './auth.service.js';

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

  static async generateHtml(item: TechnicalItem): Promise<string> {
    // According to user: "QR Ecopc: Utiliza la constante fija https://www.ecopc.cl"
    const qrCorporateUrl = 'https://www.ecopc.cl';
    const qrDataUrl = await QRCode.toDataURL(qrCorporateUrl);
    
    // Serial number for text representation
    const serialNumber = item.serial_number || 'SIN-SERIE';

    const details = item.details || {};
    const grade = this.extractValue(item.grade) || 'C';
    const clientName = item.customer_supplier?.name || 'SIN CLIENTE';

    const brand = this.extractValue(details.brand);
    const model = this.extractValue(details.model);
    const productName = `${brand} ${model}`.trim().toUpperCase() || 'PRODUCTO SIN ESPECIFICAR';
    const equipmentType = (this.extractValue(item.equipment_type) || 'notebook').toLowerCase();
    const observations = this.extractValue(details.observations) || 'SIN OBSERVACIÓN';

    let specsHtml = '';

    const commonSpecs = `<div><span style="font-weight: bold">OBS: </span>${observations}</div>`;

    switch (equipmentType) {
      case 'notebook':
        specsHtml = `
          <div><span style="font-weight: bold">PROC: </span>${this.extractValue(details.processor) || 'N/A'}</div>
          <div><span style="font-weight: bold">RAM: </span>${this.extractValue(details.ram_size)}GB ${details.ram_slots ? `(${details.ram_slots})` : ''}</div>
          <div><span style="font-weight: bold">DISCO: </span>${this.extractValue(details.storage_size)} ${this.extractValue(details.storage_technology)}</div>
          <div><span style="font-weight: bold">SO: </span>${this.extractValue(details.operating_system) || 'N/A'}</div>
          <div><span style="font-weight: bold">PANTALLA: </span>${this.extractValue(details.screen_inches)}"</div>
          <div><span style="font-weight: bold">BATERÍA: </span>${this.getBatteryInfo(details)}</div>
          <div><span style="font-weight: bold">TECLADO: </span>${this.extractValue(details.keyboard_layout)} ${details.has_backlit_keyboard ? '(RETRO)' : ''}</div>
        `;
        break;
      case 'desktop':
      case 'aio':
        specsHtml = `
          <div><span style="font-weight: bold">PROC: </span>${this.extractValue(details.processor) || 'N/A'}</div>
          <div><span style="font-weight: bold">RAM: </span>${this.extractValue(details.ram_size)}GB</div>
          <div><span style="font-weight: bold">DISCO: </span>${this.extractValue(details.storage_size)} ${this.extractValue(details.storage_technology)}</div>
          ${equipmentType === 'aio' ? `<div><span style="font-weight: bold">PANTALLA: </span>${this.extractValue(details.screen_inches)}"</div>` : ''}
          <div><span style="font-weight: bold">SO: </span>${this.extractValue(details.operating_system) || 'N/A'}</div>
        `;
        break;
      case 'monitor':
        specsHtml = `
          <div><span style="font-weight: bold">PANTALLA: </span>${this.extractValue(details.screen_inches)}"</div>
          <div><span style="font-weight: bold">RESOLUCIÓN: </span>${this.extractValue((details as any).resolution) || 'N/A'}</div>
        `;
        break;
      case 'docking':
        specsHtml = `
          <div><span style="font-weight: bold">PUERTOS: </span>${this.extractValue((details as any).ports) || 'N/A'}</div>
        `;
        break;
      default:
        specsHtml = `<div>TIPO: ${equipmentType}</div>`;
        break;
    }

    specsHtml += commonSpecs;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          /* Forzar tamaño físico exacto sin márgenes */
          @page { 
            size: 80mm 60mm; 
            margin: 0 !important; 
          }
          
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
          }

          html, body {
            margin: 0;
            padding: 0;
            width: 80mm;
            height: 60mm;
            overflow: hidden; /* Evita que Puppeteer detecte una segunda página */
            background: white;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.1;
          }

          /* Contenedor principal con altura fija para evitar saltos */
          .label-container {
            width: 80mm;
            height: 60mm;
            padding: 8px;
            display: flex;
            flex-direction: column;
            position: relative;
            page-break-inside: avoid;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid black;
            padding-bottom: 4px;
            margin-bottom: 5px;
            height: 45px; /* Altura fija */
          }
          
          .client-info { flex: 1; overflow: hidden; }
          .client-name { font-weight: bold; font-size: 13px; text-transform: uppercase; white-space: nowrap; }
          .grade-container { text-align: center; margin-left: 10px; }
          .grade-label { font-size: 8px; font-weight: bold; }
          .grade-value { font-size: 24px; font-weight: bold; line-height: 1; border: 2.5px solid black; padding: 2px 6px; display: inline-block; }
          
          .product-name { font-size: 12px; font-weight: bold; margin-bottom: 4px; white-space: nowrap; overflow: hidden; }
          
          .main-content { display: flex; flex: 1; overflow: hidden; }
          .specs { flex: 1; padding-right: 5px; font-size: 10.5px; }
          .specs div { margin-bottom: 0px; white-space: nowrap; }
          
          .qr-side { width: 75px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; }
          .qr-image { width: 75px; height: 75px; object-fit: contain; }
          .serial-text { font-size: 9px; font-weight: bold; margin-top: 1px; font-family: monospace; }
          .logo-placeholder { font-size: 8px; font-weight: bold; color: #444; }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="header">
            <div class="client-info">
              <div class="logo-placeholder">ZENTRIA ERP</div>
              <div class="client-name">${clientName}</div>
            </div>
            <div class="grade-container">
              <div class="grade-label">GRADO</div>
              <div class="grade-value">${grade}</div>
            </div>
          </div>
          
          <div class="product-name">${productName}</div>
          
          <div class="main-content">
            <div class="specs">
              ${specsHtml}
            </div>
            <div class="qr-side">
              <img class="qr-image" src="${qrDataUrl}" />
              <div class="serial-text">${serialNumber}</div>
            </div>
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
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();
    await ptp.print(tempPdf);
    fs.unlinkSync(tempPdf);
  }
}
