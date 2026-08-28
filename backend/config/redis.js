/**
 * Redis cache using Upstash REST API (@upstash/redis)
 * Upstash free tier compatible — no SCAN (too slow), uses explicit key tracking for patterns
 * Falls back to in-memory cache when credentials are not set
 */
const { Redis } = require("@upstash/redis");

let upstash = null;
let upstashReady = false;

const getClient = () => {
  if (upstashReady) return upstash; // null means disabled

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  upstashReady = true;

  if (!url || !token) {
    console.warn("⚠️  Upstash Redis not configured — using in-memory cache");
    upstash = null;
    return null;
  }

  try {
    upstash = new Redis({ url, token });
    console.log("✅ Upstash Redis connected");
    return upstash;
  } catch (err) {
    console.warn("⚠️  Upstash Redis init failed:", err.message);
    upstash = null;
    return null;
  }
};

// ─── Known cache key groups for pattern-based invalidation ───────────────────
// Instead of SCAN (slow on free tier), we track all known keys per group
const KEY_GROUPS = {
  "categories:*": [
    "categories:all:plain",
    "categories:all:with_sub",
  ],
  "products:category:*": [], // populated at runtime
  "search:*": [],            // populated at runtime
};

const runtimeKeys = new Map(); // pattern → Set of keys

const registerKey = (key) => {
  for (const [pattern, staticKeys] of Object.entries(KEY_GROUPS)) {
    const prefix = pattern.replace("*", "");
    if (key.startsWith(prefix)) {
      if (!runtimeKeys.has(prefix)) runtimeKeys.set(prefix, new Set(staticKeys));
      runtimeKeys.get(prefix).add(key);
    }
  }
};

const getKeysByPattern = (pattern) => {
  const prefix = pattern.replace("*", "");
  const keys = new Set(KEY_GROUPS[pattern] || []);
  if (runtimeKeys.has(prefix)) {
    for (const k of runtimeKeys.get(prefix)) keys.add(k);
  }
  return [...keys];
};

// ─── In-memory fallback ───────────────────────────────────────────────────────
const memStore = new Map();
const memTTL = new Map();
const MEM_MAX = 300;

const memGet = (key) => {
  const exp = memTTL.get(key);
  if (exp && Date.now() > exp) { memStore.delete(key); memTTL.delete(key); return null; }
  return memStore.has(key) ? memStore.get(key) : null;
};
const memSet = (key, value, ttlSeconds) => {
  if (memStore.size >= MEM_MAX) {
    const firstKey = memStore.keys().next().value;
    memStore.delete(firstKey); memTTL.delete(firstKey);
  }
  memStore.set(key, value);
  memTTL.set(key, Date.now() + ttlSeconds * 1000);
};
const memDel = (key) => { memStore.delete(key); memTTL.delete(key); };
const memDelPattern = (pattern) => {
  const prefix = pattern.replace("*", "");
  for (const key of memStore.keys()) {
    if (key.startsWith(prefix)) { memStore.delete(key); memTTL.delete(key); }
  }
};

// ─── Public cache API ─────────────────────────────────────────────────────────
const cache = {
  async get(key) {
    const client = getClient();
    if (client) {
      try {
        return (await client.get(key)) ?? null;
      } catch (err) {
        console.warn("Cache get error:", err.message);
      }
    }
    return memGet(key);
  },

  async set(key, value, ttlSeconds = 300) {
    registerKey(key);
    const client = getClient();
    if (client) {
      try {
        await client.set(key, value, { ex: ttlSeconds });
        return;
      } catch (err) {
        console.warn("Cache set error:", err.message);
      }
    }
    memSet(key, value, ttlSeconds);
  },

  async del(key) {
    const client = getClient();
    if (client) {
      try { await client.del(key); return; } catch (err) { console.warn("Cache del error:", err.message); }
    }
    memDel(key);
  },

  async delPattern(pattern) {
    const keys = getKeysByPattern(pattern);
    // Also clear from in-memory (always safe)
    memDelPattern(pattern);

    const client = getClient();
    if (!client || keys.length === 0) return;

    try {
      // Delete all known keys in the pattern group — no SCAN needed
      await Promise.all(keys.map((k) => client.del(k).catch(() => {})));
    } catch (err) {
      console.warn("Cache delPattern error:", err.message);
    }
  },
};

module.exports = cache;
