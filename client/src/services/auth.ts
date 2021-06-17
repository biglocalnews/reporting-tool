/**
 * Information about the currently authenticated user.
 */
export type UserProfile = Readonly<{
  id: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  first_name: string;
  last_name: string;
  roles: string[];
}>;

/**
 * Initialization status of the Auth instance.
 */
type AuthInitState = "created" | "initializing" | "ready" | "error";

/**
 * Class to implement authentication protocol and store state about current
 * logged in user.
 *
 * Should be used as a singleton.
 */
export class Auth {
  /**
   * Instantiate an Auth instance with the given fetch implementation.
   *
   * By default this just uses the native `fetch` implementation, but it can be
   * replaced with a customized one, or a mock for testing.
   */
  constructor(private fetcher: typeof fetch) {}

  /**
   * State of the singleton. This only represents the initialization state, not
   * the authentication state.
   */
  public initState: AuthInitState = "created";

  /**
   * Initialization request. This is cached so that calls to `init` are
   * idempotent. Call `reset` to clear it.
   */
  private initPromise: Promise<void> | null = null;

  /**
   * Any error that occurred while initializing authentication.
   */
  private initError: Error | null = null;

  /**
   * Object containing currently authenticated user info.
   */
  private currentUser: UserProfile | null = null;

  /**
   * Test whether user is currently authenticated.
   */
  public isLoggedIn() {
    return !!this.currentUser;
  }

  /**
   * Test whether user has admin permissions.
   */
  public isAdmin() {
    return !!this.currentUser && this.currentUser.roles.includes("admin");
  }

  /**
   * The full name of the currently authenticated user.
   */
  public getFullName() {
    if (!this.currentUser) {
      return "";
    }
    return `${this.currentUser.first_name} ${this.currentUser.last_name}`;
  }

  /**
   * The UUID of the currently authenticated user.
   * @returns {string} UUID
   */
  public getUserId(): string {
    if (!this.currentUser) {
      return "";
    }
    return this.currentUser.id;
  }

  /**
   * The email address of the currently authenticated user.
   * @returns {string} email address
   */
  public getEmail(): string {
    if (!this.currentUser) {
      return "";
    }
    return this.currentUser.email;
  }

  /**
   * Initialize the auth singleton, fetching the current user if there is
   * currently a valid auth token.
   */
  public async init() {
    switch (this.initState) {
      case "created":
        this.initState = "initializing";
        this.initPromise = this.refreshCurrentUser()
          .then((error) => {
            if (error) {
              console.warn("Dropping auth info error", error);
            }
            this.initState = "ready";
          })
          .catch((e) => {
            console.error("Error loading auth info", e);
            this.initState = "error";
            this.initError = e;
          });
        return this.initPromise;
      case "initializing":
        return this.initPromise;
      case "ready":
        return null;
      case "error":
        return this.initError;
    }
  }

  /**
   * Reset auth state. This includes logging out if the user is logged in.
   * The auth state will be reinitialized.
   */
  public async reset() {
    if (this.initPromise) {
      await this.initPromise;
    }
    if (this.currentUser) {
      await this.logout();
    }
    this.initState = "created";
    this.initError = null;
    this.initPromise = null;
    return this.init();
  }

  /**
   * Authenticate with the API.
   *
   * Returns an error string if the request failed, or null otherwise.
   */
  public async login(email: string, password: string) {
    // Update the current auth state. Ignore errors.
    await this.refreshCurrentUser();

    if (this.currentUser) {
      // Current user is already logged in.
      if (this.currentUser.email === email) {
        return null;
      }

      // User is signed in as someone else, so sign out first.
      await this.logout();
    }

    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    const response = await this.fetcher("/auth/cookie/login", {
      credentials: "same-origin",
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      return this.refreshCurrentUser();
    }

    const json = await response.json();

    return (json && json["detail"]) || "An unknown error occurred";
  }

  /**
   * Revoke current authentication (if any).
   *
   * Returns any error that occurred as a string.
   */
  public async logout() {
    const response = await this.fetcher("/auth/cookie/logout", {
      method: "POST",
      credentials: "same-origin",
    });

    if (!response.ok) {
      return "An error occurred trying to sign out.";
    }

    this.currentUser = null;
    return null;
  }

  /**
   * Update current user profile. Return any error that occurs as a string.
   */
  private async refreshCurrentUser() {
    const response = await this.fetcher("/users/me", {
      credentials: "same-origin",
    });

    if (!response.ok) {
      return "Error fetching user profile";
    }

    const json = await response.json();
    this.currentUser = json as UserProfile;
    return null;
  }
}
