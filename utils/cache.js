const Redis = require('ioredis')
const { promisify } = require('util')
const redisClient = new Redis();

module.exports = class Cache {
  static get(key) {
    const syncRedisGet = promisify(redisClient.get).bind(redisClient);
    return syncRedisGet(key);
  }

  static set(key, value) {
    const syncRedisSet = promisify(redisClient.set).bind(redisClient);
    return syncRedisSet(key, value, 'ex', 3600);
  }

  static del(key) {
    const syncRedisGet = promisify(redisClient.del).bind(redisClient);
    return syncRedisGet(key);
  }
}