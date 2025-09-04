process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();
const { User } = require("../../models/user");
const { jsonrepair } = require("jsonrepair");
const extract = require("extract-json-from-string");
const { validateSupabaseJWT } = require("../supabase");
const { makeJWT, decodeJWT } = require("../jwt");

function reqBody(request) {
  return typeof request.body === "string"
    ? JSON.parse(request.body)
    : request.body;
}

function queryParams(request) {
  return request.query;
}


// Note: Only valid for finding users in multi-user mode
// as single-user mode with password is not a "user"
async function userFromSession(request, response = null) {
  if (!!response && !!response.locals?.user) {
    return response.locals.user;
  }

  const auth = request.header("Authorization");
  const token = auth ? auth.split(" ")[1] : null;

  if (!token) {
    return null;
  }

  // Try Supabase JWT validation first
  const { user: supabaseUser, error: supabaseError } = await validateSupabaseJWT(token);
  if (supabaseUser && !supabaseError) {
    // Sync or create local user from Supabase user
    const { user: localUser } = await User.createFromSupabase(supabaseUser);
    if (localUser) {
      return localUser;
    }
  }

  // Fallback to local JWT validation for backward compatibility
  const valid = decodeJWT(token);
  if (!valid || !valid.id) {
    return null;
  }

  const user = await User.get({ id: valid.id });
  return user;
}


function multiUserMode(response) {
  return response?.locals?.multiUserMode;
}

function parseAuthHeader(headerValue = null, apiKey = null) {
  if (headerValue === null || apiKey === null) return {};
  if (headerValue === "Authorization")
    return { Authorization: `Bearer ${apiKey}` };
  return { [headerValue]: apiKey };
}

function safeJsonParse(jsonString, fallback = null) {
  if (jsonString === null) return fallback;

  try {
    return JSON.parse(jsonString);
  } catch {}

  if (jsonString?.startsWith("[") || jsonString?.startsWith("{")) {
    try {
      const repairedJson = jsonrepair(jsonString);
      return JSON.parse(repairedJson);
    } catch {}
  }

  try {
    return extract(jsonString)?.[0] || fallback;
  } catch {}

  return fallback;
}

function isValidUrl(urlString = "") {
  try {
    const url = new URL(urlString);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    return true;
  } catch (e) {}
  return false;
}

function toValidNumber(number = null, fallback = null) {
  if (isNaN(Number(number))) return fallback;
  return Number(number);
}

const { validatedRequest } = require("../middleware/validatedRequest");

module.exports = {
  reqBody,
  multiUserMode,
  queryParams,
  makeJWT,
  decodeJWT,
  userFromSession,
  parseAuthHeader,
  safeJsonParse,
  isValidUrl,
  toValidNumber,
  validatedRequest,
};
