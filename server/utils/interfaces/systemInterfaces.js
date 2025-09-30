// Shared interfaces to prevent circular dependencies
const EventEmitter = require("events");

class SystemEventEmitter extends EventEmitter {}
const systemEvents = new SystemEventEmitter();

// Shared state and types
const SYSTEM_STATES = {
  READY: "ready",
  PROCESSING: "processing",
  ERROR: "error",
};

const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
  SYSTEM: "system",
};

// Shared utilities that don't depend on other modules
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

module.exports = {
  systemEvents,
  SYSTEM_STATES,
  USER_ROLES,
  isValidUrl,
  safeJsonParse,
};
