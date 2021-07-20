/**
 * Proxy that rewrites the /api/ requests to valid API paths, as nginx would
 * do in a location block.
 *
 * Based on https://create-react-app.dev/docs/proxying-api-requests-in-development/#configuring-the-proxy-manually
 */
const createProxyMiddleware = require("http-proxy-middleware");

module.exports = (app) => {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:8000",
      pathRewrite: {
        "^/api/": "/",
      },
      changeOrigin: true,
    })
  );
};
