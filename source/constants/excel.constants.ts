export const DEVICE_TYPES = ["desktop", "notebook", "aio", "monitor", "docking"];

export const INVALID_MARKERS = new Set(["", "0", "0.0", "nan", "none", "n/a", "na", "-"]);

export const CANONICAL_AIO: Record<string, string> = {
  // Marca
  marca: "Marca",

  // Modelo
  modelo: "Modelo",

  // Categoria
  categoria: "Categoria",
  categ: "Categoria",
  categoría: "Categoria",

  // Procesador
  procesador: "Procesador",
  cpu: "Procesador",

  // RAM
  ram: "RAM",
  "memoria ram": "RAM",

  // Slot Ram
  "slot ram": "Slot Ram",
  "slots ram": "Slot Ram",

  // Disco
  disco: "Disco",
  hdd: "Disco",
  almacenamiento: "Disco",

  // Tec. HDD
  "tec. hdd": "Tec. HDD",
  "tipo hdd": "Tec. HDD",

  // S.O
  "s.o": "S.O",
  so: "S.O",
  "sistema operativo": "S.O",
  os: "S.O",
  "s.o.": "S.O",
  "s.0": "S.O",

  // Pantalla
  pantalla: "Pantalla",
  "pulgadas pant.": "Pantalla",
  display: "Pantalla",

  // Cliente
  cliente: "Cliente",

  // Proveedor
  proveedor: "Proveedor",

  // Serie
  serie: "Serie",
  "s/n": "Serie",
  sn: "Serie",
  serial: "Serie",
  "serial number": "Serie",
  "n° serie": "Serie",
  "numero de serie": "Serie",

  // Observacion
  observacion: "Observacion",
  observaciones: "Observacion",
  obs: "Observacion",
};

export const CANONICAL_NOTEBOOK: Record<string, string> = {
  // Serie
  "s/n": "Serie",
  s_n: "Serie",
  sn: "Serie",
  serie: "Serie",
  serial: "Serie",
  "serial number": "Serie",
  "nro serie": "Serie",
  noserie: "Serie",
  "num serie": "Serie",
  "n° serie": "Serie",
  "numero de serie": "Serie",
  "n de serie": "Serie",

  // Pantalla
  pantalla: "Pantalla",
  "pulgadas pant.": "Pantalla",
  display: "Pantalla",
  screen: "Pantalla",

  // Procesador
  procesador: "Procesador",
  cpu: "Procesador",
  processor: "Procesador",

  // RAM
  ram: "RAM",
  "memoria ram": "RAM",
  memory: "RAM",
  memoria: "RAM",

  // Slot ram
  "slot ram": "Slot Ram",
  "slots ram": "Slot Ram",
  "ranuras ram": "Slot Ram",

  // Disco
  disco: "Disco",
  hdd: "Disco",
  ssd: "Disco",
  almacenamiento: "Disco",
  storage: "Disco",
  "hard disk": "Disco",

  // Tecnología Disco
  "tec. hdd": "Tec. HDD",
  "tipo disco": "Tec. HDD",
  "tecnologia hdd": "Tec. HDD",

  // Batería
  bateria: "Bateria",
  batería: "Bateria",
  "estado bateria": "Bateria",
  battery: "Bateria",

  // Sistema Operativo (¡ojo: dejamos canónico con punto!)
  "s.o": "S.O",
  so: "S.O",
  "sistema operativo": "S.O",
  os: "S.O",
  "s.0": "S.O",

  // Teclado / Layout
  "es/us": "ES/US",
  "idioma teclado": "ES/US",
  layout: "ES/US",
  teclado: "Teclado",
  keyboard: "Teclado", // si algún archivo trae esta columna, la tendrás aparte

  // Retroiluminado
  retroiluminado: "Retroiluminado",
  retroluminado: "Retroiluminado",
  backlit: "Retroiluminado",

  // Marca / Modelo / Categoría
  marca: "Marca",
  brand: "Marca",
  modelo: "Modelo",
  model: "Modelo",
  categoria: "Categoria",
  categoría: "Categoria",
  category: "Categoria",
  "categoria ": "Categoria",

  // Cliente / Proveedor
  cliente: "Cliente",
  customer: "Cliente",
  proveedor: "Proveedor",
  supplier: "Proveedor",

  // Observaciones
  observaciones: "Observacion",
  observacion: "Observacion",
  obs: "Observacion",
  notes: "Observacion",
};

