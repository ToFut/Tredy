/**
 * WhatsApp API key popup utility for authentication flows
 */

/**
 * Show a popup form for user to enter WhatsApp API key
 * @param {string} providerConfigKey - The provider configuration key
 * @returns {Promise<Object|null>} - Credentials object with apiKey or null if cancelled
 */
export async function showWhatsAppPopup(providerConfigKey) {
  return new Promise((resolve) => {
    const providerName =
      providerConfigKey.charAt(0).toUpperCase() + providerConfigKey.slice(1);

    // Create popup overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create popup content
    const popup = document.createElement("div");
    popup.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      width: 400px;
      max-width: 90vw;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;

    popup.innerHTML = `
      <h2 style="margin: 0 0 20px 0; color: #333; font-size: 20px;">Connect to ${providerName}</h2>
      <div style="margin-bottom: 24px;">
        <label style="display: block; margin-bottom: 6px; color: #555; font-weight: 500;">API Key:</label>
        <input
          type="password"
          id="whatsapp-api-key"
          placeholder="Enter your WhatsApp API key"
          style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box;"
        />
        <small style="color: #666; font-size: 12px; margin-top: 4px; display: block;">
          You can find your API key in your WhatsApp Business API dashboard
        </small>
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button
          id="whatsapp-cancel"
          style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-size: 14px;"
        >
          Cancel
        </button>
        <button
          id="whatsapp-connect"
          style="padding: 10px 20px; border: none; background: #25D366; color: white; border-radius: 6px; cursor: pointer; font-size: 14px;"
        >
          Connect
        </button>
      </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Focus on API key field
    setTimeout(() => {
      const apiKeyInput = document.getElementById("whatsapp-api-key");
      if (apiKeyInput) apiKeyInput.focus();
    }, 100);

    // Handle form submission
    const handleConnect = () => {
      const apiKey = document.getElementById("whatsapp-api-key").value.trim();

      if (!apiKey) {
        alert("Please enter your WhatsApp API key");
        return;
      }

      document.body.removeChild(overlay);
      resolve({
        apiKey: apiKey,
      });
    };

    // Handle cancellation
    const handleCancel = () => {
      document.body.removeChild(overlay);
      resolve(null);
    };

    // Event listeners
    document
      .getElementById("whatsapp-connect")
      .addEventListener("click", handleConnect);
    document
      .getElementById("whatsapp-cancel")
      .addEventListener("click", handleCancel);

    // Handle Enter key
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleConnect();
      } else if (e.key === "Escape") {
        handleCancel();
      }
    });

    // Handle click outside popup
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        handleCancel();
      }
    });
  });
}
