export interface TechnicalItem {
  id: number;
  serial_number: string;
  equipment_type: any; // { value, label }
  grade: any;
  customer_supplier: { name: string } | null;
  details: {
    brand: any;
    model: any;
    processor: any;
    ram_size: number;
    ram_slots?: number;
    storage_size: any;
    storage_technology: any;
    operating_system: any;
    screen_inches: any;
    battery_percentage?: number;
    battery_status?: any;
    keyboard_layout: any;
    has_backlit_keyboard?: boolean;
    observations: any;
    resolution?: any;
    ports?: any;
  };
}
