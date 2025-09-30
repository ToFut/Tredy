import Nango from "@nangohq/frontend";
import { showCredentialsPopup } from "./popups/CredentialsPopup.js";
import { showWhatsAppPopup } from "./popups/WhatsAppPopup.js";
/**
 * Modular Nango service for handling OAuth connections
 */
class NangoService {
  constructor() {
    this.nango = null;
    this.publicKey = null;
    this.initialized = false;
  }

  /**
   * Initialize Nango with public key from backend
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Get Nango config from backend
      const response = await fetch("/api/v1/system/nango-config");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const config = await response.json();

      if (!config.publicKey) {
        throw new Error("Nango public key not configured");
      }

      this.publicKey = config.publicKey;
      this.nango = new Nango({
        publicKey: this.publicKey,
        host: config.host || "https://api.nango.dev",
      });

      // Store environment info
      this.environment = config.environment || "development";
      this.isProduction = this.environment === "production";

      this.initialized = true;
      console.log(
        `[NangoService] Initialized successfully in ${this.environment.toUpperCase()} mode`
      );
    } catch (error) {
      console.error("[NangoService] Failed to initialize:", error);
      throw error;
    }
  }

  /**
   * Start OAuth flow or BASIC auth for a provider
   * Automatically prompts for credentials when needed
   */
  async connect(providerConfigKey, connectionId, options = {}) {
    await this.initialize();

    if (!this.nango) {
      throw new Error("Nango not initialized");
    }

    try {
      console.log(
        `[NangoService] Starting connection for ${providerConfigKey} with connection ${connectionId}`
      );

      let result;

      if (providerConfigKey === "twilio" ) {
        // Show popup for credentials if not provided
        let credentials = options.credentials;
        if (!credentials) {
          credentials = await showCredentialsPopup(providerConfigKey);
          if (!credentials) {
            throw new Error("Credentials are required for this provider");
          }
        }

        console.log(`[NangoService] Starting BASIC auth for ${providerConfigKey}`);
        result = await this.nango.auth(providerConfigKey, connectionId, {
          credentials: {
            username: credentials.username,
            password: credentials.password 
          }
        });
      } 
      else if (providerConfigKey === "whatsapp") {
        // Show popup for credentials if not provided
        let credentials = options.credentials;
        if (!credentials) {
          credentials = await showWhatsAppPopup(providerConfigKey);
          if (!credentials) {
            throw new Error("Credentials are required for this provider");
          }
        }

        console.log(`[NangoService] Starting BASIC auth for ${providerConfigKey}`);
        result = await this.nango.auth(providerConfigKey, connectionId, { 
          credentials: {
            apiKey: ''
          }
        });
      } 
      else {
        // OAuth flow for other providers
        console.log(`[NangoService] Starting OAuth for ${providerConfigKey}`);
        result = await this.nango.auth(providerConfigKey, connectionId, {
          detectClosedAuthWindow: true,
          ...options,
        });
      }

      console.log("[NangoService] Connection completed:", result);
      return result;
    } catch (error) {
      console.error("[NangoService] Connection failed:", error);
      throw error;
    }
  }


  /**
   * Get connection status
   */
  async getConnection(providerConfigKey, connectionId) {
    await this.initialize();

    if (!this.nango) {
      throw new Error("Nango not initialized");
    }

    try {
      return await this.nango.getConnection(providerConfigKey, connectionId);
    } catch (error) {
      console.error("[NangoService] Failed to get connection:", error);
      return null;
    }
  }

  /**
   * Delete a connection
   */
  async deleteConnection(providerConfigKey, connectionId) {
    await this.initialize();

    if (!this.nango) {
      throw new Error("Nango not initialized");
    }

    try {
      return await this.nango.deleteConnection(providerConfigKey, connectionId);
    } catch (error) {
      console.error("[NangoService] Failed to delete connection:", error);
      throw error;
    }
  }

  /**
   * Check if Nango is properly configured
   */
  async isConfigured() {
    try {
      await this.initialize();
      return this.initialized;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const nangoService = new NangoService();
export default nangoService;
