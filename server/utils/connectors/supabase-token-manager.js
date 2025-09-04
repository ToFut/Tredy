const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

/**
 * Manages secure token storage in Supabase
 * Tokens are encrypted before storage and can only be accessed by the user who owns them
 */
class SupabaseTokenManager {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    this.encryptionKey = process.env.TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET;
    
    if (this.supabaseUrl && this.supabaseServiceKey) {
      this.supabase = createClient(this.supabaseUrl, this.supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  /**
   * Check if Supabase is configured
   */
  isConfigured() {
    return !!(this.supabaseUrl && this.supabaseServiceKey && this.supabase);
  }

  /**
   * Encrypt sensitive data before storage
   */
  encrypt(text) {
    if (!this.encryptionKey) {
      throw new Error("Encryption key not configured");
    }

    const algorithm = "aes-256-gcm";
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(this.encryptionKey, salt, 100000, 32, "sha256");
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      salt: salt.toString("hex"),
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
    };
  }

  /**
   * Decrypt data retrieved from storage
   */
  decrypt(encryptedData) {
    if (!this.encryptionKey) {
      throw new Error("Encryption key not configured");
    }

    const algorithm = "aes-256-gcm";
    const salt = Buffer.from(encryptedData.salt, "hex");
    const key = crypto.pbkdf2Sync(this.encryptionKey, salt, 100000, 32, "sha256");
    const iv = Buffer.from(encryptedData.iv, "hex");
    const authTag = Buffer.from(encryptedData.authTag, "hex");
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  }

  /**
   * Store tokens securely in Supabase
   */
  async storeToken({ userSupabaseId, provider, tokens }) {
    if (!this.isConfigured()) {
      console.warn("Supabase not configured, skipping secure token storage");
      return null;
    }

    try {
      // Encrypt the tokens
      const encryptedTokens = this.encrypt(JSON.stringify(tokens));
      
      // Generate a unique reference ID
      const tokenRef = crypto.randomUUID();
      
      // Store in Supabase
      const { data, error } = await this.supabase
        .from("secure_connector_tokens")
        .upsert({
          id: tokenRef,
          user_supabase_id: userSupabaseId,
          provider,
          encrypted_tokens: encryptedTokens,
          expires_at: tokens.expiresAt || null,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to store token in Supabase:", error);
        return null;
      }

      return tokenRef;
    } catch (error) {
      console.error("Failed to store secure token:", error);
      return null;
    }
  }

  /**
   * Retrieve tokens from Supabase
   */
  async getToken(tokenRef, userSupabaseId) {
    if (!this.isConfigured()) {
      console.warn("Supabase not configured");
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from("secure_connector_tokens")
        .select("*")
        .eq("id", tokenRef)
        .eq("user_supabase_id", userSupabaseId)
        .single();

      if (error || !data) {
        console.error("Failed to retrieve token from Supabase:", error);
        return null;
      }

      // Decrypt the tokens
      const decryptedTokens = this.decrypt(data.encrypted_tokens);
      return JSON.parse(decryptedTokens);
    } catch (error) {
      console.error("Failed to retrieve secure token:", error);
      return null;
    }
  }

  /**
   * Update tokens (e.g., after refresh)
   */
  async updateToken(tokenRef, userSupabaseId, newTokens) {
    if (!this.isConfigured()) {
      console.warn("Supabase not configured");
      return false;
    }

    try {
      // Encrypt the new tokens
      const encryptedTokens = this.encrypt(JSON.stringify(newTokens));
      
      const { error } = await this.supabase
        .from("secure_connector_tokens")
        .update({
          encrypted_tokens: encryptedTokens,
          expires_at: newTokens.expiresAt || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tokenRef)
        .eq("user_supabase_id", userSupabaseId);

      if (error) {
        console.error("Failed to update token in Supabase:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to update secure token:", error);
      return false;
    }
  }

  /**
   * Delete tokens from Supabase
   */
  async deleteToken(tokenRef) {
    if (!this.isConfigured()) {
      console.warn("Supabase not configured");
      return true;
    }

    try {
      const { error } = await this.supabase
        .from("secure_connector_tokens")
        .delete()
        .eq("id", tokenRef);

      if (error) {
        console.error("Failed to delete token from Supabase:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to delete secure token:", error);
      return false;
    }
  }

  /**
   * Create the secure tokens table in Supabase (run once during setup)
   */
  async createSecureTokensTable() {
    if (!this.isConfigured()) {
      console.warn("Supabase not configured");
      return false;
    }

    const sql = `
      CREATE TABLE IF NOT EXISTS secure_connector_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_supabase_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        encrypted_tokens JSONB NOT NULL,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_supabase_id, provider)
      );

      -- Enable RLS
      ALTER TABLE secure_connector_tokens ENABLE ROW LEVEL SECURITY;

      -- Create policy for user access
      CREATE POLICY "Users can manage own tokens" ON secure_connector_tokens
        FOR ALL 
        USING (auth.uid()::text = user_supabase_id);

      -- Create index for faster lookups
      CREATE INDEX idx_secure_tokens_user_provider 
        ON secure_connector_tokens(user_supabase_id, provider);
    `;

    try {
      const { error } = await this.supabase.rpc("exec_sql", { sql });
      if (error) {
        console.error("Failed to create secure tokens table:", error);
        return false;
      }
      console.log("Secure tokens table created successfully");
      return true;
    } catch (error) {
      console.error("Failed to create secure tokens table:", error);
      return false;
    }
  }
}

module.exports = { SupabaseTokenManager };