export const CANONICAL_DESKTOP: Record<string, string> = {
  // Marca
  marca: "Marca",

  // Modelo
  modelo: "Modelo",

  // Categoria
  categoria: "Categoria",
  categ: "Categoria",
  categoría: "Categoria",

  // Procesador
  procesador: "Procesador",
  cpu: "Procesador",

  // RAM
  ram: "RAM",
  "memoria ram": "RAM",

  // Slot Ram
  "slot ram": "Slot Ram",
  "slots ram": "Slot Ram",

  // Disco
  disco: "Disco",
  hdd: "Disco",
  almacenamiento: "Disco",

  // Tec. HDD
  "tec. hdd": "Tec. HDD",
  "tecnologia hdd": "Tec. HDD",
  sata: "Tec. HDD", // si acaso lo usan así

  // S.O
  "s.o": "S.O",
  so: "S.O",
  "sistema operativo": "S.O",
  os: "S.O",
  "s.o.": "S.O",
  "s.0": "S.O",

  // Cliente
  cliente: "Cliente",

  // Proveedor
  proveedor: "Proveedor",

  // Serie
  serie: "Serie",
  "s/n": "Serie",
  sn: "Serie",
  serial: "Serie",
  "serial number": "Serie",
  "n° serie": "Serie",
  "numero de serie": "Serie",

  // Observacion
  observacion: "Observacion",
  observaciones: "Observacion",
  obs: "Observacion",
};

export const CANONICAL_MONITOR: Record<string, string> = {
  marca: "Marca",
  modelo: "Modelo",
  pantalla: "Pantalla",
  "pulgadas pant.": "Pantalla",
  display: "Pantalla",
  resolucion: "Resolucion",
  cliente: "Cliente",
  proveedor: "Proveedor",
  serie: "Serie",
  "s/n": "Serie",
  sn: "Serie",
  serial: "Serie",
  observacion: "Observacion",
  obs: "Observacion"
};

export const CANONICAL_DOCKING: Record<string, string> = {
  marca: "Marca",
  modelo: "Modelo",
  puertos: "Puertos",
  cliente: "Cliente",
  proveedor: "Proveedor",
  serie: "Serie",
  "s/n": "Serie",
  sn: "Serie",
  serial: "Serie",
  observacion: "Observacion",
  obs: "Observacion"
};

export const CANONICAL_BY_TYPE: Record<string, Record<string, string>> = {
  notebook: CANONICAL_NOTEBOOK,
  desktop: CANONICAL_DESKTOP,
  aio: CANONICAL_AIO,
  monitor: CANONICAL_MONITOR,
  docking: CANONICAL_DOCKING,
};

export const REQUIRED_COLS_NOTEBOOK = [
  "Marca",
  "Modelo",
  "Categoria",
  "Pantalla",
  "Procesador",
  "RAM",
  "Slot Ram",
  "Bateria",
  "Disco",
  "Tec. HDD",
  "S.O",
  "ES/US",
  "Retroiluminado",
  "Cliente",
  "Proveedor",
  "Serie",
  "Observacion",
];

export const REQUIRED_COLS_DESKTOP = [
  "Marca",
  "Modelo",
  "Categoria",
  "Procesador",
  "RAM",
  "Slot Ram",
  "Disco",
  "Tec. HDD",
  "S.O",
  "Cliente",
  "Proveedor",
  "Serie",
  "Observacion",
];

export const REQUIRED_COLS_AIO = [
  "Marca",
  "Modelo",
  "Categoria",
  "Procesador",
  "RAM",
  "Slot Ram",
  "Disco",
  "Tec. HDD",
  "S.O",
  "Pantalla",
  "Cliente",
  "Proveedor",
  "Serie",
  "Observacion",
];

export const REQUIRED_COLS_BY_TYPE: Record<string, string[]> = {
  notebook: REQUIRED_COLS_NOTEBOOK,
  desktop: REQUIRED_COLS_DESKTOP,
  aio: REQUIRED_COLS_AIO,
};

export const OPCIONALES_COMUNES = [
  "Observacion",
  "Procesador",
  "RAM",
  "Slot Ram",
  "Disco",
  "Tec. HDD",
  "S.O.",
  "S.O",
  "SO",
  "Pantalla",
  "Bateria",
  "ES/US",
  "Retroiluminado",
  "Cliente",
  "Proveedor",
  "Categoria",
  "S.O.",
];
