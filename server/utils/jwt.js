const JWT = require("jsonwebtoken");

/**
 * Creates a JWT with the given info and expiry
 * @param {object} info - The info to include in the JWT
 * @param {string} expiry - The expiry time for the JWT (default: 30 days)
 * @returns {string} The JWT
 */
function makeJWT(info = {}, expiry = "30d") {
  if (!process.env.JWT_SECRET)
    throw new Error("Cannot create JWT as JWT_SECRET is unset.");
  return JWT.sign(info, process.env.JWT_SECRET, { expiresIn: expiry });
}

function decodeJWT(jwtToken) {
  try {
    return JWT.verify(jwtToken, process.env.JWT_SECRET);
  } catch {}
  return { p: null, id: null, username: null };
}

module.exports = {
  makeJWT,
  decodeJWT,
};
