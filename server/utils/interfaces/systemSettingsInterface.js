const { systemEvents } = require("./systemInterfaces");
const { v4: uuidv4 } = require("uuid");

// System settings types and constants
const SYSTEM_SETTINGS = {
  PROTECTED_FIELDS: ["multi_user_mode", "hub_api_key"],
  PUBLIC_FIELDS: [
    "footer_data",
    "support_email",
    "text_splitter_chunk_size",
    "text_splitter_chunk_overlap",
    "max_embed_chunk_size",
    "agent_search_provider",
    "agent_sql_connections",
    "agent_connector_providers",
    "default_agent_skills",
    "disabled_agent_skills",
    "imported_agent_skills",
    "custom_app_name",
    "feature_flags",
    "meta_page_title",
    "meta_page_favicon",
  ],
};

// Validation functions
function validateSetting(key, value) {
  const validators = {
    footer_data: (val) => {
      try {
        return JSON.parse(val)
          .filter((setting) => isValidUrl(setting.url))
          .slice(0, 3);
      } catch (e) {
        return [];
      }
    },
    text_splitter_chunk_size: (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 ? num : 1000;
    },
    // Add other validators as needed
  };
  return validators[key] ? validators[key](value) : value;
}

// Event emitters for system settings
function emitSettingUpdate(key, value) {
  systemEvents.emit("setting:update", { key, value });
}

function onSettingUpdate(callback) {
  systemEvents.on("setting:update", callback);
}

module.exports = {
  SYSTEM_SETTINGS,
  validateSetting,
  emitSettingUpdate,
  onSettingUpdate,
};
