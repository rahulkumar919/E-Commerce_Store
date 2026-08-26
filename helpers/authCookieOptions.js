function authCookieOptions() {
  const secure =
    process.env.NODE_ENV === "production" ||
    process.env.COOKIE_SECURE === "true";
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
  };
}

module.exports = authCookieOptions;
