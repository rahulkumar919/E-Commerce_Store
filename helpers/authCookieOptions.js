/**
 * authCookieOptions.js
 * ─────────────────────
 * Cross-domain production cookies need SameSite=None + Secure=true.
 * Vercel always runs HTTPS, so we force secure=true when not on localhost.
 */
function authCookieOptions() {
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";
  const isProd = process.env.NODE_ENV === "production";
  const isLocalDev =
    !isVercel &&
    !isProd &&
    (process.env.NODE_ENV === "development" ||
      (process.env.FRONTEND_URL || "").includes("localhost"));

  const secure = !isLocalDev;

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    partitioned: secure,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours in ms
  };
}

module.exports = authCookieOptions;
