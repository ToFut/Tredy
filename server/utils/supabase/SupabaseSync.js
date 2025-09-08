const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

class SupabaseSync {
  constructor() {
    this.enabled = process.env.ENABLE_CLOUD_SYNC === 'true';
    if (!this.enabled) return;
    
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    this.tenantId = process.env.TENANT_ID || 'local-dev';
    this.syncQueue = [];
    this.startBatchSync();
  }

  // Sync chat messages to cloud
  async syncChat(workspaceChat) {
    if (!this.enabled) return;
    
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .upsert({
          id: workspaceChat.id,
          tenant_id: this.tenantId,
          workspace_id: workspaceChat.workspaceId,
          user_id: workspaceChat.user?.id,
          message: workspaceChat.prompt,
          response: workspaceChat.response,
          metadata: {
            type: workspaceChat.type,
            include: workspaceChat.include,
            thread_slug: workspaceChat.thread_slug
          },
          created_at: workspaceChat.createdAt
        });
      
      if (error) console.error('Supabase sync error:', error);
    } catch (err) {
      console.error('Failed to sync chat:', err);
      // Don't break local operation
    }
  }

  // Sync document and its vector embeddings
  async syncDocument(document, vectorData) {
    if (!this.enabled) return;
    
    try {
      // Upload document file to Supabase Storage
      let filePath = null;
      if (document.docpath) {
        const file = fs.readFileSync(document.docpath);
        const fileName = path.basename(document.docpath);
        filePath = `${this.tenantId}/${document.workspaceId}/${fileName}`;
        
        await this.supabase.storage
          .from('documents')
          .upload(filePath, file, { upsert: true });
      }
      
      // Save document metadata with vector
      const { data, error } = await this.supabase
        .from('documents')
        .upsert({
          id: document.id,
          tenant_id: this.tenantId,
          workspace_id: document.workspaceId,
          title: document.title,
          content: document.pageContent,
          content_embedding: vectorData?.embedding,
          file_path: filePath,
          metadata: document.metadata,
          created_at: document.createdAt
        });
      
      if (error) console.error('Document sync error:', error);
    } catch (err) {
      console.error('Failed to sync document:', err);
    }
  }

  // Sync workspace configuration
  async syncWorkspace(workspace) {
    if (!this.enabled) return;
    
    try {
      const { data, error } = await this.supabase
        .from('workspaces')
        .upsert({
          id: workspace.id,
          tenant_id: this.tenantId,
          name: workspace.name,
          slug: workspace.slug,
          config: {
            chatModel: workspace.chatModel,
            chatProvider: workspace.chatProvider,
            agentProvider: workspace.agentProvider,
            agentModel: workspace.agentModel,
            similarityThreshold: workspace.similarityThreshold,
            topN: workspace.topN
          },
          created_at: workspace.createdAt
        });
      
      if (error) console.error('Workspace sync error:', error);
    } catch (err) {
      console.error('Failed to sync workspace:', err);
    }
  }

  // Track usage for billing
  async trackUsage(eventType, metadata = {}) {
    if (!this.enabled) return;
    
    this.syncQueue.push({
      tenant_id: this.tenantId,
      event_type: eventType,
      metadata,
      created_at: new Date()
    });
  }

  // Batch sync usage events
  async startBatchSync() {
    if (!this.enabled) return;
    
    setInterval(async () => {
      if (this.syncQueue.length === 0) return;
      
      const events = [...this.syncQueue];
      this.syncQueue = [];
      
      try {
        await this.supabase
          .from('usage_events')
          .insert(events);
      } catch (err) {
        console.error('Failed to sync usage:', err);
        // Re-queue failed events
        this.syncQueue.unshift(...events);
      }
    }, 30000); // Sync every 30 seconds
  }

  // Restore from cloud on startup
  async restoreFromCloud() {
    if (!this.enabled) return;
    
    try {
      // Get latest chats
      const { data: chats } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      // Get documents
      const { data: documents } = await this.supabase
        .from('documents')
        .select('*')
        .eq('tenant_id', this.tenantId);
      
      // Get workspaces
      const { data: workspaces } = await this.supabase
        .from('workspaces')
        .select('*')
        .eq('tenant_id', this.tenantId);
      
      return { chats, documents, workspaces };
    } catch (err) {
      console.error('Failed to restore from cloud:', err);
      return null;
    }
  }
}

module.exports = new SupabaseSync();