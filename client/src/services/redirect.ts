/**
 * Do a hard redirect to a new route.
 */
export const redirect = (path: string) => {
  window.location.pathname = path;
};
