const NodeCache = require('node-cache');

const TTL = {
  SHORT:  60,
  MEDIUM: 5 * 60,
  LONG:   30 * 60,
};

const cache = new NodeCache({ stdTTL: TTL.MEDIUM, checkperiod: 60 });

async function getOrSet(key, fn, ttl = TTL.MEDIUM) {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const data = await fn();
  cache.set(key, data, ttl);
  return data;
}

function invalidate(prefix) {
  const keys = cache.keys().filter(k => k.startsWith(prefix));
  if (keys.length) cache.del(keys);
}

function invalidateAll() {
  cache.flushAll();
}

module.exports = { cache, getOrSet, invalidate, invalidateAll, TTL };