/**
 * Information about the currently authenticated user.
 */
type UserProfile = Readonly<{
  id: string;
  email: string;
  is_active: boolean;
  first_name: string;
  last_name: string;
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
   * The full name of the currently authenticated user.
   */
  public getFullName() {
    if (!this.currentUser) {
      return "";
    }
    return `${this.currentUser.first_name} ${this.currentUser.last_name}`;
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

    const response = await fetch("/auth/cookie/login", {
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
    const response = await fetch("/auth/cookie/logout", {
      method: "POST",
      credentials: "same-origin",
    });

    if (!response.ok) {
      return "An error occurred trying to sign out.";
    }

    return null;
  }

  /**
   * Update current user profile. Return any error that occurs as a string.
   */
  private async refreshCurrentUser() {
    const response = await fetch("/users/me", {
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

/**
 * Singleton holding state about auth status.
 */
export const auth = new Auth();
