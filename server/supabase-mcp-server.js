#!/usr/bin/env node

/**
 * Supabase MCP Server (fixed)
 * - more defensive env loading
 * - robust supabase client initialization (anon & service role)
 * - safer file upload handling (Buffer/text)
 * - resilient admin/getUser response handling
 * - clearer logging & error responses for MCP tools
 */

'use strict';

const path = require('path');
const fs = require('fs');

//
// Load dotenv from multiple likely locations (non-throwing)
//
function loadEnvFiles() {
  if (process.env.SUPABASE_URL) return;
  let dotenv;
  try { dotenv = require('dotenv'); } catch (e) { /* dotenv not installed */ }

  if (!dotenv) return;

  const possibleEnvFiles = [
    './.env.development',
    './.env',
    './server/.env.development',
    '../.env.development',
    path.join(__dirname, '.env.development'),
    path.join(__dirname, '../.env.development')
  ];

  for (const envFile of possibleEnvFiles) {
    try {
      if (fs.existsSync(envFile)) {
        dotenv.config({ path: envFile });
        console.error(`[supabase-mcp-tools] Loaded environment from: ${envFile}`);
        if (process.env.SUPABASE_URL) break;
      }
    } catch (e) {
      // continue quietly
    }
  }
}
loadEnvFiles();

//
// Dependencies (MCP SDK + Supabase client)
//
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { Nango } = require('@nangohq/node');
const { createClient } = require('@supabase/supabase-js');
const SupabaseSync = require('./utils/supabase/SupabaseSync.js');

let supabase = null;
let supabaseAdmin = null;

// Workspace detection methods (following Google Drive pattern)
function getWorkspaceId(args) {
  if (args?.workspaceId) return args.workspaceId;
  if (process.env.NANGO_CONNECTION_ID) {
    return process.env.NANGO_CONNECTION_ID.replace('workspace_', '');
  }
  return '1';
}

function getConnectionId(workspaceId) {
  return process.env.NANGO_CONNECTION_ID || `workspace_${workspaceId}`;
}

async function getNangoClient() {
  if (!process.env.NANGO_SECRET_KEY) {
    throw new Error('NANGO_SECRET_KEY environment variable is required');
  }

  return new Nango({
    secretKey: process.env.NANGO_SECRET_KEY,
    host: process.env.NANGO_HOST || 'https://api.nango.dev'
  });
}

async function initSupabase() {
  try {
    // Fallback to environment variables if available
    const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
    const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
    const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    console.error('[supabase-mcp-tools] Environment validation:');
    console.error(`  SUPABASE_URL: ${supabaseUrl ? 'SET' : 'NOT SET'}`);
    console.error(`  SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET' : 'NOT SET'}`);
    console.error(`  SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? 'SET' : 'NOT SET'}`);
    console.error(`  NANGO_SECRET_KEY: ${process.env.NANGO_SECRET_KEY ? 'SET' : 'NOT SET'}`);

    // Init clients (if keys exist) for fallback
    if (supabaseUrl && supabaseAnonKey) {
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      console.error('[supabase-mcp-tools] Supabase client (anon) initialized.');
    }

    if (supabaseUrl && supabaseServiceRoleKey) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      console.error('[supabase-mcp-tools] Supabase admin client (service role) initialized.');
    }
  } catch (err) {
    console.error('[supabase-mcp-tools] initSupabase error:', err && err.message ? err.message : err);
  }
}
initSupabase().catch(err => {
  console.error('[supabase-mcp-tools] Failed to initialize Supabase:', err);
});

//
// Helper utilities
//
function makeErrorResponse(message) {
  return {
    content: [{ type: 'text', text: `Error: ${message}` }],
    isError: true
  };
}

function safeStringify(obj) {
  try { return JSON.stringify(obj, null, 2); } catch (e) { return String(obj); }
}

