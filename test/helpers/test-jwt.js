/**
 * Par RSA fijo de prueba + firmas JWT reales (jose).
 * No son secretos de producción; solo para Mocha/Jest/Playwright.
 */

var jose = require('jose');

var ISSUER = 'https://test-issuer.local/';
var AUDIENCE = 'https://una-chat-api';

var publicKey =
  '-----BEGIN PUBLIC KEY-----\n' +
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkSrOqxSqQJpwIZnlDiO6\n' +
  'lJfgfgNqtnH46tSk/7Iatvq1gkR0YAEn5TSkwxpk0oxMPGzHso+BXDio9rTHGBEd\n' +
  '4CASH9U3D/q320iIQvjqfNiA4q7VHCRYErFLfOEFgsCi2dGi7ulubc/SzpV+kQ/8\n' +
  '2XWLMM/1iHd4sIJZ8hNBdpEEp4lFEsvLJxjgcL+MD3NY0XPDvb28v7Q9DdQPSpM/\n' +
  '3snlMAiyOgFwbni3DI+woqltKYEcjpksg8dkZ5i63l2t9EPou/J9jIIDoTG86p+f\n' +
  'ug9MwF4UmoCALpbm4/4piiOiLeqsD+a/w3oyOe4YmeNPzY+ljOTrPFzd6T5U6iIu\n' +
  'oQIDAQAB\n' +
  '-----END PUBLIC KEY-----\n';

var privateKey =
  '-----BEGIN PRIVATE KEY-----\n' +
  'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCRKs6rFKpAmnAh\n' +
  'meUOI7qUl+B+A2q2cfjq1KT/shq2+rWCRHRgASflNKTDGmTSjEw8bMeyj4FcOKj2\n' +
  'tMcYER3gIBIf1TcP+rfbSIhC+Op82IDirtUcJFgSsUt84QWCwKLZ0aLu6W5tz9LO\n' +
  'lX6RD/zZdYswz/WId3iwglnyE0F2kQSniUUSy8snGOBwv4wPc1jRc8O9vby/tD0N\n' +
  '1A9Kkz/eyeUwCLI6AXBueLcMj7CiqW0pgRyOmSyDx2RnmLreXa30Q+i78n2MggOh\n' +
  'Mbzqn5+6D0zAXhSagIAulubj/imKI6It6qwP5r/DejI57hiZ40/Nj6WM5Os8XN3p\n' +
  'PlTqIi6hAgMBAAECggEADH1pDVct1CPK2gPqV+5tszM4tsmHI5i9bexLIKTWSkAF\n' +
  'Nea7NzdiPgTq2CPWi4xT/YRDz50r6B9dNOdrlH/Z2Nq+3yDyfTF5ItN5cH8HeHkN\n' +
  'kx4FFUgbO8sn+jVHdW8q6SAcVf9Hkl3QfsMQrLJ6HXZQ5NY/rd95nCuFnvUBK45A\n' +
  'HHomlb+EaHGB7RNVdO7U2IuOjD7ruxG01WkUbntd9sZJNZG43EfXLjv/IbMPm6Nb\n' +
  'UIbyeO9lF9z/nHRbhyXrcTBAz7fJsrTnLZyn9z3J6IT0+gWbZsI7+oKg/cTK/kNf\n' +
  'ZFIKAwxpmfyDhYkUsOY9A/CCiPb86Tb7BHGvn5K3MQKBgQDDoI8BUuJWg2V/abRG\n' +
  '1AIvXyayjddtbGuIDHuhHjQpiolKdkfwQIGC5r7iZJdVMvP/Y1DwDu0fdnFoAduC\n' +
  'jHFxNy6zNYLjpPsvM2pTbG5paQbs57yZN6rd70ipb5V5oZDyUQcQOFmDCDQ4IVim\n' +
  'p3TZGnjXICe/nNse3LkBDEAUCwKBgQC9965GqO86xTXYGjycsTqZpSG0hJTFZeyE\n' +
  'fyuNIFWQJe6kPG9KBosXNGhKE4+xwcei/Tt6iGzhzb2GDBbPzK5vYseDX6qt0/of\n' +
  'cBY3fwVFxOL07aPWt0QqmPWzaxDwLagKfy1qVgTiXabS9VNNDVt9cOqQfdyQKVk8\n' +
  '/JF98QbngwKBgB2x1YNB7ZFsSI/an77Ql7RRITKhTT4S4w+3tVxzlT9pBAYFhk31\n' +
  'vLL+C6OZ2U7ZeSgfDz4hReUsuXIsNgHPB7lDwxb43HFpracwisc3AluF0cNMOdiY\n' +
  'Fpuxorn1ch8QY0wk+ImBxDSbnjGW/jnt2VLLLeSZwO7ZBHnez0ZVcbSZAoGBAKyT\n' +
  'YqZceCBK4jR0+VVcCCFmi60juMdvZaOkp9roYfK3EwnuwSddtGQbPxb0mFji8srW\n' +
  'BH+3ijrEHoW1W8/hYSJdeWSWt0Z9ST/gIr69zPtp9siNTocULIAKP0OEY3nd8EfA\n' +
  '63ArvvoqHBCPv+JC3TejKeSkAoiQl7o4tK/WE/CjAoGBAJYqFpOx0YmmIDFEeWwb\n' +
  '8LZbMJiMoFPjm/hfhgTc3cGI/3EoVOtCaXRcJNgqkoGWXM3FvTH5iZ9+im6TsK8e\n' +
  'iil/mQb7fpISLSVmarF0IO05m+EyNlNPwpqRQLNBzfm/ilgW8ypUyEqcQ4KWARMm\n' +
  'Tczf0t3PzRI+F99Rt/wMqKaS\n' +
  '-----END PRIVATE KEY-----\n';

var privateKeyPromise = jose.importPKCS8(privateKey, 'RS256');

function applyTestAuthEnv() {
  process.env.AUTH0_ISSUER_BASE_URL = ISSUER;
  process.env.AUTH0_AUDIENCE = AUDIENCE;
  process.env.AUTH0_DOMAIN = 'test-issuer.local';
  process.env.AUTH0_CLIENT_ID = 'test-client-id';
  process.env.FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:3100';
  process.env.SOCKET_PUBLIC_URL = process.env.SOCKET_PUBLIC_URL || process.env.FRONTEND_ORIGIN;
  process.env.AUTH_JWT_PUBLIC_KEY = publicKey;
}

async function signAccessToken(claims, options) {
  options = options || {};
  var key = await privateKeyPromise;
  var exp = options.expiresIn != null ? options.expiresIn : '2h';
  var builder = new jose.SignJWT({
    name: claims.name || 'Ana',
    email: claims.email || 'ana@example.com',
    picture: claims.picture || undefined
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setSubject(claims.sub || 'auth0|ana-test')
    .setIssuer(options.issuer || ISSUER)
    .setAudience(options.audience || AUDIENCE)
    .setIssuedAt();

  if (exp === 0 || options.expired) {
    builder.setExpirationTime(Math.floor(Date.now() / 1000) - 60);
  } else {
    builder.setExpirationTime(exp);
  }

  return builder.sign(key);
}

module.exports = {
  ISSUER: ISSUER,
  AUDIENCE: AUDIENCE,
  publicKey: publicKey,
  privateKey: privateKey,
  applyTestAuthEnv: applyTestAuthEnv,
  signAccessToken: signAccessToken
};
