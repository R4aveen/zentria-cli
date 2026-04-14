import * as XLSX from "xlsx";
import { existsSync } from "node:fs";
import { OfflineItem } from "../types/offline.types.js";
import {
  DEVICE_TYPES,
  CANONICAL_NOTEBOOK,
  CANONICAL_DESKTOP,
  CANONICAL_AIO,
  CANONICAL_MONITOR,
  CANONICAL_DOCKING,
  INVALID_MARKERS,
} from "../constants/excel.constants.js";

const normalizeKey = (s: string): string => {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Sin tildes
    .replace(/\s+/g, " ") // Colapsar espacios
    .trim()
    .replace(/\./g, ""); // Sin puntos (ej: s.o -> so)
};

const SERIAL_HEADER_ALIASES = new Set([
  "serie",
  "serial",
  "serial number",
  "sn",
  "s/n",
  "numero de serie",
  "n° serie",
].map(normalizeKey));

export class OfflineService {
  static parseExcel(filePath: string): OfflineItem[] {
    const cleanPath = filePath.replace(/['"]/g, "").trim();

    if (!existsSync(cleanPath)) {
      throw new Error(`El archivo no existe en la ruta: ${cleanPath}`);
    }

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.readFile(cleanPath, { cellDates: true });
    } catch (err: any) {
      throw new Error(`Error al leer el archivo Excel: ${err.message}`);
    }

    const items: OfflineItem[] = [];

    for (const sheetName of workbook.SheetNames) {
      const lowerSheetName = sheetName.toLowerCase().trim();
      let deviceType = DEVICE_TYPES.find((dt) => lowerSheetName.includes(dt));

      if (!deviceType) {
        if (lowerSheetName.includes("cpu")) deviceType = "desktop";
        else if (lowerSheetName.includes("docking")) deviceType = "docking";
        else deviceType = sheetName;
      }

      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) continue;

      // Usar un mapa maestro de TODAS las columnas posibles
      // Esto imita el comportamiento de Python que lee `load_revision_any` agnóstico a la hoja
      const masterCanonicalMap = {
        ...CANONICAL_NOTEBOOK,
        ...CANONICAL_DESKTOP,
        ...CANONICAL_AIO,
        ...CANONICAL_MONITOR,
        ...CANONICAL_DOCKING,
      };
      
      // Expected normalized keys
      const expectedKeys = new Set(Object.keys(masterCanonicalMap).map(normalizeKey));

      // Leer las primeras filas como arrays para buscar cabecera
      const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });
      if (rows.length === 0) continue;

      let bestRowIdx = 0;
      
      const headerScanLimit = Math.min(60, rows.length);
      let bestScore = -1;
      for (let i = 0; i < headerScanLimit; i++) {
        const rowVals = rows[i]!;
        let hits = 0;
        let hasSerialHeader = false;
        let nonEmpty = 0;

        for (const val of rowVals) {
          const normalized = normalizeKey(String(val));
          if (!normalized) continue;
          nonEmpty++;

          if (expectedKeys.has(normalized)) {
            hits++;
          }

          if (SERIAL_HEADER_ALIASES.has(normalized)) {
            hasSerialHeader = true;
          }
        }

        const score = hits * 5 + (hasSerialHeader ? 3 : 0) + (nonEmpty > 3 ? 1 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestRowIdx = i;
        }
      }

      // Si no encontramos casi coincidencias de las cabeceras requeridas, podríamos tener problemas
      // pero confíamos en el bestRowIdx
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { 
        range: bestRowIdx, 
        defval: "" 
      });

      // Crear map de busqueda por llave normalizada
      const searchMap: Record<string, string> = {};
      for (const [k, v] of Object.entries(masterCanonicalMap)) {
        searchMap[normalizeKey(k)] = v as string;
      }

      for (const row of rawData) {
        const canonicalRow: Record<string, string> = {};
        
        // Mapear cada columna
        for (const [colName, val] of Object.entries(row)) {
          const keyNorm = normalizeKey(colName);
          const canonicalKey = searchMap[keyNorm];
          
          if (canonicalKey) {
            let strVal = String(val).trim();
            if (INVALID_MARKERS.has(strVal.toLowerCase())) {
              strVal = "";
            }
            // Coalesce si ya existe un valor pero esta vacio y encontramos otro
            if (!canonicalRow[canonicalKey] || canonicalRow[canonicalKey] === "") {
              canonicalRow[canonicalKey] = strVal;
            }
          }
        }

        const serieVal = canonicalRow["Serie"];
        if (serieVal && serieVal.length > 0 && !INVALID_MARKERS.has(serieVal.toLowerCase())) {
          
          let rowDeviceType = deviceType; // Valor por defecto de la hoja
          const cat = canonicalRow["Categoria"]?.toLowerCase() || '';
          if (cat) {
            const dt = DEVICE_TYPES.find(d => cat.includes(d));
            if (dt) rowDeviceType = dt;
            else if (cat.includes('cpu')) rowDeviceType = 'desktop';
            else if (cat.includes('docking')) rowDeviceType = 'docking';
          }

          items.push({
            sheetName,
            deviceType: rowDeviceType as OfflineItem["deviceType"],
            serial: serieVal.toUpperCase(),
            data: canonicalRow,
          });
        }
      }
    }

    if (items.length === 0) {
      throw new Error("No se encontraron equipos con números de 'Serie' en hojas válidas.");
    }

    return items;
  }
}
