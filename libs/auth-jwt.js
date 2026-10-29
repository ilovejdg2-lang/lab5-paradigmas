/**
 * Validación de access tokens JWT (Auth0 u emisor de prueba).
 * Comprueba firma, emisor, audiencia y vencimiento con jose.
 */

var jose = require('jose');

/**
 * @param {object} config - salida de loadAuthConfig
 * @returns {Promise<(token: string) => Promise<object>>}
 */
async function createAccessTokenVerifier(config) {
  var issuer = config.issuer;
  var audience = config.audience;
  var key;

  if (config.publicKeyPem) {
    key = await jose.importSPKI(config.publicKeyPem, 'RS256');
  } else {
    key = jose.createRemoteJWKSet(new URL(config.jwksUrl));
  }

  return async function verifyAccessToken(token) {
    if (!token || typeof token !== 'string') {
      var missing = new Error('Token ausente');
      missing.code = 'TOKEN_MISSING';
      throw missing;
    }

    try {
      var result = await jose.jwtVerify(token, key, {
        issuer: issuer,
        audience: audience,
        algorithms: ['RS256']
      });
      return result.payload;
    } catch (err) {
      var wrapped = new Error('Token inválido o vencido');
      wrapped.code = 'TOKEN_INVALID';
      wrapped.cause = err;
      throw wrapped;
    }
  };
}

/**
 * Extrae Bearer token de un header Authorization.
 */
function bearerFromHeader(header) {
  if (!header || typeof header !== 'string') {
    return '';
  }
  var m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

/**
 * Auth0 a menudo pone en el access token solo `sub` (p. ej. google-oauth2|…).
 * Eso no es un nombre legible para el chat.
 */
function looksLikeProviderSubject(value, sub) {
  var text = value == null ? '' : String(value).trim();
  if (!text) return true;
  if (sub && text === String(sub)) return true;
  return /^(google-oauth2|auth0|facebook|github|windowslive|twitter|apple|linkedin|line|oauth2)\|/i.test(
    text
  );
}

function pickDisplayName(claims, fallbackSub) {
  if (!claims) return fallbackSub || 'Usuario';
  var candidates = [claims.name, claims.nickname, claims.given_name, claims.email];
  for (var i = 0; i < candidates.length; i++) {
    var value = candidates[i] == null ? '' : String(candidates[i]).trim();
    if (value && !looksLikeProviderSubject(value, fallbackSub)) {
      return value;
    }
  }
  return fallbackSub || 'Usuario';
}

/**
 * Identidad de presentación a partir del payload verificado.
 * Nunca confiar en campos enviados por el cliente para suplantar a otro usuario.
 */
function identityFromPayload(payload) {
  var sub = payload && payload.sub ? String(payload.sub) : '';
  if (!sub) {
    var err = new Error('El token no incluye sub');
    err.code = 'TOKEN_NO_SUB';
    throw err;
  }
  return {
    sub: sub,
    name: pickDisplayName(payload, sub),
    email: payload.email ? String(payload.email) : '',
    picture: payload.picture ? String(payload.picture) : '',
    exp: typeof payload.exp === 'number' ? payload.exp : 0
  };
}

/**
 * Completa nombre/foto/email vía Auth0 /userinfo cuando el access token no los trae.
 * Si falla (p. ej. emisor de prueba local), conserva la identidad del JWT.
 */
async function enrichIdentityFromUserInfo(accessToken, identity, issuerBaseUrl) {
  if (!accessToken || !identity || !issuerBaseUrl) {
    return identity;
  }
  var needsProfile =
    looksLikeProviderSubject(identity.name, identity.sub) ||
    !identity.email ||
    !identity.picture;
  if (!needsProfile) {
    return identity;
  }

  var base = String(issuerBaseUrl).replace(/\/+$/, '');
  var url = base + '/userinfo';
  try {
    var res = await fetch(url, {
      headers: {
        Authorization: 'Bearer ' + accessToken,
        Accept: 'application/json'
      }
    });
    if (!res.ok) {
      return identity;
    }
    var profile = await res.json();
    if (!profile || typeof profile !== 'object') {
      return identity;
    }
    identity.name = pickDisplayName(profile, identity.sub);
    if (profile.email && !identity.email) {
      identity.email = String(profile.email);
    }
    if (profile.picture && !identity.picture) {
      identity.picture = String(profile.picture);
    }
  } catch (err) {
    // Emisores de prueba o red: no bloquear el chat.
  }
  return identity;
}

/**
 * Identidad final para sockets/HTTP: JWT verificado + perfil Auth0 si hace falta.
 */
async function resolveIdentity(accessToken, payload, issuerBaseUrl) {
  var identity = identityFromPayload(payload);
  return enrichIdentityFromUserInfo(accessToken, identity, issuerBaseUrl);
}

module.exports = {
  createAccessTokenVerifier: createAccessTokenVerifier,
  bearerFromHeader: bearerFromHeader,
  identityFromPayload: identityFromPayload,
  looksLikeProviderSubject: looksLikeProviderSubject,
  pickDisplayName: pickDisplayName,
  enrichIdentityFromUserInfo: enrichIdentityFromUserInfo,
  resolveIdentity: resolveIdentity
};
