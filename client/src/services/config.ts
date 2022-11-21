/**
 * Describe a reference to a generic static asset with a URL.
 */
export type StaticAsset = Readonly<{
  url: string;
}>;

/**
 * Describe where to fetch an image.
 */
export type ImageAsset = Readonly<{
  url: string;
  alt: string;
  width?: number;
  height?: number;
}>;

/**
 * App config settings that come from the server.
 */
export type AppConfig = Readonly<{
  help_email: string;
  static_base: string;
  sso_url: string;
  logo: ImageAsset;
  theme?: string;
}>;

/**
 * Keys of the app config that reference static assets.
 */
export type AppConfigAssetKey = keyof {
  [P in keyof AppConfig as AppConfig[P] extends StaticAsset ? P : never]: void;
};

/**
 * Get a fully-specified URL given a base URL and a path.
 *
 * The path might be a relative path, an absolute path, or a full URL.
 *
 * The `base` is only used if the `path` is a relative path.
 */
export const getFullUrl = (base: string, path: string) => {
  if (/^(https?:\/\/)|\//i.test(path)) {
    return path;
  }

  return base + path;
};

/**
 * Get the fully-specified URL for an asset.
 *
 * Use this instead of referencing the asset's `url` key directly, since the
 * asset might specify a relative URL that needs to be concatenated to the
 * static base path.
 */
export const getAssetUrl = (config: AppConfig, key: AppConfigAssetKey) => {
  return getFullUrl(config.static_base, config[key].url);
};

/**
 * Service to fetch app configuration from the server.
 */
export class AppConfigService {
  /**
   * The configuration, if any is loaded.
   */
  public config: AppConfig | null = null;

  /**
   * Pending (or completed) request for the config, if one has been started.
   */
  private promise: Promise<AppConfig> | null = null;

  /**
   * Test whether config is loaded yet.
   */
  public loaded() {
    return !!this.config;
  }

  /**
   * Return a promise that resolves with the app configuration.
   *
   * If the config has not been loaded yet, it will be loaded here. If it has
   * already been loaded, the cached config is returned.
   */
  public async ready() {
    if (!this.promise) {
      this.promise = this.fetch();
    }

    return this.promise;
  }

  /**
   * Request the config from the server.
   */
  private async fetch() {
    const r = await fetch("/api/config");
    this.config = (await r.json()) as AppConfig;
    // Wait for theme to load to avoid style flashing as much as possible.
    await this.installTheme();
    return this.config;
  }

  /**
   * Insert any custom stylesheet from the config into the document.
   *
   * If the theme already exists for some reason, update it.
   *
   * The async function will return when the theme has finished loading.
   */
  private async installTheme() {
    if (!this.config?.theme) {
      return;
    }

    // ID for the link element in the body.
    const elId = "rttheme";

    // Remove any pre-existing theme element.
    const oldTheme = document.getElementById(elId);
    if (oldTheme) {
      document.body.removeChild(oldTheme);
    }

    // Create a new theme link tag.
    const theme = document.createElement("link") as HTMLLinkElement;

    // Set up a promise to await the loading of the new theme.
    let resolve = () => {
      /* empty */
    };
    let reject = (e: string | Event) => {
      console.log(e);
    };
    const loadPromise = new Promise<void>((r) => {
      resolve = r;
      reject = (e: string | Event) => {
        console.warn("Failed to load theme:", e);
        r();
      };
    });

    theme.href = getFullUrl(this.config.static_base, this.config.theme);
    theme.onload = resolve;
    theme.onerror = reject;
    theme.rel = "stylesheet";
    theme.type = "text/css";
    theme.id = elId;

    // Install the new theme.
    document.body.appendChild(theme);

    return loadPromise;
  }
}
