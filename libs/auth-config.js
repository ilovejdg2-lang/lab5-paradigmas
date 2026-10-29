/**
 * Configuración de autenticación (servidor).
 * No expone secretos: Auth0 SPA no usa Client Secret en el backend de esta app.
 */

function trimSlash(url) {
  return String(url || '').replace(/\/+$/, '');
}

function required(name, value) {
  if (!value || !String(value).trim()) {
    var err = new Error(
      'Falta la variable de entorno obligatoria ' + name +
      '. Copiá .env.example a .env y completá los valores. Ver README.'
    );
    err.code = 'ENV_MISSING';
    err.variable = name;
    throw err;
  }
  return String(value).trim();
}

function loadAuthConfig(env) {
  env = env || process.env;
  var issuerBase = required('AUTH0_ISSUER_BASE_URL', env.AUTH0_ISSUER_BASE_URL);
  if (!/^https:\/\//i.test(issuerBase)) {
    throw new Error('AUTH0_ISSUER_BASE_URL debe ser una URL https://...');
  }
  issuerBase = trimSlash(issuerBase) + '/';
  var audience = required('AUTH0_AUDIENCE', env.AUTH0_AUDIENCE);
  var frontendOrigin = required('FRONTEND_ORIGIN', env.FRONTEND_ORIGIN || 'http://localhost:3000');
  frontendOrigin = trimSlash(frontendOrigin);

  var publicKey = env.AUTH_JWT_PUBLIC_KEY
    ? env.AUTH_JWT_PUBLIC_KEY.replace(/\\n/g, '\n')
    : '';

  return {
    issuer: issuerBase,
    audience: audience,
    frontendOrigin: frontendOrigin,
    jwksUrl: issuerBase + '.well-known/jwks.json',
    publicKeyPem: publicKey,
    port: Number(env.PORT || 3000),
    redisUrl: env.REDIS_URL ? String(env.REDIS_URL).trim() : '',
    auth0Domain: trimSlash(issuerBase.replace(/^https:\/\//i, '').replace(/\/$/, '')),
    // Valores públicos para el frontend (inyectados sin secretos)
    spaDomain: env.AUTH0_DOMAIN || trimSlash(issuerBase.replace(/^https:\/\//i, '')),
    spaClientId: env.AUTH0_CLIENT_ID || '',
    spaAudience: audience
  };
}

function loadPublicSpaConfig(env) {
  env = env || process.env;
  var cfg = loadAuthConfig(env);
  var domain = required('AUTH0_DOMAIN', env.AUTH0_DOMAIN || cfg.spaDomain);
  var clientId = required('AUTH0_CLIENT_ID', env.AUTH0_CLIENT_ID);
  return {
    domain: domain,
    clientId: clientId,
    audience: cfg.audience,
    redirectUri: cfg.frontendOrigin,
    socketUrl: env.SOCKET_PUBLIC_URL || cfg.frontendOrigin
  };
}

module.exports = {
  loadAuthConfig: loadAuthConfig,
  loadPublicSpaConfig: loadPublicSpaConfig,
  trimSlash: trimSlash
};
