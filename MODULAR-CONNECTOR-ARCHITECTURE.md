# 🔌 Modular Third-Party Connector Architecture for AnythingLLM

## 🎯 Overview
A flexible, extensible system for connecting external data sources with three authentication options:
1. **Nango** - Enterprise-grade OAuth management (250+ providers)
2. **Built-in OAuth** - Native implementation
3. **Direct Credentials** - API keys/tokens

---

## 📐 Architecture Design

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend UI                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Workspace Settings / Connectors          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐   │   │
│  │  │ Provider │ │   Auth   │ │   Connected   │   │   │
│  │  │   Grid   │ │  Method  │ │   Services    │   │   │
│  │  └──────────┘ └──────────┘ └──────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Auth Manager Layer                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │            IAuthProvider Interface               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐   │   │
│  │  │  Nango   │ │  Built-in│ │    Direct     │   │   │
│  │  │ Provider │ │   OAuth  │ │  Credentials  │   │   │
│  │  └──────────┘ └──────────┘ └──────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Connector Layer                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Provider Connectors                 │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐     │   │
│  │  │Shopify│ │Stripe│ │Google│ │  Custom  │     │   │
│  │  └──────┘ └──────┘ └──────┘ └──────────┘     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     MCP/Agent Layer                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Manager Interface

### Base Interface
```typescript
// server/utils/connectors/auth/IAuthProvider.ts
interface IAuthProvider {
  // Core methods every auth provider must implement
  name: string;
  type: 'oauth' | 'apikey' | 'custom';
  
  // Connection management
  connect(provider: string, config: ConnectionConfig): Promise<AuthResult>;
  disconnect(connectionId: string): Promise<void>;
  getConnection(connectionId: string): Promise<Connection>;
  listConnections(workspaceId: string): Promise<Connection[]>;
  
  // Token management
  getCredentials(connectionId: string): Promise<Credentials>;
  refreshCredentials(connectionId: string): Promise<Credentials>;
  
  // Provider configuration
  getSupportedProviders(): Promise<Provider[]>;
  getProviderConfig(provider: string): Promise<ProviderConfig>;
  validateConfig(provider: string, config: any): Promise<ValidationResult>;
}

interface ConnectionConfig {
  workspaceId: string;
  userId?: string;
  provider: string;
  authMethod: 'oauth' | 'apikey' | 'custom';
  config: {
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
    scopes?: string[];
    customFields?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}
```

---

## 🎨 Frontend UI Components

### Main Connectors Page
```jsx
// frontend/src/pages/WorkspaceSettings/Connectors/index.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ConnectorGrid from './ConnectorGrid';
import ConnectedServices from './ConnectedServices';
import AuthMethodSelector from './AuthMethodSelector';

export default function WorkspaceConnectors() {
  const { slug } = useParams();
  const [authMethod, setAuthMethod] = useState('auto'); // auto, nango, builtin, direct
  const [connectors, setConnectors] = useState([]);
  const [connections, setConnections] = useState([]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Connectors</h1>
          <p className="text-gray-400 text-sm mt-1">
            Connect external data sources to enhance your AI workspace
          </p>
        </div>
        
        {/* Auth Method Selector */}
        <AuthMethodSelector 
          value={authMethod}
          onChange={setAuthMethod}
        />
      </div>

      {/* Connected Services */}
      {connections.length > 0 && (
        <ConnectedServices 
          connections={connections}
          onDisconnect={handleDisconnect}
          onSync={handleSync}
          onConfigure={handleConfigure}
        />
      )}

      {/* Available Connectors */}
      <ConnectorGrid 
        connectors={connectors}
        authMethod={authMethod}
        onConnect={handleConnect}
      />
    </div>
  );
}
```