function toBufferIfNeeded(fileContent, contentType) {
  if (fileContent == null) return null;

  // data:...base64,<data>
  if (typeof fileContent === 'string' && fileContent.startsWith('data:')) {
    const parts = fileContent.split(',');
    return Buffer.from(parts[1] || '', 'base64');
  }

  // plain base64 string (no data: header) -> treat as base64 if other types
  if (typeof fileContent === 'string' && !contentType.startsWith('text/')) {
    // heuristic: if it looks like base64 (only base64 chars and length mod 4 == 0)
    const base64Candidate = fileContent.replace(/\s+/g, '');
    if (/^[A-Za-z0-9+/=]+$/.test(base64Candidate) && (base64Candidate.length % 4 === 0)) {
      return Buffer.from(base64Candidate, 'base64');
    }
  }

  // If content is Buffer already, return
  if (Buffer.isBuffer(fileContent)) return fileContent;

  // For text content keep as string (supabase-js accepts strings too)
  if (typeof fileContent === 'string') return fileContent;

  // For objects, stringify
  return Buffer.from(typeof fileContent === 'object' ? JSON.stringify(fileContent) : String(fileContent));
}

//
// Main server class
//
class SupabaseMCPServer {
  constructor() {
    this.server = new Server({ name: 'supabase-mcp-tools', version: '1.0.0' }, { capabilities: { tools: {} } });
    this.setupTools();
  }

