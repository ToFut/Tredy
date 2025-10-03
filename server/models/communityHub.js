const ImportedPlugin = require("../utils/agents/imported");

/**
 * An interface to the AnythingLLM Community Hub external API.
 */
const CommunityHub = {
  importPrefix: "allm-community-id",
  apiBase: "https://hub.external.anythingllm.com/v1",
  supportedStaticItemTypes: ["system-prompt", "agent-flow", "slash-command"],

  /**
   * Validate an import ID and return the entity type and ID.
   * @param {string} importId - The import ID to validate.
   * @returns {{entityType: string | null, entityId: string | null}}
   */
  validateImportId: function (importId) {
    if (
      !importId ||
      !importId.startsWith(this.importPrefix) ||
      importId.split(":").length !== 3
    )
      return { entityType: null, entityId: null };
    const [_, entityType, entityId] = importId.split(":");
    if (!entityType || !entityId) return { entityType: null, entityId: null };
    return {
      entityType: String(entityType).trim(),
      entityId: String(entityId).trim(),
    };
  },

  /**
   * Fetch the explore items from the community hub that are publicly available.
   * Merges both Community Hub (free) and Tredy Marketplace (paid) items.
   * @param {Object} params - Pagination parameters
   * @param {number} params.limit - Number of items to fetch per category (default: all)
   * @param {number} params.offset - Offset for pagination
   * @param {Object} params.user - User object (for checking purchases)
   * @returns {Promise<{agentSkills: {items: [], hasMore: boolean, totalCount: number}, systemPrompts: {items: [], hasMore: boolean, totalCount: number}, slashCommands: {items: [], hasMore: boolean, totalCount: number}}>}
   */
  fetchExploreItems: async function (params = {}) {
    const { limit = 1000, offset = 0, user = null } = params;
    const queryParams = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });

    // Fetch Community Hub items (free)
    const communityItems = await fetch(`${this.apiBase}/explore?${queryParams}`, {
      method: "GET",
    })
      .then((response) => response.json())
      .catch((error) => {
        console.error("Error fetching community hub items:", error);
        return {
          agentSkills: { items: [], hasMore: false, totalCount: 0 },
          systemPrompts: { items: [], hasMore: false, totalCount: 0 },
          slashCommands: { items: [], hasMore: false, totalCount: 0 },
        };
      });

    // Fetch Tredy Marketplace items (paid)
    const TredyMarketplace = require("./tredyMarketplace");
    const marketplace = new TredyMarketplace();
    const tredyItems = {
      agentSkills: { items: [], hasMore: false, totalCount: 0 },
      systemPrompts: { items: [], hasMore: false, totalCount: 0 },
      slashCommands: { items: [], hasMore: false, totalCount: 0 },
      agentFlows: { items: [], hasMore: false, totalCount: 0 },
    };

    if (marketplace.isEnabled()) {
      try {
        // Fetch each item type from Tredy
        const [skills, prompts, commands, workflows] = await Promise.all([
          marketplace.fetchItems({ limit, offset, itemType: "agent-skill", visibility: "public" }),
          marketplace.fetchItems({ limit, offset, itemType: "system-prompt", visibility: "public" }),
          marketplace.fetchItems({ limit, offset, itemType: "slash-command", visibility: "public" }),
          marketplace.fetchItems({ limit, offset, itemType: "agent-flow", visibility: "public" }),
        ]);

        // Check if user has purchased each item
        const { getTenancyProvider } = require("../utils/tenancy");
        const tenancy = getTenancyProvider();

        // Helper to check purchase and add metadata
        const enrichWithPurchaseInfo = async (items, itemType) => {
          if (!items || items.length === 0) return [];

          return await Promise.all(
            items.map(async (item) => {
              const hasPurchased = user
                ? await tenancy.hasMarketplacePurchase(user, item.id, itemType)
                : false;

              return {
                ...item,
                source: "tredy", // Mark as Tredy item
                isPaid: item.price_cents > 0,
                hasPurchased,
              };
            })
          );
        };

        tredyItems.agentSkills = {
          items: await enrichWithPurchaseInfo(skills.items, "agent-skill"),
          hasMore: skills.items.length >= limit,
          totalCount: skills.total,
        };

        tredyItems.systemPrompts = {
          items: await enrichWithPurchaseInfo(prompts.items, "system-prompt"),
          hasMore: prompts.items.length >= limit,
          totalCount: prompts.total,
        };

        tredyItems.slashCommands = {
          items: await enrichWithPurchaseInfo(commands.items, "slash-command"),
          hasMore: commands.items.length >= limit,
          totalCount: commands.total,
        };

        tredyItems.agentFlows = {
          items: await enrichWithPurchaseInfo(workflows.items, "agent-flow"),
          hasMore: workflows.items.length >= limit,
          totalCount: workflows.total,
        };
      } catch (error) {
        console.error("Error fetching Tredy marketplace items:", error);
      }
    }

    // Merge results (Tredy items first, then Community Hub)
    return {
      agentSkills: {
        items: [...tredyItems.agentSkills.items, ...communityItems.agentSkills.items],
        hasMore: tredyItems.agentSkills.hasMore || communityItems.agentSkills.hasMore,
        totalCount: tredyItems.agentSkills.totalCount + communityItems.agentSkills.totalCount,
      },
      systemPrompts: {
        items: [...tredyItems.systemPrompts.items, ...communityItems.systemPrompts.items],
        hasMore: tredyItems.systemPrompts.hasMore || communityItems.systemPrompts.hasMore,
        totalCount: tredyItems.systemPrompts.totalCount + communityItems.systemPrompts.totalCount,
      },
      slashCommands: {
        items: [...tredyItems.slashCommands.items, ...communityItems.slashCommands.items],
        hasMore: tredyItems.slashCommands.hasMore || communityItems.slashCommands.hasMore,
        totalCount: tredyItems.slashCommands.totalCount + communityItems.slashCommands.totalCount,
      },
      agentFlows: {
        items: [...tredyItems.agentFlows.items, ...(communityItems.agentFlows?.items || [])],
        hasMore: tredyItems.agentFlows.hasMore || (communityItems.agentFlows?.hasMore || false),
        totalCount: tredyItems.agentFlows.totalCount + (communityItems.agentFlows?.totalCount || 0),
      },
    };
  },

  /**
   * Fetch a bundle item from the community hub.
   * Bundle items are entities that require a downloadURL to be fetched from the community hub.
   * so we can unzip and import them to the AnythingLLM instance.
   * @param {string} importId - The import ID of the item.
   * @returns {Promise<{url: string | null, item: object | null, error: string | null}>}
   */
  getBundleItem: async function (importId) {
    const { entityType, entityId } = this.validateImportId(importId);
    if (!entityType || !entityId)
      return { item: null, error: "Invalid import ID" };

    const { SystemSettings } = require("./systemSettings");
    const { connectionKey } = await SystemSettings.hubSettings();
    const { url, item, error } = await fetch(
      `${this.apiBase}/${entityType}/${entityId}/pull`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(connectionKey
            ? { Authorization: `Bearer ${connectionKey}` }
            : {}),
        },
      }
    )
      .then((response) => response.json())
      .catch((error) => {
        console.error(
          `Error fetching bundle item for import ID ${importId}:`,
          error
        );
        return { url: null, item: null, error: error.message };
      });
    return { url, item, error };
  },

  /**
   * Apply an item to the AnythingLLM instance. Used for simple items like slash commands and system prompts.
   * @param {object} item - The item to apply.
   * @param {object} options - Additional options for applying the item.
   * @param {object|null} options.currentUser - The current user object.
   * @returns {Promise<{success: boolean, error: string | null}>}
   */
  applyItem: async function (item, options = {}) {
    if (!item) return { success: false, error: "Item is required" };

    if (item.itemType === "system-prompt") {
      if (!options?.workspaceSlug)
        return { success: false, error: "Workspace slug is required" };

      const { Workspace } = require("./workspace");
      const workspace = await Workspace.get({
        slug: String(options.workspaceSlug),
      });
      if (!workspace) return { success: false, error: "Workspace not found" };
      await Workspace.update(workspace.id, { openAiPrompt: item.prompt });
      return { success: true, error: null };
    }

    if (item.itemType === "slash-command") {
      const { SlashCommandPresets } = require("./slashCommandsPresets");
      await SlashCommandPresets.create(options?.currentUser?.id, {
        command: SlashCommandPresets.formatCommand(String(item.command)),
        prompt: String(item.prompt),
        description: String(item.description),
      });
      return { success: true, error: null };
    }

    return {
      success: false,
      error: "Unsupported item type. Nothing to apply.",
    };
  },

  /**
   * Import a bundle item to the AnythingLLM instance by downloading the zip file and importing it.
   * or whatever the item type requires.
   * @param {{url: string, item: object}} params
   * @returns {Promise<{success: boolean, error: string | null}>}
   */
  importBundleItem: async function ({ url, item }) {
    if (item.itemType === "agent-skill") {
      const { success, error } =
        await ImportedPlugin.importCommunityItemFromUrl(url, item);
      return { success, error };
    }

    return {
      success: false,
      error: "Unsupported item type. Nothing to import.",
    };
  },

  fetchUserItems: async function (connectionKey) {
    if (!connectionKey) return { createdByMe: {}, teamItems: [] };

    return await fetch(`${this.apiBase}/items`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${connectionKey}`,
      },
    })
      .then((response) => response.json())
      .catch((error) => {
        console.error("Error fetching user items:", error);
        return { createdByMe: {}, teamItems: [] };
      });
  },

  /**
   * Create a new item in the community hub - Only supports STATIC items for now.
   * @param {string} itemType - The type of item to create
   * @param {object} data - The item data
   * @param {string} connectionKey - The hub connection key
   * @returns {Promise<{success: boolean, error: string | null}>}
   */
  createStaticItem: async function (itemType, data, connectionKey) {
    if (!connectionKey)
      return { success: false, error: "Connection key is required" };
    if (!this.supportedStaticItemTypes.includes(itemType))
      return { success: false, error: "Unsupported item type" };

    // If the item has special considerations or preprocessing, we can delegate that below before sending the request.
    // eg: Agent flow files and such.

    return await fetch(`${this.apiBase}/${itemType}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${connectionKey}`,
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((result) => {
        if (!!result.error) throw new Error(result.error || "Unknown error");
        return { success: true, error: null, itemId: result.item.id };
      })
      .catch((error) => {
        console.error(`Error creating ${itemType}:`, error);
        return { success: false, error: error.message };
      });
  },
};

module.exports = { CommunityHub };
