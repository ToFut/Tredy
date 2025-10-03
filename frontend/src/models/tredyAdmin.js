import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const TredyAdmin = {
  /**
   * List all marketplace items
   */
  listItems: async ({ limit = 100, offset = 0, itemType = null } = {}) => {
    const params = new URLSearchParams({ limit, offset });
    if (itemType) params.append("itemType", itemType);

    return await fetch(`${API_BASE}/tredy-admin/marketplace/items?${params}`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  /**
   * Create a new agent skill with ZIP upload
   */
  createSkill: async (formData) => {
    // FormData already includes the file, so don't set Content-Type
    // Browser will set it with boundary for multipart/form-data
    const headers = baseHeaders();
    delete headers["Content-Type"]; // Remove to let browser set it

    return await fetch(`${API_BASE}/tredy-admin/marketplace/create-skill`, {
      method: "POST",
      headers,
      body: formData, // FormData object with file
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  /**
   * Create system prompt or slash command
   */
  createItem: async (data) => {
    return await fetch(`${API_BASE}/tredy-admin/marketplace/create-item`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  /**
   * Update marketplace item
   */
  updateItem: async (itemId, updates) => {
    return await fetch(`${API_BASE}/tredy-admin/marketplace/items/${itemId}`, {
      method: "PATCH",
      headers: baseHeaders(),
      body: JSON.stringify(updates),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  /**
   * Delete marketplace item
   */
  deleteItem: async (itemId) => {
    return await fetch(`${API_BASE}/tredy-admin/marketplace/items/${itemId}`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  /**
   * Get analytics
   */
  getAnalytics: async () => {
    return await fetch(`${API_BASE}/tredy-admin/analytics`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  /**
   * Assign skills to organization
   */
  assignSkillsToOrganization: async (organizationId, skillIds) => {
    return await fetch(`${API_BASE}/organizations/${organizationId}/assign-skills`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ skillIds }),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  /**
   * Get organization assigned skills
   */
  getOrganizationSkills: async (organizationId) => {
    return await fetch(`${API_BASE}/organizations/${organizationId}/skills`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  /**
   * List existing workflows from storage
   */
  listExistingWorkflows: async () => {
    return await fetch(`${API_BASE}/tredy-admin/existing-workflows`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  /**
   * List existing agent skills from storage
   */
  listExistingAgentSkills: async () => {
    return await fetch(`${API_BASE}/tredy-admin/existing-agent-skills`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },
};

export default TredyAdmin;
