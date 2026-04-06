import { OfflineItem } from "../types/offline.types.js";
import { TechnicalItem } from "../types/api.types.js";
import { PrintService } from "./print.service.js";

export class OfflinePrintService {
  /**
   * Mapea un OfflineItem a TechnicalItem para la compatibilidad con PrintService
   */
  static parseToTechnicalItem(item: OfflineItem): TechnicalItem {
    const d = item.data;

    return {
      id: 0,
      serial_number: item.serial,
      equipment_type: { value: item.deviceType, label: item.deviceType },
      grade: { value: "C", label: "C" }, // Default en excel offline
      customer_supplier: d["Cliente"] ? { name: d["Cliente"] } : null,
      details: {
        brand: d["Marca"] || "",
        model: d["Modelo"] || "",
        processor: d["Procesador"] || "",
        ram_size: parseInt(String(d["RAM"] || "0").replace(/\D/g, "")) || 0,
        ram_slots: parseInt(String(d["Slot Ram"] || "0").replace(/\D/g, "")) || 0,
        storage_size: d["Disco"] || "",
        storage_technology: d["Tec. HDD"] || "",
        operating_system: d["S.O"] || "",
        screen_inches: d["Pantalla"] || "",
        battery_percentage: undefined,
        battery_status: d["Bateria"] || "",
        keyboard_layout: d["ES/US"] || "",
        has_backlit_keyboard: d["Retroiluminado"] ? (d["Retroiluminado"].toLowerCase().includes("si") ? true : false) : undefined,
        observations: d["Observacion"] || "",
      },
    };
  }

  static async printAuto(item: OfflineItem, printerName?: string | null) {
    const payload = this.parseToTechnicalItem(item);
    await PrintService.print(payload, printerName);
  }

  static async printManual(item: OfflineItem) {
    const payload = this.parseToTechnicalItem(item);
    await PrintService.openLabelInWord(payload);
  }
}
