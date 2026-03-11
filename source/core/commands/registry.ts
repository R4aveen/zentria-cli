export interface Command {
  name: string;
  description: string;
  execute: (args: string[]) => void;
}

export class CommandRegistry {
  private static commands: Map<string, Command> = new Map();

  static register(command: Command) {
    this.commands.set(command.name.toLowerCase(), command);
  }

  static getCommand(name: string): Command | undefined {
    return this.commands.get(name.toLowerCase());
  }

  static getAll(): Command[] {
    return Array.from(this.commands.values());
  }
}
