/**
 * Adapter Redis para Socket.IO (fan-out entre instancias en Vercel).
 * Solo se activa si REDIS_URL está definida.
 */

async function attachRedisAdapter(io, redisUrl) {
  if (!redisUrl) {
    return { enabled: false, reason: 'REDIS_URL no configurada' };
  }

  var redis = require('redis');
  var createAdapter = require('@socket.io/redis-adapter').createAdapter;

  var pubClient = redis.createClient({ url: redisUrl });
  var subClient = pubClient.duplicate();

  pubClient.on('error', function (err) {
    console.error('Redis pub error:', err.message);
  });
  subClient.on('error', function (err) {
    console.error('Redis sub error:', err.message);
  });

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  return {
    enabled: true,
    close: async function () {
      await Promise.all([pubClient.quit(), subClient.quit()]);
    }
  };
}

module.exports = { attachRedisAdapter: attachRedisAdapter };
