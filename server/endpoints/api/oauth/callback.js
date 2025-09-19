/**
 * OAuth callback endpoint for Nango integrations
 * This endpoint receives the OAuth callback and closes the popup window
 */
function oauthCallbackEndpoints(app) {
  if (!app) return;

  /**
   * GET /api/oauth/callback
   * Standard OAuth callback endpoint that closes the popup window
   * This is used by Nango after OAuth completion
   */
  app.get("/api/oauth/callback", async (request, response) => {
    try {
      // Send HTML that closes the popup window
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>OAuth Success</title>
        </head>
        <body>
          <script>
            // Close the popup window
            if (window.opener) {
              window.close();
            } else {
              document.body.innerHTML = '<h1>Authorization successful!</h1><p>You can close this window.</p>';
            }
          </script>
        </body>
        </html>
      `;

      response.send(html);
    } catch (error) {
      console.error("[OAuth] Callback error:", error);
      response.status(500).send("OAuth callback failed");
    }
  });
}

module.exports = { oauthCallbackEndpoints };
