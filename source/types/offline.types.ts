export interface OfflineItem {
  sheetName: string;
  deviceType: string;
  serial: string;
  data: Record<string, string>; // The mapped canonical row data
}
