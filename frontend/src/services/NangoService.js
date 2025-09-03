import Nango from '@nangohq/frontend';

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
      const response = await fetch('/api/v1/system/nango-config');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const config = await response.json();
      
      if (!config.publicKey) {
        throw new Error('Nango public key not configured');
      }

      this.publicKey = config.publicKey;
      this.nango = new Nango({ 
        publicKey: this.publicKey,
        host: config.host || 'https://api.nango.dev'
      });
      
      // Store environment info
      this.environment = config.environment || 'development';
      this.isProduction = this.environment === 'production';
      
      this.initialized = true;
      console.log(`[NangoService] Initialized successfully in ${this.environment.toUpperCase()} mode`);
    } catch (error) {
      console.error('[NangoService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Start OAuth flow for a provider
   */
  async connect(providerConfigKey, connectionId, options = {}) {
    await this.initialize();

    if (!this.nango) {
      throw new Error('Nango not initialized');
    }

    try {
      console.log(`[NangoService] Starting OAuth for ${providerConfigKey} with connection ${connectionId}`);
      
      const result = await this.nango.auth(providerConfigKey, connectionId, {
        detectClosedAuthWindow: true,
        ...options
      });

      console.log('[NangoService] OAuth completed:', result);
      return result;
    } catch (error) {
      console.error('[NangoService] OAuth failed:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  async getConnection(providerConfigKey, connectionId) {
    await this.initialize();

    if (!this.nango) {
      throw new Error('Nango not initialized');
    }

    try {
      return await this.nango.getConnection(providerConfigKey, connectionId);
    } catch (error) {
      console.error('[NangoService] Failed to get connection:', error);
      return null;
    }
  }

  /**
   * Delete a connection
   */
  async deleteConnection(providerConfigKey, connectionId) {
    await this.initialize();

    if (!this.nango) {
      throw new Error('Nango not initialized');
    }

    try {
      return await this.nango.deleteConnection(providerConfigKey, connectionId);
    } catch (error) {
      console.error('[NangoService] Failed to delete connection:', error);
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