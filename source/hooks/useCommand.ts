import { useState } from 'react';
import { useApp } from 'ink';

interface UseCommandProps {
  onLogout: () => void;
  setView: (view: any) => void;
}

export const useCommand = ({ onLogout, setView }: UseCommandProps) => {
  const [command, setCommand] = useState('');
  const { exit } = useApp();

  const handleCommand = (cmd: string) => {
    const parts = cmd.trim().toLowerCase().split(' ');
    const name = parts[0];
    // const args = parts.slice(1); // Future use

    switch (name) {
      case '/logout':
        onLogout();
        break;
      case '/info':
        setView('info');
        break;
      case '/menu':
        setView('menu');
        break;
      case '/exit':
        exit();
        break;
      case '/clear':
        setCommand('');
        break;
      default:
        // Optional: Feedback for unknown command
        break;
    }
    setCommand('');
  };

  return {
    command,
    setCommand,
    handleCommand
  };
};
