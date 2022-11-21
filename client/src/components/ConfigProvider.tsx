import React, { useContext } from "react";
import { AppConfig, AppConfigService } from "../services/config";

/**
 * The react context for the app config.
 */
const ConfigContext = React.createContext<AppConfig | null>(null);

/**
 * Load the app config asynchronously and provide it via context.
 */
export const ConfigProvider = ({
  config,
  children,
}: {
  config: AppConfigService;
  children: React.ReactNode;
}) => {
  // Use suspense to show a loading spinner while request is loading.
  if (!config.loaded()) {
    throw config.ready();
  }

  return (
    <ConfigContext.Provider value={config.config}>
      {children}
    </ConfigContext.Provider>
  );
};

/**
 * Get the app config from context.
 */
export const useConfig = () => useContext(ConfigContext)!;
