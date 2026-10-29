var assert = require('assert');
var {
  createAccessTokenVerifier,
  identityFromPayload,
  bearerFromHeader,
  looksLikeProviderSubject,
  pickDisplayName
} = require('../libs/auth-jwt');
var { loadAuthConfig } = require('../libs/auth-config');
var {
  applyTestAuthEnv,
  signAccessToken,
  ISSUER,
  AUDIENCE,
  publicKey
} = require('./helpers/test-jwt');

describe('auth-jwt (validación real RS256)', function () {
  var verify;

  before(async function () {
    applyTestAuthEnv();
    var config = loadAuthConfig(process.env);
    assert.strictEqual(config.publicKeyPem, publicKey);
    verify = await createAccessTokenVerifier(config);
  });

  it('acepta un access token válido con issuer y audience correctos', async function () {
    var token = await signAccessToken({ sub: 'auth0|ok', name: 'Ana' });
    var payload = await verify(token);
    assert.strictEqual(payload.sub, 'auth0|ok');
    assert.strictEqual(payload.name, 'Ana');
  });

  it('rechaza token ausente', async function () {
    await assert.rejects(function () { return verify(''); }, /Token/);
  });

  it('rechaza token con firma inválida', async function () {
    var token = await signAccessToken({ sub: 'auth0|x' });
    var broken = token.slice(0, -4) + 'XXXX';
    await assert.rejects(function () { return verify(broken); }, /Token/);
  });

  it('rechaza token vencido', async function () {
    var token = await signAccessToken({ sub: 'auth0|old' }, { expired: true });
    await assert.rejects(function () { return verify(token); }, /Token/);
  });

  it('rechaza audience incorrecta', async function () {
    var token = await signAccessToken({ sub: 'auth0|x' }, { audience: 'https://otra-api' });
    await assert.rejects(function () { return verify(token); }, /Token/);
  });

  it('rechaza emisor incorrecto', async function () {
    var token = await signAccessToken({ sub: 'auth0|x' }, { issuer: 'https://evil.example/' });
    await assert.rejects(function () { return verify(token); }, /Token/);
  });

  it('identityFromPayload usa sub verificado y no inventa privilegios', function () {
    var id = identityFromPayload({ sub: 'auth0|1', name: 'Ana', email: 'a@b.c' });
    assert.strictEqual(id.sub, 'auth0|1');
    assert.strictEqual(id.name, 'Ana');
  });

  it('no usa el sub de Google como nombre visible', function () {
    var sub = 'google-oauth2|109647018030323905453';
    assert.strictEqual(looksLikeProviderSubject(sub, sub), true);
    assert.strictEqual(pickDisplayName({ sub: sub, name: sub }, sub), sub);
    assert.strictEqual(
      pickDisplayName({ sub: sub, name: sub, nickname: 'Marimar' }, sub),
      'Marimar'
    );
    var id = identityFromPayload({ sub: sub, name: sub, email: 'marimar@gmail.com' });
    assert.strictEqual(id.name, 'marimar@gmail.com');
  });

  it('bearerFromHeader extrae el token', function () {
    assert.strictEqual(bearerFromHeader('Bearer abc.def'), 'abc.def');
    assert.strictEqual(bearerFromHeader(''), '');
  });

  it('documenta issuer/audience de prueba', function () {
    assert.strictEqual(ISSUER, 'https://test-issuer.local/');
    assert.strictEqual(AUDIENCE, 'https://una-chat-api');
  });
});
