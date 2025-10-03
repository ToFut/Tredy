const SingleTenancy = require("./providers/single");
const MultiTenancy = require("./providers/multi");

/**
 * Get the tenancy provider based on environment configuration
 * Follows AnythingLLM's provider pattern (like getVectorDbClass, getLLMProvider)
 *
 * Usage:
 *   const tenancy = getTenancyProvider();
 *   const canAccess = await tenancy.canUserAccessWorkspace(user, workspaceId);
 *   const hasPurchase = await tenancy.hasMarketplacePurchase(user, hubId, itemType);
 *
 * Environment Variables:
 *   TENANCY_MODE=single (default) - No organizations, individual purchases
 *   TENANCY_MODE=multi - Organizations enabled, org-level purchases
 */
function getTenancyProvider() {
  const mode = process.env.TENANCY_MODE || "single";

  switch (mode.toLowerCase()) {
    case "single":
      return new SingleTenancy();
    case "multi":
      return new MultiTenancy();
    default:
      console.warn(
        `Unknown tenancy mode: ${mode}. Falling back to single-tenant mode.`
      );
      return new SingleTenancy();
  }
}

/**
 * Get tenancy mode string
 * @returns {string} Current tenancy mode
 */
function getTenancyMode() {
  return process.env.TENANCY_MODE || "single";
}

/**
 * Check if multi-tenant mode is enabled
 * @returns {boolean} Whether organizations are enabled
 */
function isMultiTenant() {
  return getTenancyMode() === "multi";
}

module.exports = {
  getTenancyProvider,
  getTenancyMode,
  isMultiTenant,
};
