/**
 * Class to implement authentication protocol and store state about current
 * logged in user.
 *
 * Should be used as a singleton.
 */
export class Auth {
  private authenticated = false;

  /**
   * Test whether user is currently authenticated.
   */
  public isLoggedIn() {
    return this.authenticated;
  }

  /**
   * Authenticate with the API.
   */
  public async login(email: string, password: string) {
    this.authenticated = true;
    return true;
  }

  /**
   * Revoke current authentication (if any).
   */
  public async logout() {
    return null;
  }
}

/**
 * Singleton holding state about auth status.
 */
export const auth = new Auth();
