/**
 * Entrada para Vercel Functions (exporta el HTTP server con Socket.IO).
 * Requiere Fluid Compute y, para chat multi-instancia, REDIS_URL.
 */
module.exports = require('./server').server;
