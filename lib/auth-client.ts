// Cliente de autenticação que gerencia tokens no cliente
export class AuthClient {
  private static TOKEN_KEY = 'auth-token-backup';
  
  static saveToken(token: string) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.TOKEN_KEY, token);
      } catch (e) {
        console.error('Error saving token to localStorage:', e);
      }
    }
  }
  
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(this.TOKEN_KEY);
      } catch (e) {
        console.error('Error getting token from localStorage:', e);
        return null;
      }
    }
    return null;
  }
  
  static clearToken() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.TOKEN_KEY);
      } catch (e) {
        console.error('Error clearing token from localStorage:', e);
      }
    }
  }
  
  static async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = this.getToken();
    
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    
    if (token) {
      headers.set('X-Auth-Token', token);
    }
    
    return fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
  }
}
