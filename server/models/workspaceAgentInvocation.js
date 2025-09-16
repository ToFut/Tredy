const prisma = require("../utils/prisma");
const { v4: uuidv4 } = require("uuid");

const WorkspaceAgentInvocation = {
  // returns array of strings with their @ handle.
  // must start with @agent for now.
  parseAgents: function (promptString) {
    if (!promptString.startsWith("@agent")) return [];
    return promptString.split(/\s+/).filter((v) => v.startsWith("@"));
  },

  close: async function (uuid, retryCount = 0) {
    if (!uuid) return;
    
    // Make this operation non-blocking by not awaiting it
    // This prevents the websocket close from hanging on database timeouts
    this.closeAsync(uuid, retryCount).catch(error => {
      console.error(`[WorkspaceAgentInvocation] Background close failed for ${uuid}:`, error.message);
    });
  },

  closeAsync: async function (uuid, retryCount = 0) {
    if (!uuid) return;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    try {
      await prisma.workspace_agent_invocations.update({
        where: { uuid: String(uuid) },
        data: { closed: true },
      });
    } catch (error) {
      // Log the error for debugging
      if (error.message?.includes("Timed out") || error.message?.includes("ConnectionError")) {
        console.error(`[WorkspaceAgentInvocation] Database timeout error closing invocation ${uuid}:`, error.message);
        
        // Retry logic for timeout errors
        if (retryCount < maxRetries) {
          console.log(`[WorkspaceAgentInvocation] Retrying close operation (attempt ${retryCount + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return await this.closeAsync(uuid, retryCount + 1);
        } else {
          console.error(`[WorkspaceAgentInvocation] Failed to close invocation ${uuid} after ${maxRetries} retries`);
        }
      } else {
        // Log other errors but don't retry
        console.error(`[WorkspaceAgentInvocation] Error closing invocation ${uuid}:`, error.message);
      }
    }
  },

  new: async function ({ prompt, workspace, user = null, thread = null }) {
    try {
      const invocation = await prisma.workspace_agent_invocations.create({
        data: {
          uuid: uuidv4(),
          workspace_id: workspace.id,
          prompt: String(prompt),
          user_id: user?.id,
          thread_id: thread?.id,
        },
      });

      return { invocation, message: null };
    } catch (error) {
      console.error(error.message);
      return { invocation: null, message: error.message };
    }
  },

  get: async function (clause = {}) {
    try {
      const invocation = await prisma.workspace_agent_invocations.findFirst({
        where: clause,
      });

      return invocation || null;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  },

  getWithWorkspace: async function (clause = {}) {
    try {
      const invocation = await prisma.workspace_agent_invocations.findFirst({
        where: clause,
        include: {
          workspace: true,
        },
      });

      return invocation || null;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  },

  delete: async function (clause = {}) {
    try {
      await prisma.workspace_agent_invocations.delete({
        where: clause,
      });
      return true;
    } catch (error) {
      console.error(error.message);
      return false;
    }
  },

  where: async function (clause = {}, limit = null, orderBy = null) {
    try {
      const results = await prisma.workspace_agent_invocations.findMany({
        where: clause,
        ...(limit !== null ? { take: limit } : {}),
        ...(orderBy !== null ? { orderBy } : {}),
      });
      return results;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },

  update: async function ({ uuid, prompt }) {
    try {
      const invocation = await prisma.workspace_agent_invocations.update({
        where: { uuid: String(uuid) },
        data: { 
          prompt: String(prompt),
          lastUpdatedAt: new Date(),
        },
      });
      return invocation;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  },
};

module.exports = { WorkspaceAgentInvocation };
