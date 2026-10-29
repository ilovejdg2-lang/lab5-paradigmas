require('dotenv').config();

var path = require('path');
var express = require('express');
var httpLib = require('http');
var { Server } = require('socket.io');
var validation = require('./libs/unalib');
var { loadAuthConfig, loadPublicSpaConfig } = require('./libs/auth-config');
var {
  createAccessTokenVerifier,
  bearerFromHeader,
  resolveIdentity
} = require('./libs/auth-jwt');
var { attachRedisAdapter } = require('./libs/redis-adapter');

var app = express();
var http = httpLib.Server(app);

var authConfig;
var verifyAccessToken;
var redisHandle = { enabled: false };
var bootError = null;

try {
  authConfig = loadAuthConfig(process.env);
} catch (err) {
  bootError = err;
  authConfig = {
    frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    issuer: '',
    audience: '',
    redisUrl: process.env.REDIS_URL || ''
  };
}

var io = new Server(http, {
  cors: {
    origin: authConfig.frontendOrigin,
    methods: ['GET', 'POST']
  },
  // En Vercel el long-polling no es fiable para Socket.IO multi-instancia
  transports: ['websocket', 'polling']
});

app.use(function corsMiddleware(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', authConfig.frontendOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.get('/health', function (req, res) {
  res.json({
    ok: !bootError,
    redisAdapter: !!(redisHandle && redisHandle.enabled),
    authConfigured: !bootError
  });
});

app.get('/auth-config', function (req, res) {
  if (bootError) {
    return res.status(500).json({
      error: 'Configuración incompleta',
      detail: bootError.message,
      variable: bootError.variable || null
    });
  }
  try {
    return res.json(loadPublicSpaConfig(process.env));
  } catch (err) {
    return res.status(500).json({
      error: 'Configuración incompleta',
      detail: err.message,
      variable: err.variable || null
    });
  }
});

/** Endpoint HTTP de ejemplo protegido (access token). */
app.get('/api/me', async function (req, res) {
  if (bootError || !verifyAccessToken) {
    return res.status(503).json({ error: 'Auth no configurada' });
  }
  try {
    var token = bearerFromHeader(req.headers.authorization);
    var payload = await verifyAccessToken(token);
    var identity = await resolveIdentity(token, payload, authConfig.issuer);
    return res.json({
      sub: identity.sub,
      name: identity.name,
      email: identity.email || null,
      picture: identity.picture || null
    });
  } catch (err) {
    var status = err.code === 'TOKEN_MISSING' ? 401 : 401;
    return res.status(status).json({ error: 'No autorizado', code: err.code || 'TOKEN_INVALID' });
  }
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use('/public', express.static(path.join(__dirname, 'public')));

function scheduleTokenWatch(socket) {
  var exp = socket.data.user && socket.data.user.exp;
  if (!exp) {
    return;
  }
  var ms = exp * 1000 - Date.now() - 5000;
  if (ms < 0) {
    socket.emit('auth:expired', { message: 'Tu sesión expiró. Volvé a iniciar sesión.' });
    socket.disconnect(true);
    return;
  }
  var timer = setTimeout(function () {
    socket.emit('auth:expired', { message: 'Tu sesión expiró. Volvé a iniciar sesión.' });
    socket.disconnect(true);
  }, Math.min(ms, 2147483647));
  socket.on('disconnect', function () {
    clearTimeout(timer);
  });
}

io.use(async function (socket, next) {
  if (bootError || !verifyAccessToken) {
    return next(new Error('AUTH_NOT_CONFIGURED'));
  }
  try {
    var token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token && socket.handshake.headers && socket.handshake.headers.authorization) {
      token = bearerFromHeader(socket.handshake.headers.authorization);
    }
    var payload = await verifyAccessToken(token);
    socket.data.user = await resolveIdentity(token, payload, authConfig.issuer);
    return next();
  } catch (err) {
    var code = err.code === 'TOKEN_MISSING' ? 'AUTH_REQUIRED' : 'AUTH_INVALID';
    return next(new Error(code));
  }
});

io.on('connection', function (socket) {
  scheduleTokenWatch(socket);

  socket.emit('auth:ready', {
    sub: socket.data.user.sub,
    name: socket.data.user.name,
    email: socket.data.user.email || null,
    picture: socket.data.user.picture || null
  });

  socket.on('Evento-Mensaje-Server', function (msg) {
    var user = socket.data.user;
    if (!user || !user.sub) {
      socket.emit('chat:error', { message: 'No autorizado para enviar mensajes.' });
      return;
    }

    var parsed;
    try {
      parsed = typeof msg === 'string' ? JSON.parse(msg) : msg;
    } catch (e) {
      parsed = {};
    }

    // Identidad del emisor = sub validado. El cliente no puede suplantar a otro usuario.
    var safe = {
      nombre: user.name,
      mensaje: parsed && typeof parsed.mensaje === 'string' ? parsed.mensaje : '',
      color: parsed && typeof parsed.color === 'string' ? parsed.color : '#000000',
      userId: user.sub
    };

    var validated = validation.validateMessage(JSON.stringify(safe));
    io.emit('Evento-Mensaje-Server', validated);
  });
});

async function prepareAuth() {
  if (bootError) {
    return;
  }
  verifyAccessToken = await createAccessTokenVerifier(authConfig);
  redisHandle = await attachRedisAdapter(io, authConfig.redisUrl);
}

var preparePromise = prepareAuth().catch(function (err) {
  bootError = bootError || err;
  console.error('No se pudo preparar autenticación:', err.message);
});

function start(listenPort) {
  return preparePromise.then(function () {
    return new Promise(function (resolve) {
      http.listen(listenPort, function () {
        resolve(http);
      });
    });
  });
}

if (require.main === module) {
  var port = process.env.PORT || 3000;
  start(port).then(function () {
    if (bootError) {
      console.error('ADVERTENCIA: el servidor arrancó con error de configuración:', bootError.message);
    }
    console.log('listening on *:' + port);
    if (redisHandle && redisHandle.enabled) {
      console.log('Socket.IO Redis adapter activo');
    }
  });
}

module.exports = {
  app: app,
  server: http,
  io: io,
  start: start,
  preparePromise: preparePromise,
  getBootError: function () { return bootError; },
  getVerifyAccessToken: function () { return verifyAccessToken; }
};