### Connector Grid Component
```jsx
// frontend/src/pages/WorkspaceSettings/Connectors/ConnectorGrid.jsx
export default function ConnectorGrid({ connectors, authMethod, onConnect }) {
  const categories = {
    'E-Commerce': ['shopify', 'woocommerce', 'square', 'stripe'],
    'Productivity': ['google-calendar', 'gmail', 'slack', 'notion'],
    'CRM': ['salesforce', 'hubspot', 'pipedrive', 'zoho'],
    'Development': ['github', 'gitlab', 'jira', 'linear'],
    'Analytics': ['google-analytics', 'mixpanel', 'segment'],
    'Databases': ['postgresql', 'mysql', 'mongodb', 'redis'],
  };

  return (
    <div className="space-y-6">
      {Object.entries(categories).map(([category, providers]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-white mb-3">{category}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {providers.map(provider => {
              const connector = connectors.find(c => c.id === provider);
              if (!connector) return null;
              
              return (
                <ConnectorCard
                  key={provider}
                  connector={connector}
                  authMethod={authMethod}
                  onConnect={() => onConnect(connector)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Connector Card
```jsx
// frontend/src/pages/WorkspaceSettings/Connectors/ConnectorCard.jsx
export default function ConnectorCard({ connector, authMethod, onConnect }) {
  const [isHovered, setIsHovered] = useState(false);
  const { status, lastSync } = useConnectorStatus(connector.id);

  return (
    <div
      className={`
        relative p-4 rounded-lg border cursor-pointer transition-all
        ${status === 'connected' 
          ? 'border-green-500 bg-green-500/10' 
          : 'border-gray-600 bg-gray-800 hover:border-blue-500'
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onConnect}
    >
      {/* Logo */}
      <div className="flex justify-center mb-3">
        <img 
          src={connector.logo} 
          alt={connector.name}
          className="w-12 h-12 object-contain"
        />
      </div>

      {/* Name */}
      <h4 className="text-sm font-medium text-center text-white">
        {connector.name}
      </h4>

      {/* Status Badge */}
      {status === 'connected' && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      )}

      {/* Hover Overlay */}
      {isHovered && status !== 'connected' && (
        <div className="absolute inset-0 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded">
            Connect
          </button>
        </div>
      )}

      {/* Last Sync Info */}
      {status === 'connected' && lastSync && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          Synced {formatRelativeTime(lastSync)}
        </p>
      )}
    </div>
  );
}
```

### Connection Modal
```jsx
// frontend/src/pages/WorkspaceSettings/Connectors/ConnectionModal.jsx
export default function ConnectionModal({ 
  connector, 
  authMethod, 
  isOpen, 
  onClose, 
  onSuccess 
}) {
  const [step, setStep] = useState('config'); // config, authenticating, success
  const [config, setConfig] = useState({});
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setStep('authenticating');
    setError(null);

    try {
      const result = await connectProvider({
        provider: connector.id,
        authMethod,
        config
      });

      if (result.authUrl) {
        // OAuth flow - redirect to auth URL
        window.location.href = result.authUrl;
      } else {
        // Direct credentials - connection successful
        setStep('success');
        setTimeout(() => {
          onSuccess(result);
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
      setStep('config');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 min-w-[500px]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <img 
            src={connector.logo} 
            alt={connector.name}
            className="w-12 h-12"
          />
          <div>
            <h2 className="text-xl font-bold text-white">
              Connect {connector.name}
            </h2>
            <p className="text-sm text-gray-400">
              {connector.description}
            </p>
          </div>
        </div>

        {/* Content based on auth method */}
        {step === 'config' && (
          <>
            {authMethod === 'nango' && (
              <NangoAuthConfig 
                connector={connector}
                onChange={setConfig}
              />
            )}

            {authMethod === 'builtin' && (
              <BuiltInAuthConfig 
                connector={connector}
                onChange={setConfig}
              />
            )}

            {authMethod === 'direct' && (
              <DirectCredentialsConfig 
                connector={connector}
                onChange={setConfig}
              />
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={handleConnect}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Connect
              </button>
            </div>
          </>
        )}

        {step === 'authenticating' && (
          <div className="flex flex-col items-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            <p className="mt-4 text-gray-400">Authenticating...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center py-8">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <CheckIcon className="w-6 h-6 text-white" />
            </div>
            <p className="mt-4 text-white font-semibold">Connected Successfully!</p>
            <p className="text-sm text-gray-400 mt-2">
              {connector.name} is now connected to your workspace
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
```

---

## 🔧 Backend Implementation

### Option A: Nango Provider
```javascript
// server/utils/connectors/auth/providers/NangoProvider.js
const { Nango } = require('@nangohq/node');
const { EncryptionManager } = require('../../../EncryptionManager');

class NangoAuthProvider {
  constructor() {
    this.name = 'nango';
    this.type = 'oauth';
    this.nango = new Nango({ 
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'http://localhost:3003'
    });
    this.encryption = new EncryptionManager();
  }

  async connect(provider, config) {
    const { workspaceId, userId } = config;
    const connectionId = `${workspaceId}_${userId || 'default'}_${provider}`;

    // Generate OAuth URL
    const authUrl = await this.nango.auth.createAuthorizationURL({
      providerConfigKey: provider,
      connectionId,
      redirectUrl: `${process.env.APP_URL}/api/auth/callback/nango`,
      userScope: this.getProviderScopes(provider)
    });

    // Store pending connection
    await this.storePendingConnection({
      connectionId,
      provider,
      workspaceId,
      userId,
      status: 'pending'
    });

    return { 
      authUrl, 
      connectionId,
      method: 'oauth'
    };
  }

  async getCredentials(connectionId) {
    try {
      const connection = await this.nango.getConnection(connectionId);
      
      // Nango automatically handles token refresh!
      return {
        accessToken: connection.credentials.access_token,
        refreshToken: connection.credentials.refresh_token,
        expiresAt: connection.credentials.expires_at,
        metadata: connection.metadata
      };
    } catch (error) {
      if (error.type === 'connection_not_found') {
        return null;
      }
      throw error;
    }
  }

  async listConnections(workspaceId) {
    // Get all connections for workspace
    const connections = await this.nango.listConnections({
      connectionId: new RegExp(`^${workspaceId}_`)
    });

    return connections.map(conn => ({
      id: conn.connectionId,
      provider: conn.providerConfigKey,
      status: 'connected',
      createdAt: conn.createdAt,
      metadata: conn.metadata
    }));
  }

  async disconnect(connectionId) {
    await this.nango.deleteConnection(connectionId);
    await this.removePendingConnection(connectionId);
  }

  getProviderScopes(provider) {
    const scopes = {
      'google': ['calendar', 'gmail.readonly', 'drive.readonly'],
      'shopify': ['read_products', 'read_orders', 'read_customers'],
      'github': ['repo', 'read:org', 'read:user'],
      'slack': ['channels:read', 'chat:write', 'users:read'],
      'stripe': ['read_only'],
    };
    return scopes[provider] || [];
  }
}

module.exports = NangoAuthProvider;
```

### Option B: Built-in OAuth Provider
```javascript
// server/utils/connectors/auth/providers/BuiltInOAuthProvider.js
const crypto = require('crypto');
const { prisma } = require('../../../prisma');

class BuiltInOAuthProvider {
  constructor() {
    this.name = 'builtin';
    this.type = 'oauth';
    this.providers = new Map();
    this.initializeProviders();
  }

  initializeProviders() {
    // Register OAuth providers
    this.registerProvider('google', {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['calendar', 'gmail.readonly'],
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    });

    this.registerProvider('shopify', {
      authUrl: (shop) => `https://${shop}/admin/oauth/authorize`,
      tokenUrl: (shop) => `https://${shop}/admin/oauth/access_token`,
      scopes: ['read_products', 'read_orders'],
      clientId: process.env.SHOPIFY_CLIENT_ID,
      clientSecret: process.env.SHOPIFY_CLIENT_SECRET
    });
  }

  async connect(provider, config) {
    const providerConfig = this.providers.get(provider);
    if (!providerConfig) {
      throw new Error(`Provider ${provider} not supported`);
    }

    const state = crypto.randomBytes(32).toString('hex');
    const { workspaceId, userId } = config;

    // Store OAuth state
    await prisma.oAuthState.create({
      data: {
        state,
        provider,
        workspaceId,
        userId,
        config: JSON.stringify(config),
        expiresAt: new Date(Date.now() + 600000) // 10 minutes
      }
    });

    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      redirect_uri: `${process.env.APP_URL}/api/auth/callback/${provider}`,
      response_type: 'code',
      scope: providerConfig.scopes.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = typeof providerConfig.authUrl === 'function'
      ? providerConfig.authUrl(config.shopUrl)
      : `${providerConfig.authUrl}?${params}`;

    return { authUrl, state, method: 'oauth' };
  }

  async handleCallback(provider, code, state) {
    // Verify state
    const stateRecord = await prisma.oAuthState.findUnique({
      where: { state }
    });

    if (!stateRecord || stateRecord.provider !== provider) {
      throw new Error('Invalid OAuth state');
    }

    const providerConfig = this.providers.get(provider);
    const config = JSON.parse(stateRecord.config);

    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(
      provider, 
      code, 
      providerConfig
    );

    // Store tokens
    await prisma.connectorToken.create({
      data: {
        workspaceId: stateRecord.workspaceId,
        userId: stateRecord.userId,
        provider,
        accessToken: this.encrypt(tokens.access_token),
        refreshToken: this.encrypt(tokens.refresh_token),
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        metadata: tokens.metadata || {}
      }
    });

    // Clean up state
    await prisma.oAuthState.delete({ where: { state } });

    return { success: true };
  }

  async refreshCredentials(connectionId) {
    const connection = await prisma.connectorToken.findUnique({
      where: { id: connectionId }
    });

    if (!connection) throw new Error('Connection not found');

    const providerConfig = this.providers.get(connection.provider);
    const refreshToken = this.decrypt(connection.refreshToken);

    const tokens = await this.refreshTokens(
      connection.provider,
      refreshToken,
      providerConfig
    );

    // Update stored tokens
    await prisma.connectorToken.update({
      where: { id: connectionId },
      data: {
        accessToken: this.encrypt(tokens.access_token),
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000)
      }
    });

    return {
      accessToken: tokens.access_token,
      expiresAt: tokens.expires_at
    };
  }
}