  setupTools() {
    // Tools list
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'query_database',
          description: 'Execute a SELECT query on a Supabase table (simple eq filters supported).',
          inputSchema: {
            type: 'object',
            properties: {
              table: { type: 'string' },
              select: { type: 'string', default: '*' },
              filter: { type: 'object' },
              limit: { type: 'number', default: 100 }
            },
            required: ['table']
          }
        },
        {
          name: 'insert_document',
          description: 'Insert document row (optionally with embedding array in content_embedding).',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' },
              metadata: { type: 'object' },
              embedding: { type: 'array', items: { type: 'number' } },
              workspaceId: { type: 'number', default: 1 }
            },
            required: ['title', 'content']
          }
        },
        {
          name: 'search_documents',
          description: 'Search documents by embedding (RPC) or text (ilike).',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              embedding: { type: 'array', items: { type: 'number' } },
              limit: { type: 'number', default: 10 },
              threshold: { type: 'number', default: 0.7 }
            }
          }
        },
        {
          name: 'upload_file',
          description: 'Upload file to storage bucket. fileContent may be base64 or text.',
          inputSchema: {
            type: 'object',
            properties: {
              bucketName: { type: 'string', default: 'documents' },
              filePath: { type: 'string' },
              fileContent: { type: 'string' },
              contentType: { type: 'string', default: 'text/plain' }
            },
            required: ['filePath', 'fileContent']
          }
        },
        {
          name: 'get_user_info',
          description: 'Get user info via admin API (requires service role key).',
          inputSchema: {
            type: 'object',
            properties: { userId: { type: 'string' } },
            required: ['userId']
          }
        },
        {
          name: 'list_tables',
          description: 'List public tables (best-effort).',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'sync_chat',
          description: 'Sync a chat message to Supabase cloud storage.',
          inputSchema: {
            type: 'object',
            properties: {
              workspaceChat: { type: 'object' }
            },
            required: ['workspaceChat']
          }
        },
        {
          name: 'sync_document',
          description: 'Sync a document and its vector data to Supabase cloud storage.',
          inputSchema: {
            type: 'object',
            properties: {
              document: { type: 'object' },
              vectorData: { type: 'object' }
            },
            required: ['document']
          }
        },
        {
          name: 'sync_workspace',
          description: 'Sync workspace configuration to Supabase cloud storage.',
          inputSchema: {
            type: 'object',
            properties: {
              workspace: { type: 'object' }
            },
            required: ['workspace']
          }
        },
        {
          name: 'track_usage',
          description: 'Track usage event for billing/analytics.',
          inputSchema: {
            type: 'object',
            properties: {
              eventType: { type: 'string' },
              metadata: { type: 'object' }
            },
            required: ['eventType']
          }
        },
        {
          name: 'restore_from_cloud',
          description: 'Restore data from Supabase cloud storage.',
          inputSchema: { type: 'object', properties: {} }
        }
      ]
    }));

    // Tool caller
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params || {};
      console.error(`[supabase-mcp-tools] Processing tool: ${name}`);

      try {
        switch (name) {
          case 'query_database': return await this.queryDatabase(args || {});
          case 'insert_document': return await this.insertDocument(args || {});
          case 'search_documents': return await this.searchDocuments(args || {});
          case 'upload_file': return await this.uploadFile(args || {});
          case 'get_user_info': return await this.getUserInfo(args || {});
          case 'list_tables': return await this.listTables(args || {});
          case 'sync_chat': return await this.syncChat(args || {});
          case 'sync_document': return await this.syncDocument(args || {});
          case 'sync_workspace': return await this.syncWorkspace(args || {});
          case 'track_usage': return await this.trackUsage(args || {});
          case 'restore_from_cloud': return await this.restoreFromCloud(args || {});
          default: throw new Error(`Unknown tool: ${name}`);
        }
      } catch (err) {
        console.error(`[supabase-mcp-tools] Error in ${name}:`, err);
        return makeErrorResponse(err && err.message ? err.message : String(err));
      }
    });
  }

  // -------------------------
  // Implementations
  // -------------------------
  async queryDatabase({ table, select = '*', filter = {}, limit = 100 }) {
    if (!supabase) return makeErrorResponse('Supabase client not configured (missing SUPABASE_ANON_KEY or SUPABASE_URL).');
    if (!table) return makeErrorResponse('Missing required parameter: table');

    try {
      // Basic safety: do not allow semicolons or suspicious characters in table/select
      if (/[;{}]/.test(table)) throw new Error('Invalid table name');
      if (typeof select !== 'string') throw new Error('select must be a string');

      let qb = supabase.from(table).select(select).limit(limit);

      Object.entries(filter || {}).forEach(([k, v]) => {
        // support null checks
        if (v === null) qb = qb.is(k, null);
        else qb = qb.eq(k, v);
      });

      const res = await qb;
      if (res.error) throw res.error;

      const data = res.data || [];
      return {
        content: [{ type: 'text', text: `Found ${data.length} record(s) in "${table}":\n\n${safeStringify(data)}` }]
      };
    } catch (err) {
      return makeErrorResponse(err && err.message ? err.message : String(err));
    }
  }

  async insertDocument({ title, content, metadata = {}, embedding, workspaceId = 1 }) {
    if (!supabase) return makeErrorResponse('Supabase client not configured.');
    if (!title || !content) return makeErrorResponse('title and content are required');

    try {
      const now = new Date().toISOString();
      const doc = {
        title,
        content,
        workspace_id: workspaceId,
        tenant_id: process.env.TENANT_ID || 'local-dev',
        metadata: {
          ...metadata,
          insertedVia: 'supabase-mcp-tools',
          insertedAt: now
        },
        created_at: now
      };

      if (Array.isArray(embedding)) doc.content_embedding = embedding;

      const { data, error } = await supabase.from('documents').insert(doc).select().limit(1).single();

      if (error) throw error;

      const id = (data && data.id) || null;
      return {
        content: [{
          type: 'text',
          text: `✅ Document inserted!\nID: ${id}\nTitle: ${title}\nWorkspace: ${workspaceId}\nHas vector: ${Array.isArray(embedding) ? 'Yes' : 'No'}`
        }]
      };
    } catch (err) {
      return makeErrorResponse(err && err.message ? err.message : String(err));
    }
  }

  async searchDocuments({ query, embedding, limit = 10, threshold = 0.7 }) {
    if (!supabase) return makeErrorResponse('Supabase client not configured.');
    try {
      if (Array.isArray(embedding)) {
        // RPC-based vector search (user must have created the RPC)
        const rpcParams = {
          query_embedding: embedding,
          similarity_threshold: threshold,
          match_count: limit
        };
        const { data, error } = await supabase.rpc('vector_search', rpcParams);
        if (error) throw error;
        return { content: [{ type: 'text', text: `Found ${Array.isArray(data) ? data.length : 0} similar documents:\n\n${safeStringify(data)}` }] };
      } else if (query) {
        // text search using ilike OR
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
          .limit(limit);

        if (error) throw error;
        return { content: [{ type: 'text', text: `Found ${data.length} documents matching "${query}":\n\n${safeStringify(data)}` }] };
      } else {
        throw new Error('Either "query" (text) or "embedding" (vector array) is required');
      }
    } catch (err) {
      return makeErrorResponse(err && err.message ? err.message : String(err));
    }
  }

  async uploadFile({ bucketName = 'documents', filePath, fileContent, contentType = 'text/plain' }) {
    if (!supabase) return makeErrorResponse('Supabase client not configured.');

    if (!filePath || fileContent == null) return makeErrorResponse('filePath and fileContent are required');

    try {
      // normalize filePath
      const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;

      const uploadData = toBufferIfNeeded(fileContent, contentType);

      // If uploadData is Buffer, use it; if string, supabase SDK accepts string as well.
      const uploadArgs = [normalizedPath, uploadData, { contentType, upsert: true }];

      // The storage.upload API sometimes expects a Readable or binary — passing Buffer is generally accepted.
      const uploadRes = await supabase.storage.from(bucketName).upload(...uploadArgs);
      if (uploadRes.error) throw uploadRes.error;

      // Try to get a public URL (may require bucket public or signed URL)
      const publicRes = await supabase.storage.from(bucketName).getPublicUrl(normalizedPath);
      // publicRes can be { data: { publicUrl } } or { publicUrl } depending on versions
      let publicUrl = null;
      if (publicRes && publicRes.data && publicRes.data.publicUrl) publicUrl = publicRes.data.publicUrl;
      if (!publicUrl && publicRes && publicRes.publicUrl) publicUrl = publicRes.publicUrl;

      // uploadRes.data may contain path or key
      const uploadedPath = (uploadRes.data && (uploadRes.data.path || uploadRes.data.Key || uploadRes.data.name)) || normalizedPath;

      return {
        content: [{
          type: 'text',
          text: `✅ File uploaded successfully!\nPath: ${uploadedPath}\nBucket: ${bucketName}\nPublic URL: ${publicUrl || 'N/A (bucket may be private)'}`
        }]
      };
    } catch (err) {
      return makeErrorResponse(err && err.message ? err.message : String(err));
    }
  }

  async getUserInfo({ userId }) {
    if (!supabaseAdmin) return makeErrorResponse('Supabase admin client not configured. Provide SUPABASE_SERVICE_ROLE_KEY.');

    if (!userId) return makeErrorResponse('userId is required');

    try {
      // supabaseAdmin.auth.admin.getUserById may return { data: { user }, error } or { data, error }
      const res = await supabaseAdmin.auth.admin.getUserById(userId);
      if (res.error) throw res.error;

      // support either res.data.user or res.data
      const user = (res.data && (res.data.user || res.data)) || null;
      if (!user) throw new Error('User not found');

      const display = {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata
      };

      return {
        content: [{ type: 'text', text: `User Information:\n\n${safeStringify(display)}` }]
      };
    } catch (err) {
      return makeErrorResponse(err && err.message ? err.message : String(err));
    }
  }

  async listTables() {
    if (!supabase) return makeErrorResponse('Supabase client not configured.');

    try {
      // Many projects do not allow direct access to information_schema via the REST API.
      // Try a couple of approaches (best-effort).
      // 1) Try querying postgres information_schema via RPC-like access (may fail)
      const res = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public');
      if (!res.error && Array.isArray(res.data)) {
        const tableNames = res.data.map(r => r.table_name).filter(Boolean);
        return { content: [{ type: 'text', text: `Available tables in public schema:\n\n${tableNames.map(n => `• ${n}`).join('\n')}` }] };
      }

      // Fallback: return a small list of known tables
      const knownTables = ['documents', 'workspaces', 'users', 'chat_messages'];
      return {
        content: [{
          type: 'text',
          text: `Available tables (partial list):\n${knownTables.map(t => `• ${t}`).join('\n')}\n\nNote: Could not retrieve complete table list from information_schema (lack of permissions or different DB).`
        }]
      };
    } catch (err) {
      return makeErrorResponse(err && err.message ? err.message : String(err));
    }
  }

  // -------------------------
  // Sync Methods (SupabaseSync integration)
  // -------------------------
  async syncChat({ workspaceChat }) {
    if (!workspaceChat) return makeErrorResponse('workspaceChat is required');

    try {
      const workspaceId = getWorkspaceId({ workspaceId: workspaceChat.workspaceId });

      // Try to get workspace-specific Supabase credentials from Nango
      let supabaseClient = supabase; // fallback to static client

      if (process.env.NANGO_SECRET_KEY) {
        try {
          const nango = await getNangoClient();
          const connectionId = getConnectionId(workspaceId);

          // Get Supabase connection from Nango for this workspace
          const connection = await nango.getConnection('supabase', connectionId);
          if (connection && connection.credentials) {
            const { supabase_url, supabase_anon_key } = connection.credentials;
            if (supabase_url && supabase_anon_key) {
              supabaseClient = createClient(supabase_url, supabase_anon_key, {
                auth: { persistSession: false, autoRefreshToken: false }
              });
              console.error(`[supabase-mcp-tools] Using workspace-specific Supabase client for workspace ${workspaceId}`);
            }
          }
        } catch (nangoError) {
          console.error(`[supabase-mcp-tools] Failed to get Nango credentials for workspace ${workspaceId}:`, nangoError.message);
        }
      }

      await SupabaseSync.syncChat(workspaceChat);
      return {
        content: [{
          type: 'text',
          text: `✅ Chat message synced successfully!\nWorkspace: ${workspaceChat.workspaceId}\nMessage ID: ${workspaceChat.id}`
        }]
      };
    } catch (err) {
      return makeErrorResponse(err && err.message ? err.message : String(err));
    }
  }

  async syncDocument({ document, vectorData }) {
    if (!document) return makeErrorResponse('document is required');

    try {
      await SupabaseSync.syncDocument(document, vectorData || null);
      return {
        content: [{
          type: 'text',
          text: `✅ Document synced successfully!\nTitle: ${document.title}\nWorkspace: ${document.workspaceId}\nHas vector: ${vectorData ? 'Yes' : 'No'}`
        }]
      };
    } catch (err) {
      return makeErrorResponse(err && err.message ? err.message : String(err));
    }
  }

  async syncWorkspace({ workspace }) {
    if (!workspace) return makeErrorResponse('workspace is required');

    try {
      await SupabaseSync.syncWorkspace(workspace);
      return {
        content: [{
          type: 'text',
          text: `✅ Workspace configuration synced successfully!\nName: ${workspace.name}\nSlug: ${workspace.slug}\nAgent: ${workspace.agentProvider}/${workspace.agentModel}`
        }]
      };
    } catch (err) {
      return makeErrorResponse(err && err.message ? err.message : String(err));
    }
  }

  async trackUsage({ eventType, metadata = {} }) {
    if (!eventType) return makeErrorResponse('eventType is required');

    try {
      await SupabaseSync.trackUsage(eventType, metadata);
      return {
        content: [{
          type: 'text',
          text: `✅ Usage event tracked!\nEvent: ${eventType}\nMetadata: ${Object.keys(metadata).length} fields`
        }]
      };
    } catch (err) {
      return makeErrorResponse(err && err.message ? err.message : String(err));
    }
  }

  async restoreFromCloud() {
    try {
      const data = await SupabaseSync.restoreFromCloud();
      if (!data) {
        return {
          content: [{
            type: 'text',
            text: 'ℹ️ No data to restore or cloud sync is disabled.'
          }]
        };
      }

      const { chats = [], documents = [], workspaces = [] } = data;
      return {
        content: [{
          type: 'text',
          text: `✅ Data restored from cloud!\nChats: ${chats.length}\nDocuments: ${documents.length}\nWorkspaces: ${workspaces.length}\n\n${safeStringify({ chats: chats.slice(0, 3), documents: documents.slice(0, 3), workspaces })}`
        }]
      };
    } catch (err) {
      return makeErrorResponse(err && err.message ? err.message : String(err));
    }
  }

  // start server (MCP)
  async start() {
    if (!supabase) {
      console.error('[supabase-mcp-tools] Supabase client not configured. Check SUPABASE_URL and SUPABASE_ANON_KEY / SERVICE_ROLE.');
    }

    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('[supabase-mcp-tools] Supabase MCP Server started successfully');
    } catch (err) {
      console.error('[supabase-mcp-tools] Failed to start server:', err && err.message ? err.message : err);
      process.exit(1);
    }
  }
}

//
// If run directly, start
//
if (require.main === module) {
  process.on('uncaughtException', (error) => {
    console.error('[supabase-mcp-tools] Uncaught exception:', error && error.stack ? error.stack : error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[supabase-mcp-tools] Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  const server = new SupabaseMCPServer();
  server.start().catch(error => {
    console.error('[supabase-mcp-tools] Failed to start Supabase MCP server:', error && error.message ? error.message : error);
    process.exit(1);
  });
}

module.exports = SupabaseMCPServer;
