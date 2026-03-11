import Conf from 'conf';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { themes, defaultThemeName, type Theme } from '../constants/themes.js';

// En producción (exe), esbuild inyecta las variables en build-time.
// En desarrollo, cargar .env.develop o .env como fallback.
if (process.env['NODE_ENV'] !== 'production') {
  const devEnvPath = join(process.cwd(), '.env.develop');
  if (existsSync(devEnvPath)) {
    dotenv.config({ path: devEnvPath });
  } else {
    dotenv.config();
  }
}

const config = new Conf({
  projectName: 'zentria-cli',
});

export type AppMode = 'online' | 'offline';

export class AuthService {
  private static TOKEN_KEY = 'auth_token';
  private static BASE_URL_KEY = 'api_base_url';
  private static MODE_KEY = 'app_mode';
  private static BRANCH_ID_KEY = 'branch_id';
  private static THEME_KEY = 'ui_theme';

  static setToken(token: string) {
    config.set(this.TOKEN_KEY, token);
  }

  static setBranchId(id: number | string) {
    config.set(this.BRANCH_ID_KEY, String(id));
  }

  static getBranchId(): string {
    return (config.get(this.BRANCH_ID_KEY) as string) || '1';
  }

  static getToken(): string | undefined {
    return (config.get(this.TOKEN_KEY) as string) || process.env['ZENTRIA_TOKEN'];
  }

  static clearToken() {
    config.delete(this.TOKEN_KEY);
  }

  static setMode(mode: AppMode) {
    config.set(this.MODE_KEY, mode);
  }

  static getMode(): AppMode {
    return (config.get(this.MODE_KEY) as AppMode) || 'online';
  }

  static logout() {
    this.clearToken();
    config.delete(this.MODE_KEY);
  }

  static setBaseUrl(url: string) {
    config.set(this.BASE_URL_KEY, url);
  }

  static getBaseUrl(): string {
    return (
      process.env['API_BASE_URL'] ||
      (config.get(this.BASE_URL_KEY) as string) ||
      'http://localhost:8000'
    );
  }

  static getChromePath(): string {
    return (
      process.env['CHROME_PATH'] ||
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    );
  }

  static setTheme(themeName: string) {
    config.set(this.THEME_KEY, themeName);
  }

  static getThemeName(): string {
    return (config.get(this.THEME_KEY) as string) || defaultThemeName;
  }

  static getTheme(): Theme {
    const name = this.getThemeName();
    return themes[name] || themes[defaultThemeName]!;
  }
}
