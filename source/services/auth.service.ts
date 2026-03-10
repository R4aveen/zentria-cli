import Conf from 'conf';
import dotenv from 'dotenv';

// Load .env from the current working directory or the directory of the script
dotenv.config();

const config = new Conf({
  projectName: 'zentria-cli',
});

export class AuthService {
  private static TOKEN_KEY = 'auth_token';
  private static BASE_URL_KEY = 'api_base_url';

  static setToken(token: string) {
    config.set(this.TOKEN_KEY, token);
  }

  static getToken(): string | undefined {
    return (config.get(this.TOKEN_KEY) as string) || process.env['ZENTRIA_TOKEN'];
  }

  static clearToken() {
    config.delete(this.TOKEN_KEY);
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
}
