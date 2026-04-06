export interface Theme {
  name: string;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
  borderActive: string;
  text: string;
  textDim: string;
  textMuted: string;
  success: string;
  error: string;
  errorText: string;
  modeBadgeOnline: string;
  modeBadgeOffline: string;
  gradient: string[];
}

export const themes: Record<string, Theme> = {
  // --- TEMAS ORIGINALES (Ajustados para terminal) ---
  lavender: {
    name: 'lavender',
    label: '✧ Lavanda ₊˚ෆ',
    primary: '#E0B0FF',
    secondary: '#DDA0DD',
    accent: '#7B68EE',
    border: '#7B68EE',
    borderActive: '#DDA0DD',
    text: '#B0C4DE',
    textDim: '#8A9EBD',
    textMuted: '#6B7A99',
    success: '#2E8B57',
    error: '#8B0000',
    errorText: '#FF6B6B',
    modeBadgeOnline: '#5B5EA6',
    modeBadgeOffline: '#8B5CF6',
    // Inicia en blanco, baja a tonos lavanda/morado oscuros
    gradient: ['#FFFFFF', '#F3E8FF', '#E0B0FF', '#DDA0DD', '#C084FC', '#9DB5D0', '#7B68EE', '#5B5EA6'],
  },
  ocean: {
    name: 'ocean',
    label: '⋆ Océano 🌊',
    primary: '#00CED1',
    secondary: '#20B2AA',
    accent: '#1E90FF',
    border: '#1E90FF',
    borderActive: '#48D1CC',
    text: '#87CEEB',
    textDim: '#6DAFD1',
    textMuted: '#4F84A6',
    success: '#2E8B57',
    error: '#8B0000',
    errorText: '#FF6B6B',
    modeBadgeOnline: '#006994',
    modeBadgeOffline: '#4682B4',
    // Inicia en blanco/cyan muy claro, baja a azul profundo
    gradient: ['#FFFFFF', '#E0FFFF', '#87CEEB', '#48D1CC', '#00CED1', '#20B2AA', '#1E90FF', '#0047AB'],
  },
  sakura: {
    name: 'sakura',
    label: '☾ Sakura 🌸',
    primary: '#FFB7C5',
    secondary: '#FF69B4',
    accent: '#DB7093',
    border: '#DB7093',
    borderActive: '#FF69B4',
    text: '#F4C2C2',
    textDim: '#D49E9E',
    textMuted: '#B37A7A',
    success: '#2E8B57',
    error: '#8B0000',
    errorText: '#FF6B6B',
    modeBadgeOnline: '#C71585',
    modeBadgeOffline: '#DA70D6',
    // Inicia en blanco/rosado pálido, baja a magenta/carmesí
    gradient: ['#FFFFFF', '#FFF0F5', '#FFB7C5', '#F4C2C2', '#FF69B4', '#DA70D6', '#DB7093', '#C71585'],
  },
  emerald: {
    name: 'emerald',
    label: '𖦹 Esmeralda 🍀',
    primary: '#50C878',
    secondary: '#2ECC71',
    accent: '#1ABC9C',
    border: '#1ABC9C',
    borderActive: '#2ECC71',
    text: '#98D8C8',
    textDim: '#7CB5A6',
    textMuted: '#5C9184',
    success: '#27AE60',
    error: '#8B0000',
    errorText: '#FF6B6B',
    modeBadgeOnline: '#0D9970',
    modeBadgeOffline: '#16A085',
    // Inicia en blanco/verde pálido, baja a esmeralda/bosque
    gradient: ['#FFFFFF', '#AAFFC3', '#98D8C8', '#50C878', '#2ECC71', '#1ABC9C', '#16A085', '#0D9970'],
  },
  sunset: {
    name: 'sunset',
    label: '✴︎ Atardecer 🌅',
    primary: '#FFA07A',
    secondary: '#FF7F50',
    accent: '#FF6347',
    border: '#FF6347',
    borderActive: '#FF7F50',
    text: '#FFDAB9',
    textDim: '#D6AE8C',
    textMuted: '#AB8666',
    success: '#2E8B57',
    error: '#8B0000',
    errorText: '#FF6B6B',
    modeBadgeOnline: '#E74C3C',
    modeBadgeOffline: '#FF4500',
    // Inicia en crema/amarillo claro, baja a naranja/rojo oscuro
    gradient: ['#FFFFFF', '#FFE4B5', '#FFDAB9', '#FFD700', '#FFA07A', '#FF7F50', '#FF6347', '#E74C3C'],
  },
  frost: {
    name: 'frost',
    label: '☁︎ Escarcha ❄',
    primary: '#B0E0E6',
    secondary: '#87CEEB',
    accent: '#4682B4',
    border: '#4682B4',
    borderActive: '#87CEFA',
    text: '#ADD8E6',
    textDim: '#8CB6C4',
    textMuted: '#6892A1',
    success: '#2E8B57',
    error: '#8B0000',
    errorText: '#FF6B6B',
    modeBadgeOnline: '#5F9EA0',
    modeBadgeOffline: '#6495ED',
    // Inicia en blanco nieve, baja a azul acero
    gradient: ['#FFFFFF', '#F0F8FF', '#E0FFFF', '#ADD8E6', '#B0E0E6', '#87CEEB', '#6495ED', '#4682B4'],
  },
  midnight: {
    name: 'midnight',
    label: '☾ Medianoche 🌙',
    primary: '#9370DB',
    secondary: '#6A5ACD',
    accent: '#483D8B',
    border: '#483D8B',
    borderActive: '#6A5ACD',
    text: '#B8A9C9',
    textDim: '#9688A6',
    textMuted: '#746782',
    success: '#2E8B57',
    error: '#8B0000',
    errorText: '#FF6B6B',
    modeBadgeOnline: '#4B0082',
    modeBadgeOffline: '#663399',
    // Inicia en lavanda pálido, baja a violeta/índigo
    gradient: ['#FFFFFF', '#E6E6FA', '#B8A9C9', '#DDA0DD', '#9370DB', '#6A5ACD', '#663399', '#483D8B'],
  },
  rose: {
    name: 'rose',
    label: '⋆ Rosa Dorado ✧',
    primary: '#F4A8C1',
    secondary: '#E8909C',
    accent: '#B76E79',
    border: '#B76E79',
    borderActive: '#E8909C',
    text: '#F0D0D9',
    textDim: '#D1AEB8',
    textMuted: '#AE8B95',
    success: '#2E8B57',
    error: '#8B0000',
    errorText: '#FF6B6B',
    modeBadgeOnline: '#996666',
    modeBadgeOffline: '#CC8899',
    // Inicia en blanco roto/rosado claro, baja a rosa oscuro/vino
    gradient: ['#FFFFFF', '#FFF0F0', '#F0D0D9', '#F4A8C1', '#E8909C', '#CC8899', '#B76E79', '#996666'],
  },

  // --- TEMAS NUEVOS "PRO" (Optimizados) ---
  cyberpunk: {
    name: 'cyberpunk',
    label: '⚡ Cyberpunk 🤖',
    primary: '#F3E600', // Amarillo neón
    secondary: '#FF00FF', // Magenta
    accent: '#00FFFF',    // Cian
    border: '#FF00FF',
    borderActive: '#00FFFF',
    text: '#F3E600',
    textDim: '#CCCC00',
    textMuted: '#999900',
    success: '#00FF00',
    error: '#FF0000',
    errorText: '#FF5555',
    modeBadgeOnline: '#FF00FF',
    modeBadgeOffline: '#F3E600',
    // Inicia en blanco puro, cruza los neones brillantes y termina en el púrpura
    gradient: ['#FFFFFF', '#FFFF99', '#F3E600', '#00FFFF', '#00CCFF', '#FF00FF', '#CC00CC', '#660066'],
  },
  matrix: {
    name: 'matrix',
    label: '📟 Matrix 💾',
    primary: '#00FF41',
    secondary: '#008F11',
    accent: '#00FF41', // Unificado a verde brillante
    border: '#008F11',
    borderActive: '#00FF41',
    text: '#0DFF00',
    textDim: '#00CC00',
    textMuted: '#009900',
    success: '#00FF41',
    error: '#FF0000',
    errorText: '#FF5555',
    modeBadgeOnline: '#008F11',
    modeBadgeOffline: '#00FF41',
    // Inicia en blanco/verde eléctrico, baja a verde hacker clásico
    gradient: ['#FFFFFF', '#A4FF9E', '#0DFF00', '#00FF41', '#00CC33', '#009922', '#008F11', '#005500'],
  },
  synthwave: {
    name: 'synthwave',
    label: '🕹 Retro 📼',
    primary: '#FF71CE',
    secondary: '#B967FF',
    accent: '#01CDFE',
    border: '#05FFA1',
    borderActive: '#B967FF',
    text: '#FFFB96',
    textDim: '#D1C2EB',
    textMuted: '#A395C6',
    success: '#05FFA1',
    error: '#FF0055',
    errorText: '#FF71CE',
    modeBadgeOnline: '#7209B7',
    modeBadgeOffline: '#B5179E',
    // Inicia en blanco puro/amarillo neón, baja al magenta y púrpura retro
    gradient: ['#FFFFFF', '#FFFB96', '#05FFA1', '#01CDFE', '#B967FF', '#FF71CE', '#B5179E', '#7209B7'],
  },
  dracula: {
    name: 'dracula',
    label: '🧛🏻‍♂️ Dracula 🦇',
    primary: '#BD93F9',
    secondary: '#8BE9FD',
    accent: '#FF79C6',
    border: '#6272A4',
    borderActive: '#BD93F9',
    text: '#F8F8F2',
    textDim: '#BFC7D5',
    textMuted: '#8597C9',
    success: '#50FA7B',
    error: '#FF5555',
    errorText: '#FFB8B8',
    modeBadgeOnline: '#50FA7B',
    modeBadgeOffline: '#FF79C6',
    // Inicia en blanco drácula, pasa por tonos pastel vibrantes y termina en el lila/azul grisáceo
    gradient: ['#FFFFFF', '#F8F8F2', '#F1FA8C', '#8BE9FD', '#50FA7B', '#FF79C6', '#BD93F9', '#6272A4'],
  },
  nordic: {
    name: 'nordic',
    label: '🏔 Nórdico ❄️',
    primary: '#88C0D0', // Frost Blue
    secondary: '#81A1C1',
    accent: '#5E81AC',
    border: '#4C566A',
    borderActive: '#88C0D0',
    text: '#ECEFF4',    // Snow White
    textDim: '#4C566A',
    textMuted: '#2E3440',
    success: '#A3BE8C', // Sage Green
    error: '#BF616A',   // Aurora Red
    errorText: '#D08770',
    modeBadgeOnline: '#5E81AC',
    modeBadgeOffline: '#81A1C1',
    gradient: ['#2E3440', '#3B4252', '#434C5E', '#4C566A', '#5E81AC', '#81A1C1', '#88C0D0', '#ECEFF4'],
  },
};

export const themeNames = Object.keys(themes);
export const defaultThemeName = 'lavender';