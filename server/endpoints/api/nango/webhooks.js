const { Workspace } = require("../../../models/workspace");
const { getVectorDbClass } = require("../../../utils/helpers");
const { parseAuthHeader } = require("../../../utils/http");
const crypto = require("crypto");

/**
 * Nango Webhook Handler for Synced Data
 * Automatically stores synced data in vector database
 */

function verifyNangoWebhook(req, secret) {
  // Verify webhook signature if secret is provided
  if (!secret) return true;
  
  const signature = req.headers["x-nango-signature"];
  if (!signature) return false;
  
  const hash = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");
  
  return signature === hash;
}

async function handleNangoWebhook(req, res) {
  try {
    // Verify webhook if secret is configured
    if (process.env.NANGO_WEBHOOK_SECRET) {
      if (!verifyNangoWebhook(req, process.env.NANGO_WEBHOOK_SECRET)) {
        return res.status(401).json({ error: "Invalid webhook signature" });
      }
    }

    const { type, connectionId, providerConfigKey, model, records } = req.body;
    
    // Extract workspace ID from connectionId (format: workspace_3)
    const workspaceId = connectionId?.split("_")[1];
    if (!workspaceId) {
      return res.status(400).json({ error: "Invalid connection ID format" });
    }

    const workspace = await Workspace.get({ id: Number(workspaceId) });
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    // Handle different webhook types
    switch (type) {
      case "sync:success":
        await handleSyncSuccess(workspace, providerConfigKey, model, records);
        break;
      case "sync:error":
        console.error(`Sync error for ${providerConfigKey}:`, req.body.error);
        break;
      case "connection:deleted":
        await handleConnectionDeleted(workspace, providerConfigKey);
        break;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Nango Webhook] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleSyncSuccess(workspace, provider, model, records) {
  if (!records || records.length === 0) return;
  
  const VectorDb = getVectorDbClass();
  const documents = [];
  
  // Convert records to vector documents based on provider type
  for (const record of records) {
    const doc = convertToDocument(provider, model, record);
    if (doc) documents.push(doc);
  }

  if (documents.length > 0) {
    // Store in vector database
    await VectorDb.addDocuments(workspace, documents);
    console.log(`[Nango Sync] Stored ${documents.length} ${model} records for workspace ${workspace.id}`);
  }
}

function convertToDocument(provider, model, record) {
  // Universal document converter - works for any provider
  const baseDoc = {
    id: record.id || crypto.randomUUID(),
    type: `${provider}:${model}`,
    provider,
    model,
    createdAt: record.created_at || new Date().toISOString(),
    updatedAt: record.updated_at || new Date().toISOString(),
  };

  // Provider-specific formatting (optional enhancements)
  switch (provider) {
    case "google-calendar":
      return {
        ...baseDoc,
        content: `Calendar Event: ${record.summary}\nDate: ${record.start?.dateTime || record.start?.date}\nLocation: ${record.location || 'N/A'}\nDescription: ${record.description || 'No description'}`,
        metadata: {
          ...baseDoc,
          eventId: record.id,
          summary: record.summary,
          startTime: record.start,
          endTime: record.end,
          organizer: record.organizer?.email,
        }
      };
      
    case "slack":
      return {
        ...baseDoc,
        content: `Slack ${model}: ${record.text || record.name || record.title}\nChannel: ${record.channel || 'N/A'}\nUser: ${record.user || 'N/A'}`,
        metadata: {
          ...baseDoc,
          channelId: record.channel,
          userId: record.user,
          timestamp: record.ts,
        }
      };
      
    case "github":
      return {
        ...baseDoc,
        content: `GitHub ${model}: ${record.title || record.name}\nDescription: ${record.description || record.body || 'N/A'}\nStatus: ${record.state || record.status || 'N/A'}`,
        metadata: {
          ...baseDoc,
          repoName: record.repository?.name,
          authorLogin: record.user?.login || record.author?.login,
          url: record.html_url || record.url,
        }
      };
      
    default:
      // Generic document format for unknown providers
      return {
        ...baseDoc,
        content: JSON.stringify(record, null, 2),
        metadata: baseDoc
      };
  }
}

async function handleConnectionDeleted(workspace, provider) {
  // Optional: Clean up vector data when connection is deleted
  const VectorDb = getVectorDbClass();
  // Implementation depends on your vector DB's delete capabilities
  console.log(`[Nango Webhook] Connection deleted for ${provider} in workspace ${workspace.id}`);
}

module.exports = {
  handleNangoWebhook,
};