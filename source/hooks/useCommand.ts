import { useState } from 'react';
import { useApp } from 'ink';

interface UseCommandProps {
  onLogout: () => void;
  setView: (view: any) => void;
}

const KNOWLEDGE_BASE = [
  { 
    intents: ['imprimir', 'imprimo', 'ticket', 'etiqueta', 'como imprimir'], 
    response: "Para imprimir:\n1. Ve a 'IMPRESIÓN DE REVISIONES' desde el menú principal.\n2. Asegúrate de estar en el modo correcto (Online/Offline).\n3. Escanea el código de barras y espera el mensaje 'OK'." 
  },
  { 
    intents: ['salir', 'cerrar', 'exit', 'quit', 'como salgo'], 
    response: "Para cerrar la aplicación puedes usar la tecla 'ESC' repetidamente, o ejecutar el comando '/exit' en el prompt." 
  },
  { 
    intents: ['tema', 'color', 'colores', 'apariencia', 'oscuro', 'claro'], 
    response: "Para cambiar los colores ve a 'CONFIGURACIÓN' (⚙) > 'APARIENCIA' en el menú principal, o usa el comando rápido '/theme'." 
  },
  {
    intents: ['qr', 'codigo qr', 'genera qr', 'crear qr', 'logo qr'],
    response: "Usa 'GENERA TU QR' desde el menú principal o escribe '/qr'. Podrás ingresar texto, elegir logo y guardar en usuario/escritorio automáticamente.",
  },
  { 
    intents: ['offline', 'internet', 'conexion', 'red', 'sin internet', 'desconectado'], 
    response: "Si no tienes internet en bodega, cambia a Modo Offline.\nLa validación se hará localmente con un Excel. Comando útil: '/info' para ver estado." 
  },
  { 
    intents: ['ayuda', 'comandos', 'help', 'info', '/help', 'que hago', 'comandos'], 
    response: "COMANDOS DISPONIBLES:\n/menu  - Volver al inicio\n/info  - Diagnóstico\n/theme - Temas visuales\n/clear - Limpiar consola\n/exit  - Salir del CLI\n\nTambién puedes consultarme cosas en lenguaje natural." 
  }
];

export const useCommand = ({ onLogout, setView }: UseCommandProps) => {
  const [command, setCommand] = useState('');
  const [commandOutput, setCommandOutput] = useState('');
  const { exit } = useApp();

  const handleCommand = (cmd: string) => {
    const text = cmd.trim().toLowerCase();
    const parts = text.split(' ');
    const name = parts[0];

    // Comandos directos y rápidos (Raw commands)
    switch (name) {
      case '/logout': 
        onLogout(); 
        setCommand(''); 
        setCommandOutput(''); 
        return;
      case '/info': 
        setView('info'); 
        setCommand(''); 
        setCommandOutput(''); 
        return;
      case '/menu': 
        setView('menu'); 
        setCommand(''); 
        setCommandOutput(''); 
        return;
      case '/theme':
        setView('theme');
        setCommand('');
        setCommandOutput('');
        return;
      case '/qr':
        setView('qr-generator');
        setCommand('');
        setCommandOutput('');
        return;
      case '/exit': 
        exit(); 
        return;
      case '/clear': 
        setCommand(''); 
        setCommandOutput(''); 
        return;
    }

    if (text === '') return;

    // Pseudo-AI Algoritmo de Matching
    // Busca las coincidencias de las palabras del input con las palabras clave (intents)
    let bestMatch = null;
    let maxScore = 0;
    
    for (const item of KNOWLEDGE_BASE) {
      let score = 0;
      for (const intent of item.intents) {
        // Coincidencia exacta de intent vs parte del texto, o inclusión
        if (text.includes(intent)) {
          // Damos más peso si la palabra es más larga o coincide exacto
          score += intent.length; 
        }
      }
      
      if (score > maxScore) {
         maxScore = score;
         bestMatch = item;
      }
    }

    if (bestMatch && maxScore > 2) { // Unbral mínimo para evitar falsos positivos
       setCommandOutput(`🤖 ASISTENTE:\n${bestMatch.response}`);
    } else {
       setCommandOutput("🤖 ASISTENTE:\nNo reconozco ese comando o pregunta.\nEscribe '/help' para opciones o pregúntame sobre imprimir, temas, conexión, etc.");
    }
    
    setCommand('');
  };

  return {
    command,
    setCommand,
    commandOutput,
    setCommandOutput,
    handleCommand
  };
};
