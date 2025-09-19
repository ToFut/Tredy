const { Workspace } = require("../../../models/workspace");
const { getVectorDbClass } = require("../../../utils/helpers");
const { parseAuthHeader } = require("../../../utils/http");
const {
  NangoIntegration,
} = require("../../../utils/connectors/nango-integration");
const { ConnectorTokens } = require("../../../models/connectorTokens");
const { SyncCursors } = require("../../../models/syncCursors");
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
    const nango = new NangoIntegration();

    // Verify webhook signature
    const signature = req.headers["x-nango-signature"];
    if (signature && !nango.verifyWebhookSignature(req.body, signature)) {
      console.error("[Nango Webhook] Invalid signature");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    const body = req.body;
    console.log(
      "[Nango Webhook] Received:",
      body.type,
      body.model || body.providerConfigKey
    );

    const { type, connectionId, providerConfigKey, model, records } = body;

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
      case "sync":
        if (body.success) {
          await handleSyncSuccess(workspace, providerConfigKey, model, body);
        } else {
          console.error(
            `[Nango Webhook] Sync failed for ${providerConfigKey}:`,
            body.error
          );
          await updateSyncStatus(
            workspace.id,
            providerConfigKey,
            "error",
            body.error
          );
        }
        break;

      case "auth":
        if (body.success) {
          await handleAuthSuccess(workspace, providerConfigKey, body);
        } else {
          console.error(
            `[Nango Webhook] Auth failed for ${providerConfigKey}:`,
            body.error
          );
        }
        break;

      case "sync:success":
        await handleSyncSuccess(workspace, providerConfigKey, model, body);
        break;

      case "sync:error":
        console.error(
          `[Nango Webhook] Sync error for ${providerConfigKey}:`,
          body.error
        );
        await updateSyncStatus(
          workspace.id,
          providerConfigKey,
          "error",
          body.error
        );
        break;

      case "connection:deleted":
        await handleConnectionDeleted(workspace, providerConfigKey);
        break;

      default:
        console.log(`[Nango Webhook] Unhandled type: ${type}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Nango Webhook] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleAuthSuccess(workspace, provider, body) {
  console.log(`[Nango Webhook] New connection created for ${provider}`);

  // Update connection status
  await updateSyncStatus(workspace.id, provider, "connected");

  // Special handling for Google Drive - needs metadata before sync
  if (provider === "google-drive") {
    const nango = new NangoIntegration();
    try {
      // Set default metadata for Google Drive
      const metadata = {
        folders: ["root"], // Sync entire drive by default
        files: [],
      };

      await nango.nango.setMetadata(
        provider,
        `workspace_${workspace.id}`,
        metadata
      );
      console.log(
        `[Nango Webhook] Set Google Drive metadata: ${JSON.stringify(metadata)}`
      );
    } catch (error) {
      console.error(
        `[Nango Webhook] Failed to set Google Drive metadata:`,
        error
      );
    }
  }

  // Trigger initial sync for the connection
  const nango = new NangoIntegration();
  const syncNames = getSyncNamesForProvider(provider);

  if (syncNames.length > 0) {
    try {
      await nango.triggerSync(provider, workspace.id, syncNames[0]);
      console.log(`[Nango Webhook] Triggered initial sync for ${provider}`);
    } catch (error) {
      console.error(`[Nango Webhook] Failed to trigger initial sync:`, error);
    }
  }
}

async function handleSyncSuccess(workspace, provider, model, body) {
  // Get the actual records from Nango
  const nango = new NangoIntegration();
  let records = [];

  try {
    // Fetch records with cursor for incremental sync
    const lastCursor = await getLastSyncCursor(workspace.id, provider, model);

    const result = await nango.nango.listRecords({
      providerConfigKey: provider,
      connectionId: `workspace_${workspace.id}`,
      model: model,
      cursor: lastCursor,
      limit: 1000,
    });

    records = result.records || [];

    // Save the cursor and record count for next sync
    const recordCount = records.length;
    const syncStatus = "success";

    if (result.next_cursor) {
      await saveLastSyncCursor(
        workspace.id,
        provider,
        model,
        result.next_cursor,
        recordCount,
        syncStatus
      );
    } else {
      // Even without cursor, track the sync
      await saveLastSyncCursor(
        workspace.id,
        provider,
        model,
        null,
        recordCount,
        syncStatus
      );
    }

    console.log(
      `[Nango Webhook] Processing ${records.length} ${model} records for ${provider}`
    );
  } catch (error) {
    console.error(`[Nango Webhook] Failed to fetch records:`, error);
    // Track the error in cursor system
    await saveLastSyncCursor(
      workspace.id,
      provider,
      model,
      null,
      0,
      "error",
      error.message
    );
    return;
  }

  if (!records || records.length === 0) {
    console.log(`[Nango Webhook] No records to process`);
    return;
  }

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
    console.log(
      `[Nango Sync] Stored ${documents.length} ${model} records for workspace ${workspace.id}`
    );
  }
}

function convertToDocument(provider, model, record) {
  // Universal document converter - works for any provider
  const docId = `${provider}-${model}-${record.id || crypto.randomUUID()}`;
  const baseDoc = {
    docId,
    id: record.id || crypto.randomUUID(),
    type: `${provider}:${model}`,
    provider,
    model,
    createdAt:
      record.created_at ||
      record._nango_metadata?.first_seen_at ||
      new Date().toISOString(),
    updatedAt:
      record.updated_at ||
      record._nango_metadata?.last_modified_at ||
      new Date().toISOString(),
  };

  // Provider-specific formatting with better content generation
  switch (provider) {
    case "linkedin":
      return {
        ...baseDoc,
        content: `LinkedIn ${model}: ${record.name || record.title || record.headline || ""}
Description: ${record.summary || record.description || ""}
Location: ${record.location || "N/A"}
Connections: ${record.connections || "N/A"}`,
        metadata: {
          ...baseDoc,
          name: record.name,
          headline: record.headline,
          profileUrl: record.profileUrl,
          connections: record.connections,
        },
      };

    case "google-mail":
    case "gmail":
      return {
        ...baseDoc,
        content: `Email: ${record.subject || "No Subject"}
From: ${record.from || "Unknown"}
To: ${record.to || "Unknown"}
Date: ${record.date || "N/A"}
Snippet: ${record.snippet || ""}`,
        metadata: {
          ...baseDoc,
          subject: record.subject,
          from: record.from,
          to: record.to,
          date: record.date,
          threadId: record.threadId,
        },
      };

    case "google-calendar":
      return {
        ...baseDoc,
        content: `Calendar Event: ${record.summary}\nDate: ${record.start?.dateTime || record.start?.date}\nLocation: ${record.location || "N/A"}\nDescription: ${record.description || "No description"}`,
        metadata: {
          ...baseDoc,
          eventId: record.id,
          summary: record.summary,
          startTime: record.start,
          endTime: record.end,
          organizer: record.organizer?.email,
        },
      };

    case "google-drive":
      return {
        ...baseDoc,
        content: `Google Drive Document: ${record.title || record.name || "Untitled"}
Type: ${record.mimeType || "Unknown"}
Last Modified: ${record.updatedAt || record.modifiedTime || "Unknown"}
URL: ${record.url || record.webViewLink || ""}
Path: ${record.parents?.join("/") || "Root"}`,
        metadata: {
          ...baseDoc,
          fileId: record.id,
          title: record.title || record.name,
          mimeType: record.mimeType,
          url: record.url || record.webViewLink,
          parents: record.parents,
          size: record.size,
          lastModified: record.updatedAt || record.modifiedTime,
        },
      };

    case "slack":
      return {
        ...baseDoc,
        content: `Slack ${model}: ${record.text || record.name || record.title}\nChannel: ${record.channel || "N/A"}\nUser: ${record.user || "N/A"}`,
        metadata: {
          ...baseDoc,
          channelId: record.channel,
          userId: record.user,
          timestamp: record.ts,
        },
      };

    case "github":
      return {
        ...baseDoc,
        content: `GitHub ${model}: ${record.title || record.name}\nDescription: ${record.description || record.body || "N/A"}\nStatus: ${record.state || record.status || "N/A"}`,
        metadata: {
          ...baseDoc,
          repoName: record.repository?.name,
          authorLogin: record.user?.login || record.author?.login,
          url: record.html_url || record.url,
        },
      };

    case "google-drive":
      return {
        ...baseDoc,
        content: `Google Drive Document: ${record.name || record.title}
Type: ${record.mimeType || "Unknown"}
Size: ${record.size ? `${Math.round(record.size / 1024)}KB` : "N/A"}
Description: ${record.description || "No description"}
Content: ${record.content || record.body || "Content not available"}`,
        metadata: {
          ...baseDoc,
          fileName: record.name,
          mimeType: record.mimeType,
          fileSize: record.size,
          fileId: record.id,
          webViewLink: record.webViewLink,
          downloadUrl: record.downloadUrl,
          parents: record.parents,
          lastModified: record.modifiedTime,
          owner: record.owners?.[0]?.emailAddress,
        },
      };

    default:
      // Generic document format for unknown providers
      return {
        ...baseDoc,
        content: JSON.stringify(record, null, 2),
        metadata: baseDoc,
      };
  }
}

async function handleConnectionDeleted(workspace, provider) {
  // Clean up connection status
  await updateSyncStatus(workspace.id, provider, "disconnected");

  // Optional: Clean up vector data when connection is deleted
  const VectorDb = getVectorDbClass();
  // Implementation depends on your vector DB's delete capabilities
  console.log(
    `[Nango Webhook] Connection deleted for ${provider} in workspace ${workspace.id}`
  );
}

// Helper functions
async function updateSyncStatus(workspaceId, provider, status, error = null) {
  try {
    await ConnectorTokens.updateSyncStatus({
      workspaceId,
      provider,
      status,
      lastError: error,
    });
  } catch (err) {
    console.error(`[Nango Webhook] Failed to update sync status:`, err);
  }
}

async function getLastSyncCursor(workspaceId, provider, model) {
  try {
    const cursorRecord = await SyncCursors.get({
      workspaceId,
      provider,
      model,
    });
    return cursorRecord?.cursor || null;
  } catch (error) {
    console.error(`[Nango Webhook] Failed to get cursor:`, error);
    return null;
  }
}

async function saveLastSyncCursor(
  workspaceId,
  provider,
  model,
  cursor,
  recordCount = 0,
  status = "success",
  error = null
) {
  try {
    await SyncCursors.upsert({
      workspaceId,
      provider,
      model,
      cursor,
      recordCount,
      status,
      error,
    });
    console.log(
      `[Nango Webhook] Saved cursor for ${provider}:${model} - processed ${recordCount} records`
    );
  } catch (err) {
    console.error(`[Nango Webhook] Failed to save cursor:`, err);
  }
}

function getSyncNamesForProvider(provider) {
  const syncMap = {
    linkedin: ["profile", "posts"],
    "google-mail": ["emails"],
    gmail: ["emails"],
    slack: ["users", "messages"],
    github: ["issues", "pull_requests"],
    shopify: ["products", "orders"],
    "google-calendar": ["events"],
    "google-drive": ["documents"],
  };

  return syncMap[provider] || [];
}

module.exports = {
  handleNangoWebhook,
};