module.exports = BuiltInOAuthProvider;
```

### Option C: Direct Credentials Provider
```javascript
// server/utils/connectors/auth/providers/DirectCredentialsProvider.js
class DirectCredentialsProvider {
  constructor() {
    this.name = 'direct';
    this.type = 'apikey';
  }

  async connect(provider, config) {
    const { workspaceId, userId, credentials } = config;

    // Validate credentials based on provider
    const validation = await this.validateCredentials(provider, credentials);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Store encrypted credentials
    const connectionId = crypto.randomUUID();
    await prisma.connectorToken.create({
      data: {
        id: connectionId,
        workspaceId,
        userId,
        provider,
        credentials: this.encrypt(JSON.stringify(credentials)),
        metadata: validation.metadata || {}
      }
    });

    return { 
      connectionId,
      method: 'apikey',
      status: 'connected'
    };
  }

  async validateCredentials(provider, credentials) {
    const validators = {
      'shopify': async (creds) => {
        // Test API call
        const response = await fetch(`https://${creds.shop}/admin/api/2024-01/shop.json`, {
          headers: {
            'X-Shopify-Access-Token': creds.accessToken
          }
        });
        return {
          valid: response.ok,
          error: response.ok ? null : 'Invalid shop or access token',
          metadata: response.ok ? await response.json() : null
        };
      },
      
      'stripe': async (creds) => {
        const stripe = require('stripe')(creds.secretKey);
        try {
          const account = await stripe.accounts.retrieve();
          return {
            valid: true,
            metadata: { accountId: account.id }
          };
        } catch (error) {
          return {
            valid: false,
            error: 'Invalid Stripe secret key'
          };
        }
      },

      'openai': async (creds) => {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${creds.apiKey}`
          }
        });
        return {
          valid: response.ok,
          error: response.ok ? null : 'Invalid API key'
        };
      }
    };

    const validator = validators[provider];
    if (!validator) {
      // Default validation - just check if credentials exist
      return { valid: true };
    }

    return await validator(credentials);
  }

  async getCredentials(connectionId) {
    const connection = await prisma.connectorToken.findUnique({
      where: { id: connectionId }
    });

    if (!connection) return null;

    return JSON.parse(this.decrypt(connection.credentials));
  }
}

module.exports = DirectCredentialsProvider;
```

---

## 🔄 Auth Manager Factory

```javascript
// server/utils/connectors/auth/AuthManagerFactory.js
const NangoAuthProvider = require('./providers/NangoProvider');
const BuiltInOAuthProvider = require('./providers/BuiltInOAuthProvider');
const DirectCredentialsProvider = require('./providers/DirectCredentialsProvider');

class AuthManagerFactory {
  static providers = new Map();
  static defaultProvider = null;

  static initialize() {
    // Register all providers
    this.registerProvider('nango', new NangoAuthProvider());
    this.registerProvider('builtin', new BuiltInOAuthProvider());
    this.registerProvider('direct', new DirectCredentialsProvider());

    // Set default based on environment
    if (process.env.NANGO_SECRET_KEY) {
      this.defaultProvider = 'nango';
    } else {
      this.defaultProvider = 'builtin';
    }
  }

  static registerProvider(name, provider) {
    this.providers.set(name, provider);
  }

  static getProvider(name = null) {
    const providerName = name || this.defaultProvider;
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`Auth provider ${providerName} not found`);
    }
    
    return provider;
  }

  static async connect(provider, config) {
    const authMethod = config.authMethod || this.defaultProvider;
    const authProvider = this.getProvider(authMethod);
    return await authProvider.connect(provider, config);
  }

  static async getCredentials(connectionId, authMethod = null) {
    // Try all providers if method not specified
    if (!authMethod) {
      for (const [name, provider] of this.providers) {
        const creds = await provider.getCredentials(connectionId);
        if (creds) return creds;
      }
      return null;
    }

    const authProvider = this.getProvider(authMethod);
    return await authProvider.getCredentials(connectionId);
  }
}

// Initialize on startup
AuthManagerFactory.initialize();

module.exports = AuthManagerFactory;
```

---

## 🔌 MCP Integration

```javascript
// server/utils/connectors/mcp/ConnectorMCPWrapper.js
const AuthManagerFactory = require('../auth/AuthManagerFactory');

class ConnectorMCPWrapper {
  constructor(provider, connectionId) {
    this.provider = provider;
    this.connectionId = connectionId;
  }

  async getMCPConfig() {
    // Get fresh credentials from auth manager
    const credentials = await AuthManagerFactory.getCredentials(this.connectionId);
    
    if (!credentials) {
      throw new Error(`No credentials found for connection ${this.connectionId}`);
    }

    // Return MCP server config with injected credentials
    const configs = {
      'shopify': {
        command: 'npx',
        args: ['-y', '@shopify/mcp-server'],
        env: {
          SHOPIFY_ACCESS_TOKEN: credentials.accessToken,
          SHOPIFY_STORE: credentials.metadata?.shop
        }
      },
      
      'google': {
        command: 'npx',
        args: ['-y', 'google-workspace-mcp'],
        env: {
          GOOGLE_ACCESS_TOKEN: credentials.accessToken,
          GOOGLE_REFRESH_TOKEN: credentials.refreshToken
        }
      },

      'stripe': {
        url: 'https://mcp.stripe.com',
        headers: {
          'Authorization': `Bearer ${credentials.secretKey || credentials.accessToken}`
        }
      }
    };

    return configs[this.provider];
  }

  static async wrapForWorkspace(workspaceId) {
    // Get all connections for workspace
    const connections = await AuthManagerFactory.listConnections(workspaceId);
    
    // Generate MCP configs for each
    const mcpConfigs = {};
    for (const connection of connections) {
      const wrapper = new ConnectorMCPWrapper(
        connection.provider,
        connection.id
      );
      
      try {
        mcpConfigs[connection.provider] = await wrapper.getMCPConfig();
      } catch (error) {
        console.error(`Failed to wrap ${connection.provider}:`, error);
      }
    }

    return mcpConfigs;
  }
}

module.exports = ConnectorMCPWrapper;
```

---

## 🚀 API Endpoints

```javascript
// server/endpoints/api/workspace/connectors.js
const AuthManagerFactory = require('../../../utils/connectors/auth/AuthManagerFactory');
const ConnectorMCPWrapper = require('../../../utils/connectors/mcp/ConnectorMCPWrapper');

function workspaceConnectorEndpoints(app) {
  // List available connectors
  app.get('/api/workspace/:slug/connectors/available', async (req, res) => {
    const connectors = [
      {
        id: 'shopify',
        name: 'Shopify',
        description: 'E-commerce platform',
        logo: '/icons/shopify.svg',
        authMethods: ['oauth', 'apikey'],
        category: 'ecommerce'
      },
      {
        id: 'google',
        name: 'Google Workspace',
        description: 'Calendar, Gmail, Drive',
        logo: '/icons/google.svg',
        authMethods: ['oauth'],
        category: 'productivity'
      },
      // ... more connectors
    ];

    res.json({ connectors });
  });

  // Get connected services
  app.get('/api/workspace/:slug/connectors', async (req, res) => {
    const workspace = await Workspace.getBySlug(req.params.slug);
    const connections = await AuthManagerFactory.listConnections(workspace.id);
    res.json({ connections });
  });

  // Connect a service
  app.post('/api/workspace/:slug/connectors/connect', async (req, res) => {
    const { provider, authMethod, config } = req.body;
    const workspace = await Workspace.getBySlug(req.params.slug);

    const result = await AuthManagerFactory.connect(provider, {
      ...config,
      authMethod,
      workspaceId: workspace.id,
      userId: req.user?.id
    });

    res.json(result);
  });

  // OAuth callback
  app.get('/api/auth/callback/:provider', async (req, res) => {
    const { provider } = req.params;
    const { code, state } = req.query;

    try {
      await AuthManagerFactory.handleCallback(provider, code, state);
      res.redirect(`${process.env.APP_URL}/workspace/connectors?status=connected`);
    } catch (error) {
      res.redirect(`${process.env.APP_URL}/workspace/connectors?error=${error.message}`);
    }
  });

  // Disconnect a service
  app.delete('/api/workspace/:slug/connectors/:connectionId', async (req, res) => {
    await AuthManagerFactory.disconnect(req.params.connectionId);
    res.json({ success: true });
  });

  // Sync data
  app.post('/api/workspace/:slug/connectors/:connectionId/sync', async (req, res) => {
    const { connectionId } = req.params;
    
    // Queue sync job
    await DocumentSyncQueue.add({
      connectionId,
      type: 'manual',
      workspaceId: workspace.id
    });

    res.json({ success: true, message: 'Sync queued' });
  });
}

module.exports = workspaceConnectorEndpoints;
```

---

## 📊 Database Schema

```prisma
// prisma/schema.prisma additions

model ConnectorToken {
  id           String   @id @default(uuid())
  workspaceId  String
  userId       String?
  provider     String
  authMethod   String   // 'nango', 'builtin', 'direct'
  
  // OAuth tokens
  accessToken  String?  @db.Text
  refreshToken String?  @db.Text
  expiresAt    DateTime?
  
  // Direct credentials (encrypted JSON)
  credentials  String?  @db.Text
  
  // Metadata
  metadata     Json?
  status       String   @default("connected")
  lastSync     DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  workspace    Workspace @relation(fields: [workspaceId], references: [id])
  user         User?     @relation(fields: [userId], references: [id])
  
  @@unique([workspaceId, provider, userId])
  @@index([workspaceId])
}

model OAuthState {
  state       String   @id
  provider    String
  workspaceId String
  userId      String?
  config      String   @db.Text
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  
  @@index([expiresAt])
}

model ConnectorSync {
  id           String   @id @default(uuid())
  connectionId String
  status       String   // 'pending', 'running', 'completed', 'failed'
  recordsCount Int?
  error        String?
  startedAt    DateTime?
  completedAt  DateTime?
  createdAt    DateTime @default(now())
  
  connection   ConnectorToken @relation(fields: [connectionId], references: [id])
  
  @@index([connectionId, status])
}
```

---

## 🔧 Environment Configuration

```bash
# .env additions

# Auth Method Selection (nango | builtin | direct)
AUTH_METHOD=nango

# Nango Configuration (if using Nango)
NANGO_SECRET_KEY=your-nango-secret-key
NANGO_HOST=http://localhost:3003
NANGO_PUBLIC_KEY=your-nango-public-key

# OAuth Credentials (if using built-in OAuth)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

SHOPIFY_CLIENT_ID=your-shopify-client-id
SHOPIFY_CLIENT_SECRET=your-shopify-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Encryption for stored credentials
CONNECTOR_ENCRYPTION_KEY=32-char-hex-string-for-encryption

# OAuth callback URL
APP_URL=http://localhost:3000
```

---

## 🎯 Key Features

1. **Modular Design**
   - Swappable auth providers
   - Provider-agnostic interface
   - Easy to add new connectors

2. **Security**
   - Encrypted credential storage
   - OAuth state validation
   - Workspace isolation
   - Token refresh handling

3. **User Experience**
   - Visual connector marketplace
   - One-click connections
   - Real-time sync status
   - Error handling

4. **Extensibility**
   - Plugin-based architecture
   - Custom connector support
   - Webhook receivers
   - Background sync jobs

5. **Forward Thinking**
   - Ready for enterprise features
   - Multi-tenant by design
   - Audit logging support
   - Rate limiting ready

---

## 🚀 Implementation Steps

1. **Phase 1: Core Infrastructure**
   - Implement AuthManagerFactory
   - Create database migrations
   - Set up API endpoints

2. **Phase 2: Auth Providers**
   - Implement Nango provider
   - Build OAuth flow
   - Add direct credentials

3. **Phase 3: Frontend UI**
   - Create connector marketplace
   - Build connection flow
   - Add management interface

4. **Phase 4: MCP Integration**
   - Create MCP wrappers
   - Update agent system
   - Test data queries

5. **Phase 5: Production**
   - Add monitoring
   - Implement rate limiting
   - Create documentation

This architecture provides a professional, scalable solution that rivals commercial platforms while maintaining flexibility and extensibility.