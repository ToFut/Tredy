const { Workspace } = require("../../../models/workspace");
const { ApiChatHandler } = require("../../../utils/chats/apiChatHandler");
const { getVectorDbClass } = require("../../../utils/helpers");
const TwilioWhatsAppMCPTools = require("../../../twilio-whatsapp-mcp-tools");

/**
 * Twilio WhatsApp Webhook Handler
 * Receives WhatsApp messages, processes through LLM, sends responses via MCP tools
 */

// Initialize MCP tools instance
let mcpTools = null;
function getMCPTools() {
  if (!mcpTools) {
    try {
      mcpTools = new TwilioWhatsAppMCPTools();
    } catch (error) {
      console.error("[Twilio Webhook] Failed to initialize MCP tools:", error);
    }
  }
  return mcpTools;
}

async function handleTwilioWebhook(req, res) {
  try {
    console.log("[Twilio Webhook] Received:", req.body);

    const { From, To, Body, MessageSid, ProfileName, WaId } = req.body;

    // Extract phone numbers (remove whatsapp: prefix)
    const fromNumber = From?.replace("whatsapp:", "").replace("+", "");
    const toNumber = To?.replace("whatsapp:", "");

    if (!fromNumber || !Body) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find workspace for this Twilio number
    const workspace = await findWorkspaceForTwilioNumber(toNumber);
    if (!workspace) {
      console.log(`[Twilio Webhook] No workspace found for ${toNumber}`);
      return res.status(404).json({ error: "Workspace not found" });
    }

    // Process message (don't wait for completion - respond to Twilio immediately)
    console.log("[Twilio Webhook] Starting async processing...");
    processMessage(workspace, {
      fromNumber,
      toNumber,
      message: Body,
      messageSid: MessageSid,
      profileName: ProfileName,
      waId: WaId
    }).catch(err => {
      console.error("[Twilio Webhook] Processing error:", err);
      console.error("[Twilio Webhook] Error stack:", err.stack);
    });

    // Respond to Twilio immediately
    return res.status(200).json({ success: true, message: "Webhook received", timestamp: new Date().toISOString() });

  } catch (error) {
    console.error("[Twilio Webhook] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function findWorkspaceForTwilioNumber(twilioNumber) {
  try {
    console.log(`[Twilio Webhook] Finding workspace for number: ${twilioNumber}`);

    // Strategy 1: Environment mapping
    if (process.env.TWILIO_WORKSPACE_MAPPING) {
      console.log(`[Twilio Webhook] Checking TWILIO_WORKSPACE_MAPPING`);
      const mappings = JSON.parse(process.env.TWILIO_WORKSPACE_MAPPING);
      const workspaceId = mappings[twilioNumber];
      if (workspaceId) {
        console.log(`[Twilio Webhook] Found mapping: ${twilioNumber} -> workspace ${workspaceId}`);
        return await Workspace.get({ id: parseInt(workspaceId) });
      }
    }

    // Strategy 2: Default workspace ID
    if (process.env.DEFAULT_TWILIO_WORKSPACE_ID) {
      console.log(`[Twilio Webhook] Using DEFAULT_TWILIO_WORKSPACE_ID: ${process.env.DEFAULT_TWILIO_WORKSPACE_ID}`);
      const workspaceId = process.env.DEFAULT_TWILIO_WORKSPACE_ID.replace('workspace_', '');
      return await Workspace.get({ id: parseInt(workspaceId) });
    }

    // Strategy 3: Default workspace slug
    if (process.env.DEFAULT_TWILIO_WORKSPACE_SLUG) {
      console.log(`[Twilio Webhook] Using DEFAULT_TWILIO_WORKSPACE_SLUG: ${process.env.DEFAULT_TWILIO_WORKSPACE_SLUG}`);
      return await Workspace.get({ slug: process.env.DEFAULT_TWILIO_WORKSPACE_SLUG });
    }

    // Strategy 4: First available workspace
    console.log(`[Twilio Webhook] No env config found, using first available workspace`);
    const workspaces = await Workspace.where();
    if (workspaces.length > 0) {
      console.log(`[Twilio Webhook] Using first workspace: ${workspaces[0].slug} (ID: ${workspaces[0].id})`);
      return workspaces[0];
    }

    console.log(`[Twilio Webhook] ❌ No workspaces found in database`);
    return null;

  } catch (error) {
    console.error("[Twilio Webhook] Error finding workspace:", error);
    return null;
  }
}

async function processMessage(workspace, messageData) {
  const { fromNumber, message, messageSid, profileName } = messageData;

  try {
    console.log(`[Twilio Webhook] Processing message from ${profileName || fromNumber}: "${message}"`);
    console.log(`[Twilio Webhook] Workspace: ${workspace.slug}, Provider: ${workspace.chatProvider}, Model: ${workspace.chatModel}`);

    // Store message in vector DB
    await storeMessageInVectorDB(workspace, fromNumber, message, messageData);
    console.log(`[Twilio Webhook] ✓ Stored in vector DB`);

    // Strip @agent prefix if present (webhooks don't support agent mode due to no WebSocket)
    let processedMessage = message;
    if (message.trim().startsWith('@agent')) {
      processedMessage = message.replace(/^@agent\s*/i, '').trim();
      console.log(`[Twilio Webhook] Stripped @agent prefix, new message: "${processedMessage}"`);
    }

    // Process through LLM using existing chat handler
    console.log(`[Twilio Webhook] Calling LLM...`);
    const response = await ApiChatHandler.chatSync({
      workspace,
      message: processedMessage,
      mode: "chat",
      user: null,
      thread: null,
      sessionId: `whatsapp-${fromNumber}`,
      attachments: [],
      reset: false
    });

    console.log(`[Twilio Webhook] ✓ LLM response type: ${response.type}`);
    console.log(`[Twilio Webhook] ✓ LLM text (first 100 chars): ${response.textResponse?.substring(0, 100)}`);

    // Send response via MCP tools
    if (response.textResponse?.trim()) {
      console.log(`[Twilio Webhook] Sending WhatsApp response to +${fromNumber}...`);
      // Pass both toNumber (recipient) and fromNumber (our Twilio number)
      await sendWhatsAppResponse(workspace, fromNumber, messageData.toNumber, response.textResponse);
      console.log(`[Twilio Webhook] ✓ WhatsApp message sent successfully!`);
    } else {
      console.log(`[Twilio Webhook] ⚠ No text response from LLM to send`);
    }

  } catch (error) {
    console.error("[Twilio Webhook] ❌ Processing error:", error.message);
    console.error("[Twilio Webhook] Error stack:", error.stack);
    // Try to send error message
    try {
      await sendWhatsAppResponse(workspace, fromNumber, messageData.toNumber, "Sorry, I had trouble processing your message.");
    } catch (sendError) {
      console.error("[Twilio Webhook] Failed to send error message:", sendError.message);
    }
  }
}

async function storeMessageInVectorDB(workspace, fromNumber, message, metadata) {
  try {
    const VectorDb = getVectorDbClass();

    const document = {
      docId: `whatsapp-${metadata.messageSid}`,
      id: metadata.messageSid,
      pageContent: message,
      metadata: {
        title: `WhatsApp from ${metadata.profileName || fromNumber}`,
        docAuthor: metadata.profileName || fromNumber,
        docSource: `whatsapp:${fromNumber}`,
        fromNumber,
        profileName: metadata.profileName,
        timestamp: new Date().toISOString(),
        source: 'twilio_whatsapp'
      }
    };

    await VectorDb.addDocuments(workspace, [document]);
    console.log(`[Twilio Webhook] Stored message in vector DB`);

  } catch (error) {
    console.error("[Twilio Webhook] Storage error:", error);
  }
}

async function sendWhatsAppResponse(workspace, toNumber, fromNumber, message) {
  try {
    const mcp = getMCPTools();
    if (!mcp) {
      console.error("[Twilio Webhook] MCP tools not available");
      return;
    }

    // Get workspace ID for MCP connection
    const workspaceId = workspace.id || '1';

    console.log(`[Twilio Webhook] Sending - To: +${toNumber}, From: ${fromNumber}`);

    // Use MCP sendWhatsAppMessage method
    const result = await mcp.sendWhatsAppMessage({
      to: `+${toNumber}`,
      from: fromNumber, // Our Twilio WhatsApp number
      body: message
    }, workspaceId);

    if (result.isError) {
      console.error("[Twilio Webhook] MCP send error:", result.content[0].text);
    } else {
      console.log(`[Twilio Webhook] Sent response to ${toNumber}`);
    }

  } catch (error) {
    console.error("[Twilio Webhook] Send error:", error);
  }
}

module.exports = {
  handleTwilioWebhook,
};